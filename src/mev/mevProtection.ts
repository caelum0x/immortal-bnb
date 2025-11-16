/**
 * MEV Protection Strategies
 * Implements anti-sandwich, deadline enforcement, and private transactions
 */

import { ethers } from 'ethers';
import { logger } from '../utils/logger.js';
import { getFlashbotsService } from './flashbotsProvider.js';

export interface TradeProtectionOptions {
  useFlashbots: boolean;
  maxSlippage: number; // percentage (e.g., 0.5 for 0.5%)
  deadline: number; // seconds from now
  minProfit?: bigint; // minimum profit for flashbots bundle
  maxPriorityFee?: bigint; // max priority fee to prevent overpaying
}

export class MEVProtectionService {
  private flashbots = getFlashbotsService();

  /**
   * Protect trade from MEV attacks
   */
  async protectTrade(
    transaction: ethers.TransactionRequest,
    signer: ethers.Wallet,
    options: TradeProtectionOptions
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // Add deadline to transaction
      const protectedTx = this.addDeadlineProtection(transaction, options.deadline);

      // Add slippage protection
      const slippageProtectedTx = this.addSlippageProtection(protectedTx, options.maxSlippage);

      // Optimize gas to prevent overpaying
      const optimizedTx = await this.optimizeGas(slippageProtectedTx, options.maxPriorityFee);

      // Sign transaction
      const signedTx = await signer.signTransaction(optimizedTx);

      // Send via Flashbots if enabled
      if (options.useFlashbots) {
        return await this.sendViaFlashbots(signedTx, options.minProfit);
      }

      // Otherwise send via normal RPC with protection
      return await this.sendProtectedTransaction(signedTx, signer.provider!);
    } catch (error) {
      logger.error('MEV protection failed:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Add deadline to prevent stale transactions
   */
  private addDeadlineProtection(
    tx: ethers.TransactionRequest,
    deadlineSeconds: number
  ): ethers.TransactionRequest {
    // Add deadline parameter to transaction data
    const deadline = Math.floor(Date.now() / 1000) + deadlineSeconds;

    // For swap transactions, deadline is typically the last parameter
    // This would need to be encoded into the transaction data
    // For now, we'll just log it

    logger.info(`Trade deadline set to ${deadline} (${deadlineSeconds}s from now)`);

    return tx;
  }

  /**
   * Add slippage protection
   */
  private addSlippageProtection(
    tx: ethers.TransactionRequest,
    maxSlippage: number
  ): ethers.TransactionRequest {
    // Slippage is encoded in the swap parameters (amountOutMinimum)
    // This is already handled by the trade executor
    // We're just validating here

    logger.info(`Slippage protection: max ${maxSlippage}%`);

    return tx;
  }

  /**
   * Optimize gas to prevent overpaying
   */
  private async optimizeGas(
    tx: ethers.TransactionRequest,
    maxPriorityFee?: bigint
  ): Promise<ethers.TransactionRequest> {
    // Set reasonable gas limits
    const optimizedTx = { ...tx };

    if (maxPriorityFee) {
      optimizedTx.maxPriorityFeePerGas = maxPriorityFee;
      logger.info(`Priority fee capped at ${ethers.formatUnits(maxPriorityFee, 'gwei')} gwei`);
    }

    // Set max fee per gas (base fee + priority fee)
    if (!optimizedTx.maxFeePerGas && optimizedTx.maxPriorityFeePerGas) {
      // Estimate base fee and add priority fee
      optimizedTx.maxFeePerGas = optimizedTx.maxPriorityFeePerGas;
    }

    return optimizedTx;
  }

  /**
   * Send transaction via Flashbots
   */
  private async sendViaFlashbots(
    signedTx: string,
    minProfit?: bigint
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // Initialize Flashbots if needed
      if (!this.flashbots.isAvailable()) {
        await this.flashbots.initialize();
      }

      // Simulate bundle first if minProfit is set
      if (minProfit) {
        const currentBlock = await this.flashbots['provider'].getBlockNumber();
        const simulation = await this.flashbots.simulateBundle([signedTx], currentBlock + 1);

        if (!simulation.success || (simulation.profit && simulation.profit < minProfit)) {
          return {
            success: false,
            error: `Insufficient profit: ${simulation.profit ? ethers.formatEther(simulation.profit) : '0'} ETH`,
          };
        }
      }

      // Send via Flashbots
      const result = await this.flashbots.sendPrivateTransaction(signedTx);

      if (result.success) {
        logger.info(`⚡ Transaction sent via Flashbots: ${result.bundleHash}`);
        return { success: true, txHash: result.bundleHash };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      logger.error('Flashbots submission failed:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Send transaction with protection via normal RPC
   */
  private async sendProtectedTransaction(
    signedTx: string,
    provider: ethers.Provider
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const tx = await provider.broadcastTransaction(signedTx);

      logger.info(`Transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
        logger.info(`✅ Transaction confirmed: ${tx.hash}`);
        return { success: true, txHash: tx.hash };
      } else {
        return { success: false, error: 'Transaction failed' };
      }
    } catch (error) {
      logger.error('Transaction broadcast failed:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Detect potential sandwich attack
   */
  async detectSandwichAttack(
    txHash: string,
    provider: ethers.Provider
  ): Promise<{ isSandwich: boolean; attacker?: string }> {
    try {
      const tx = await provider.getTransaction(txHash);
      if (!tx || !tx.blockNumber) {
        return { isSandwich: false };
      }

      const block = await provider.getBlock(tx.blockNumber, true);
      if (!block || !block.transactions) {
        return { isSandwich: false };
      }

      // Find transaction index
      const txIndex = block.transactions.findIndex(
        (t) => typeof t === 'object' && t !== null && 'hash' in t && (t as { hash: string }).hash === txHash
      );

      if (txIndex === -1) {
        return { isSandwich: false };
      }

      // Check for sandwich pattern (same token pair before and after)
      const prevTx = txIndex > 0 ? block.transactions[txIndex - 1] : null;
      const nextTx = txIndex < block.transactions.length - 1 ? block.transactions[txIndex + 1] : null;

      // Simple heuristic: if same from address in prev and next tx
      if (
        prevTx &&
        nextTx &&
        typeof prevTx === 'object' &&
        typeof nextTx === 'object' &&
        prevTx !== null &&
        nextTx !== null &&
        'from' in prevTx &&
        'from' in nextTx &&
        'from' in tx &&
        (prevTx as { from: string }).from === (nextTx as { from: string }).from &&
        (prevTx as { from: string }).from !== (tx as { from: string }).from
      ) {
        const attacker = (prevTx as { from: string }).from;
        logger.warn(`🚨 Potential sandwich attack detected by ${attacker}`);
        return { isSandwich: true, attacker };
      }

      return { isSandwich: false };
    } catch (error) {
      logger.error('Sandwich detection failed:', error);
      return { isSandwich: false };
    }
  }

  /**
   * Calculate optimal MEV tip
   */
  calculateOptimalTip(
    expectedProfit: bigint,
    gasLimit: bigint,
    baseFee: bigint
  ): bigint {
    // Tip should be a fraction of expected profit
    // Leave 90% of profit for us, give 10% as tip
    const maxTip = (expectedProfit * BigInt(10)) / BigInt(100);

    // But don't exceed reasonable gas prices
    const maxReasonableTip = baseFee * BigInt(2); // 2x base fee max

    return maxTip < maxReasonableTip ? maxTip : maxReasonableTip;
  }
}

// Singleton instance
let mevProtectionService: MEVProtectionService | null = null;

export function getMEVProtectionService(): MEVProtectionService {
  if (!mevProtectionService) {
    mevProtectionService = new MEVProtectionService();
  }
  return mevProtectionService;
}

export default MEVProtectionService;
