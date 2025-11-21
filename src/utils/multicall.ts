/**
 * Multicall Utility for Batch Contract Queries
 *
 * Efficiently batch multiple contract calls into a single RPC request
 * Useful for fetching pool data, token balances, etc. in one call
 */

import { ethers } from 'ethers';
import { logger } from './logger';
import { CONFIG } from '../config';

// Multicall3 contract address (deployed on most EVM chains)
const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';

// Multicall3 ABI (minimal)
const MULTICALL3_ABI = [
  'function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) returns (tuple(bool success, bytes returnData)[] returnData)',
  'function aggregate3Value(tuple(address target, bool allowFailure, uint256 value, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)',
];

export interface Call {
  target: string;
  callData: string;
  allowFailure?: boolean;
}

export interface CallResult {
  success: boolean;
  returnData: string;
}

export class Multicall {
  private provider: ethers.JsonRpcProvider;
  private multicall: ethers.Contract;

  constructor(provider?: ethers.JsonRpcProvider) {
    this.provider = provider || new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.multicall = new ethers.Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, this.provider);
  }

  /**
   * Execute multiple contract calls in a single transaction
   */
  async call(calls: Call[]): Promise<CallResult[]> {
    try {
      if (calls.length === 0) {
        return [];
      }

      logger.info(`📞 Executing multicall with ${calls.length} calls`);

      // Format calls for multicall3
      const formattedCalls = calls.map((call) => ({
        target: call.target,
        allowFailure: call.allowFailure ?? true,
        callData: call.callData,
      }));

      // Execute multicall
      if (!this.multicall || !this.multicall.aggregate3) {
        throw new Error('Multicall contract not initialized');
      }
      const results = await this.multicall.aggregate3(formattedCalls);

      logger.info(`✅ Multicall completed: ${results.length} results`);

      return results.map((result: any) => ({
        success: result.success,
        returnData: result.returnData,
      }));
    } catch (error) {
      logger.error('Multicall error:', error);
      throw error;
    }
  }

  /**
   * Batch query pool reserves for multiple pairs
   * Returns reserves for PancakeSwap V2 pairs
   */
  async getPoolReserves(pairAddresses: string[]): Promise<
    Array<{
      pairAddress: string;
      reserve0: bigint;
      reserve1: bigint;
      blockTimestampLast: number;
      success: boolean;
    }>
  > {
    if (pairAddresses.length === 0) {
      return [];
    }

    // PancakeSwap V2 Pair ABI for getReserves
    const pairInterface = new ethers.Interface([
      'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
    ]);

    const getReservesCallData = pairInterface.encodeFunctionData('getReserves', []);

    // Create calls for all pairs
    const calls: Call[] = pairAddresses.map((pairAddress) => ({
      target: pairAddress,
      callData: getReservesCallData,
      allowFailure: true,
    }));

    const results = await this.call(calls);

    // Decode results
    return results.map((result, index): { pairAddress: string; reserve0: bigint; reserve1: bigint; blockTimestampLast: number; success: boolean } => {
      if (!result.success) {
        return {
          pairAddress: pairAddresses[index] || '',
          reserve0: 0n,
          reserve1: 0n,
          blockTimestampLast: 0,
          success: false,
        };
      }

      try {
        const decoded = pairInterface.decodeFunctionResult('getReserves', result.returnData);
        return {
          pairAddress: pairAddresses[index] || '',
          reserve0: decoded.reserve0 || 0n,
          reserve1: decoded.reserve1 || 0n,
          blockTimestampLast: Number(decoded.blockTimestampLast || 0),
          success: true,
        };
      } catch (error) {
        logger.warn(`Failed to decode reserves for ${pairAddresses[index]}`);
        return {
          pairAddress: pairAddresses[index] || '',
          reserve0: 0n,
          reserve1: 0n,
          blockTimestampLast: 0,
          success: false,
        };
      }
    });
  }

  /**
   * Batch query token balances for an address
   */
  async getTokenBalances(
    tokenAddresses: string[],
    accountAddress: string
  ): Promise<
    Array<{
      tokenAddress: string;
      balance: bigint;
      success: boolean;
    }>
  > {
    if (tokenAddresses.length === 0) {
      return [];
    }

    // ERC20 ABI for balanceOf
    const erc20Interface = new ethers.Interface([
      'function balanceOf(address account) external view returns (uint256)',
    ]);

    const balanceOfCallData = erc20Interface.encodeFunctionData('balanceOf', [accountAddress]);

    // Create calls for all tokens
    const calls: Call[] = tokenAddresses.map((tokenAddress) => ({
      target: tokenAddress,
      callData: balanceOfCallData,
      allowFailure: true,
    }));

    const results = await this.call(calls);

    // Decode results
    return results.map((result, index): { tokenAddress: string; balance: bigint; success: boolean } => {
      if (!result.success) {
        return {
          tokenAddress: tokenAddresses[index] || '',
          balance: 0n,
          success: false,
        };
      }

      try {
        const decoded = erc20Interface.decodeFunctionResult('balanceOf', result.returnData);
        return {
          tokenAddress: tokenAddresses[index] || '',
          balance: decoded[0] || 0n,
          success: true,
        };
      } catch (error) {
        logger.warn(`Failed to decode balance for ${tokenAddresses[index]}`);
        return {
          tokenAddress: tokenAddresses[index] || '',
          balance: 0n,
          success: false,
        };
      }
    });
  }

  /**
   * Batch query token metadata (name, symbol, decimals)
   */
  async getTokenMetadata(
    tokenAddresses: string[]
  ): Promise<
    Array<{
      tokenAddress: string;
      name?: string;
      symbol?: string;
      decimals?: number;
      success: boolean;
    }>
  > {
    if (tokenAddresses.length === 0) {
      return [];
    }

    // ERC20 ABI
    const erc20Interface = new ethers.Interface([
      'function name() external view returns (string)',
      'function symbol() external view returns (string)',
      'function decimals() external view returns (uint8)',
    ]);

    // Create calls for all tokens (name, symbol, decimals)
    const calls: Call[] = [];
    tokenAddresses.forEach((tokenAddress) => {
      calls.push({
        target: tokenAddress,
        callData: erc20Interface.encodeFunctionData('name', []),
        allowFailure: true,
      });
      calls.push({
        target: tokenAddress,
        callData: erc20Interface.encodeFunctionData('symbol', []),
        allowFailure: true,
      });
      calls.push({
        target: tokenAddress,
        callData: erc20Interface.encodeFunctionData('decimals', []),
        allowFailure: true,
      });
    });

    const results = await this.call(calls);

    // Decode results (3 results per token)
    const metadata: Array<{
      tokenAddress: string;
      name?: string;
      symbol?: string;
      decimals?: number;
      success: boolean;
    }> = [];

    for (let i = 0; i < tokenAddresses.length; i++) {
      const nameResult = results[i * 3];
      const symbolResult = results[i * 3 + 1];
      const decimalsResult = results[i * 3 + 2];

      let name: string | undefined;
      let symbol: string | undefined;
      let decimals: number | undefined;

      try {
        if (nameResult?.success && nameResult.returnData) {
          name = erc20Interface.decodeFunctionResult('name', nameResult.returnData)[0] as string;
        }
        if (symbolResult?.success && symbolResult.returnData) {
          symbol = erc20Interface.decodeFunctionResult('symbol', symbolResult.returnData)[0] as string;
        }
        if (decimalsResult?.success && decimalsResult.returnData) {
          decimals = Number(
            erc20Interface.decodeFunctionResult('decimals', decimalsResult.returnData)[0]
          );
        }
      } catch (error) {
        logger.warn(`Failed to decode metadata for ${tokenAddresses[i]}`);
      }

      metadata.push({
        tokenAddress: tokenAddresses[i] || '',
        name: name || '',
        symbol: symbol || '',
        decimals: decimals || 18,
        success: nameResult?.success || symbolResult?.success || decimalsResult?.success || false,
      });
    }

    return metadata;
  }
}

// Singleton instance
export const multicall = new Multicall();
