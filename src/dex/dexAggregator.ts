/**
 * Multi-DEX Aggregator
 * Compares prices across multiple DEXs and routes to the best one
 */

import { ethers } from 'ethers';
import { Token, CurrencyAmount, TradeType, Percent } from '@pancakeswap/sdk';
import { logger } from '../utils/logger.js';
import { CONFIG } from '../config.js';

export interface DEXQuote {
  dexName: string;
  inputAmount: bigint;
  outputAmount: bigint;
  priceImpact: number;
  route: string[];
  gasEstimate: bigint;
  effectivePrice: bigint; // output amount minus gas cost
}

export interface AggregatorResult {
  bestQuote: DEXQuote;
  allQuotes: DEXQuote[];
  savingsVsWorst: bigint;
  savingsPercentage: number;
}

export class DEXAggregator {
  private provider: ethers.JsonRpcProvider;
  private supportedDEXs: string[];

  // DEX Router Addresses on BSC
  private routers = {
    pancakeswap: '0x10ED43C718714eb63d5aA57B78B54704E256024E', // PancakeSwap V2
    pancakeswapV3: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4', // PancakeSwap V3
    biswap: '0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8', // Biswap
    apeswap: '0xcF0feBd3f17CEf5b47b0cD257aCf6025c5BFf3b7', // ApeSwap
    babyswap: '0x325E343f1dE602396E256B67eFd1F61C3A6B38Bd', // BabySwap
  };

  // Uniswap V2 ABI for getting amounts
  private readonly ROUTER_ABI = [
    'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  ];

  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.supportedDEXs = Object.keys(this.routers);
  }

