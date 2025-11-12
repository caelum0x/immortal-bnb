/**
 * Flashbots Provider for MEV Protection
 * Sends transactions through private mempool to prevent front-running
 */

import { ethers } from 'ethers';
import { FlashbotsBundleProvider } from '@flashbots/ethers-provider-bundle';
import { logger } from '../utils/logger.js';
import { CONFIG } from '../config.js';

export class FlashbotsService {
  private provider: ethers.JsonRpcProvider;
  private flashbotsProvider: FlashbotsBundleProvider | null = null;
  private authSigner: ethers.Wallet;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);

    // Create auth signer for Flashbots (separate from trading wallet)
    const authKey = process.env.FLASHBOTS_AUTH_KEY || ethers.Wallet.createRandom().privateKey;
    this.authSigner = new ethers.Wallet(authKey);
  }

  /**
   * Initialize Flashbots provider
   */
  async initialize(): Promise<void> {
    try {
      // Flashbots RPC endpoints
      const flashbotsRPC = CONFIG.IS_MAINNET
        ? 'https://relay.flashbots.net'
        : 'https://relay-goerli.flashbots.net';

      this.flashbotsProvider = await FlashbotsBundleProvider.create(
        this.provider,
        this.authSigner,
        flashbotsRPC
      );

      logger.info('⚡ Flashbots provider initialized');
    } catch (error) {
      logger.error('Failed to initialize Flashbots:', error);
      throw error;
    }
  }

  /**
   * Send transaction through Flashbots to prevent MEV
   */
  async sendPrivateTransaction(
    signedTransaction: string,
    targetBlock?: number
  ): Promise<{ success: boolean; bundleHash?: string; error?: string }> {
    if (!this.flashbotsProvider) {
      await this.initialize();
    }

    try {
      const currentBlock = await this.provider.getBlockNumber();
      const targetBlockNumber = targetBlock || currentBlock + 1;

      // Create bundle with single transaction
      const bundle = [
        {
          signedTransaction,
        },
      ];

      // Send bundle
      const bundleSubmission = await this.flashbotsProvider!.sendBundle(
        bundle,
        targetBlockNumber
      );

      // Wait for inclusion
      const waitResponse = await bundleSubmission.wait();

      if (waitResponse === 0) {
        logger.info('⚡ Bundle included in block');
        return { success: true, bundleHash: bundleSubmission.bundleHash };
      } else {
        logger.warn('Bundle not included:', waitResponse);
        return { success: false, error: `Bundle not included: ${waitResponse}` };
      }
    } catch (error) {
      logger.error('Flashbots transaction failed:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Send bundle of multiple transactions atomically
   */
  async sendBundle(
    signedTransactions: string[],
    targetBlock?: number
  ): Promise<{ success: boolean; bundleHash?: string }> {
    if (!this.flashbotsProvider) {
      await this.initialize();
    }

    try {
      const currentBlock = await this.provider.getBlockNumber();
      const targetBlockNumber = targetBlock || currentBlock + 1;

      const bundle = signedTransactions.map(tx => ({ signedTransaction: tx }));

      const bundleSubmission = await this.flashbotsProvider!.sendBundle(
        bundle,
        targetBlockNumber
      );

      const waitResponse = await bundleSubmission.wait();

      if (waitResponse === 0) {
        logger.info(`⚡ Bundle with ${bundle.length} transactions included`);
        return { success: true, bundleHash: bundleSubmission.bundleHash };
      } else {
        logger.warn('Bundle not included');
        return { success: false };
      }
    } catch (error) {
      logger.error('Bundle submission failed:', error);
      return { success: false };
    }
  }

  /**
   * Simulate bundle to check profitability
   */
  async simulateBundle(
    signedTransactions: string[],
    targetBlock: number
  ): Promise<{ success: boolean; profit?: bigint; error?: string }> {
    if (!this.flashbotsProvider) {
      await this.initialize();
    }

    try {
      const bundle = signedTransactions.map(tx => ({ signedTransaction: tx }));

      const simulation = await this.flashbotsProvider!.simulate(bundle, targetBlock);

      if ('error' in simulation) {
        return { success: false, error: simulation.error.message };
      }

      // Calculate profit from simulation
      const profit = simulation.coinbaseDiff;

      logger.info(`Bundle simulation: profit = ${ethers.formatEther(profit)} ETH`);

      return { success: true, profit };
    } catch (error) {
      logger.error('Bundle simulation failed:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Check if Flashbots is available
   */
  isAvailable(): boolean {
    return this.flashbotsProvider !== null;
  }
}

// Singleton instance
let flashbotsService: FlashbotsService | null = null;

export function getFlashbotsService(): FlashbotsService {
  if (!flashbotsService) {
    flashbotsService = new FlashbotsService();
  }
  return flashbotsService;
}