  /**
   * Get best quote across all DEXs
   */
  async getBestQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint
  ): Promise<AggregatorResult> {
    try {
      logger.info(`🔍 Comparing prices across ${this.supportedDEXs.length} DEXs...`);

      // Get quotes from all DEXs in parallel
      const quotePromises = this.supportedDEXs.map(dexName =>
        this.getQuoteFromDEX(dexName, tokenIn, tokenOut, amountIn)
      );

      const quotes = await Promise.allSettled(quotePromises);

      // Filter successful quotes
      const validQuotes: DEXQuote[] = quotes
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<DEXQuote>).value)
        .filter(quote => quote.outputAmount > 0n);

      if (validQuotes.length === 0) {
        throw new Error('No valid quotes found from any DEX');
      }

      // Sort by effective price (output - gas cost) descending
      validQuotes.sort((a, b) => {
        const aEffective = Number(a.effectivePrice);
        const bEffective = Number(b.effectivePrice);
        return bEffective - aEffective;
      });

      const bestQuote = validQuotes[0];
      const worstQuote = validQuotes[validQuotes.length - 1];

      const savingsVsWorst = bestQuote.outputAmount - worstQuote.outputAmount;
      const savingsPercentage = Number(savingsVsWorst * BigInt(10000) / worstQuote.outputAmount) / 100;

      logger.info(
        `✅ Best quote from ${bestQuote.dexName}: ${ethers.formatEther(bestQuote.outputAmount)} (${savingsPercentage.toFixed(2)}% better than worst)`
      );

      return {
        bestQuote,
        allQuotes: validQuotes,
        savingsVsWorst,
        savingsPercentage,
      };
    } catch (error) {
      logger.error('DEX aggregation failed:', error);
      throw error;
    }
  }

  /**
   * Get quote from a specific DEX
   */
  private async getQuoteFromDEX(
    dexName: string,
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint
  ): Promise<DEXQuote> {
    try {
      const routerAddress = this.routers[dexName as keyof typeof this.routers];
      const router = new ethers.Contract(routerAddress, this.ROUTER_ABI, this.provider);

      // Get path (direct swap for now, can add multi-hop later)
      const path = [tokenIn, tokenOut];

      // Get amounts out
      const amounts = await router.getAmountsOut(amountIn, path);
      const outputAmount = amounts[amounts.length - 1];

      // Estimate gas
      const gasEstimate = await this.estimateSwapGas(dexName, amountIn, path);

      // Calculate price impact (simplified)
      const priceImpact = this.calculatePriceImpact(amountIn, outputAmount);

      // Effective price = output - gas cost
      const gasCostInOutput = await this.convertGasCostToOutput(gasEstimate, tokenOut);
      const effectivePrice = outputAmount - gasCostInOutput;

      return {
        dexName,
        inputAmount: amountIn,
        outputAmount,
        priceImpact,
        route: path,
        gasEstimate,
        effectivePrice,
      };
    } catch (error) {
      logger.warn(`Failed to get quote from ${dexName}:`, (error as Error).message);
      // Return zero quote on failure
      return {
        dexName,
        inputAmount: amountIn,
        outputAmount: 0n,
        priceImpact: 100,
        route: [tokenIn, tokenOut],
        gasEstimate: 0n,
        effectivePrice: 0n,
      };
    }
  }

  /**
   * Execute trade on best DEX
   */
  async executeBestTrade(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    minAmountOut: bigint,
    deadline: number,
    signer: ethers.Wallet
  ): Promise<{ success: boolean; txHash?: string; dexUsed?: string }> {
    try {
      // Get best quote
      const result = await this.getBestQuote(tokenIn, tokenOut, amountIn);

      if (result.bestQuote.outputAmount < minAmountOut) {
        return {
          success: false,
        };
      }

      const routerAddress = this.routers[result.bestQuote.dexName as keyof typeof this.routers];
      const router = new ethers.Contract(routerAddress, this.ROUTER_ABI, signer);

      // Execute swap
      const tx = await router.swapExactTokensForTokens(
        amountIn,
        minAmountOut,
        result.bestQuote.route,
        signer.address,
        deadline
      );

      logger.info(`🔄 Executing swap on ${result.bestQuote.dexName}: ${tx.hash}`);

      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
        logger.info(`✅ Swap executed successfully on ${result.bestQuote.dexName}`);
        return {
          success: true,
          txHash: tx.hash,
          dexUsed: result.bestQuote.dexName,
        };
      } else {
        return { success: false };
      }
    } catch (error) {
      logger.error('Failed to execute best trade:', error);
      return { success: false };
    }
  }

  /**
   * Estimate gas for swap
   */
  private async estimateSwapGas(dexName: string, amountIn: bigint, path: string[]): Promise<bigint> {
    // Rough estimates based on historical data
    const gasEstimates = {
      pancakeswap: 150000n,
      pancakeswapV3: 180000n,
      biswap: 140000n,
      apeswap: 150000n,
      babyswap: 145000n,
    };

    return gasEstimates[dexName as keyof typeof gasEstimates] || 150000n;
  }

  /**
   * Calculate price impact
   */
  private calculatePriceImpact(amountIn: bigint, amountOut: bigint): number {
    // Simplified price impact calculation
    // Real implementation would need reserve data
    if (amountIn === 0n) return 0;

    const ratio = Number(amountOut * BigInt(10000) / amountIn);
    const expectedRatio = 10000; // 1:1 ratio

    return Math.abs(expectedRatio - ratio) / 100;
  }

  /**
   * Convert gas cost to output token amount
   */
  private async convertGasCostToOutput(gasEstimate: bigint, tokenOut: string): Promise<bigint> {
    try {
      // Get current gas price
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || 0n;

      // Calculate gas cost in native token (BNB)
      const gasCostBNB = gasEstimate * gasPrice;

      // If output token is BNB, return directly
      const WBNB = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
      if (tokenOut.toLowerCase() === WBNB.toLowerCase()) {
        return gasCostBNB;
      }

      // Otherwise, convert BNB to output token
      // This would require getting the BNB price in output token
      // For simplicity, we'll return 0 here (implement later with price oracle)
      return 0n;
    } catch (error) {
      logger.warn('Failed to convert gas cost:', error);
      return 0n;
    }
  }

  /**
   * Get supported DEXs
   */
  getSupportedDEXs(): string[] {
    return this.supportedDEXs;
  }

  /**
   * Add custom DEX
   */
  addCustomDEX(name: string, routerAddress: string): void {
    this.routers = { ...this.routers, [name]: routerAddress };
    this.supportedDEXs = Object.keys(this.routers);
    logger.info(`Added custom DEX: ${name} at ${routerAddress}`);
  }
}

// Singleton instance
let dexAggregator: DEXAggregator | null = null;

export function getDEXAggregator(): DEXAggregator {
  if (!dexAggregator) {
    dexAggregator = new DEXAggregator();
  }
  return dexAggregator;
}

export default DEXAggregator;
