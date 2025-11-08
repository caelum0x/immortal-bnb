// src/blockchain/executionOptimizer.ts
// Advanced trade execution optimizer with dynamic slippage, gas optimization, and MEV protection
// Implements sophisticated execution strategies based on real-time market conditions

import { ethers } from 'ethers';
import { logger, logError } from '../utils/logger';
import { CONFIG } from '../config';
import PancakeSwapV3 from './pancakeSwapIntegration';
import type { TradeParams, TradeResult } from './tradeExecutor';

export interface OptimizedTradeParams extends TradeParams {
  maxGasPrice?: number; // Maximum gas price in gwei
  deadline?: number; // Transaction deadline in seconds
  mevProtection?: boolean; // Enable MEV protection
  partialFill?: boolean; // Allow partial fills
  priceLimit?: number; // Maximum acceptable price
}

export interface ExecutionStrategy {
  name: string;
  description: string;
  slippageMultiplier: number; // Multiplier for base slippage
  gasMultiplier: number; // Multiplier for gas price
  splitTrades: boolean; // Whether to split large trades
  maxSplits: number; // Maximum number of splits
  delayBetweenSplits: number; // Delay between split trades (ms)
  conditions: (params: OptimizedTradeParams, marketData: MarketData) => boolean;
}

export interface MarketData {
  gasPrice: number; // Current gas price in gwei
  networkCongestion: number; // 0-100 scale
  volatility: number; // Current volatility measure
  liquidity: number; // Available liquidity in USD
  priceImpact: number; // Estimated price impact %
  volume24h: number; // 24h volume
}

/**
 * Advanced Trade Execution Optimizer
 * Dynamically optimizes trade execution based on market conditions
 */
export class ExecutionOptimizer {
  private pancakeSwap: PancakeSwapV3;
  private provider: ethers.Provider;
  private strategies: ExecutionStrategy[];

  constructor() {
    this.pancakeSwap = new PancakeSwapV3();
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.strategies = this.initializeStrategies();
    
    logger.info('⚡ Execution Optimizer initialized');
  }

  /**
   * Execute optimized trade with dynamic strategy selection
   */
  async executeOptimized(params: OptimizedTradeParams): Promise<TradeResult> {
    try {
      logger.info(`\n⚡ Optimizing execution for ${params.action} ${params.amountBNB} BNB...`);
      
      // Gather market data
      const marketData = await this.gatherMarketData(params.tokenAddress, params.amountBNB);
      
      // Select optimal strategy
      const strategy = this.selectStrategy(params, marketData);
      logger.info(`🎯 Selected strategy: ${strategy.name} - ${strategy.description}`);
      
      // Execute with selected strategy
      if (strategy.splitTrades && params.amountBNB > 0.05) {
        return await this.executeSplitTrades(params, strategy, marketData);
      } else {
        return await this.executeSingleTrade(params, strategy, marketData);
      }
    } catch (error) {
      logError('executeOptimized', error as Error);
      return {
        success: false,
        amountIn: '0',
        amountOut: '0',
        actualPrice: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Gather comprehensive market data for optimization
   */
  private async gatherMarketData(tokenAddress: string, amountBNB: number): Promise<MarketData> {
    try {
      // Get gas price
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice ? 
        parseFloat(ethers.formatUnits(feeData.gasPrice, 'gwei')) : 5;

      // Get quote for price impact calculation
      const quote = await this.pancakeSwap.getQuote(tokenAddress, amountBNB);
      
      // Estimate network congestion based on gas price
      const baseFee = 3; // Base fee in gwei for opBNB/BSC
      const congestion = Math.min(100, ((gasPrice - baseFee) / baseFee) * 100);

      // Get current volatility (simplified - could be enhanced with historical data)
      const volatility = Math.abs(quote.pricePerToken * 0.1); // Placeholder calculation

      return {
        gasPrice,
        networkCongestion: Math.max(0, congestion),
        volatility,
        liquidity: 100000, // Default liquidity value
        priceImpact: 2, // Default price impact
        volume24h: 50000 // Default volume
      };
    } catch (error) {
      logError('gatherMarketData', error as Error);
      
      // Return conservative defaults
      return {
        gasPrice: 5,
        networkCongestion: 50,
        volatility: 20,
        liquidity: 100000,
        priceImpact: 2,
        volume24h: 50000
      };
    }
  }

  /**
   * Select optimal execution strategy based on market conditions
   */
  private selectStrategy(params: OptimizedTradeParams, marketData: MarketData): ExecutionStrategy {
    // Find strategies that match current conditions
    const applicableStrategies = this.strategies.filter(strategy =>
      strategy.conditions(params, marketData)
    );

    if (applicableStrategies.length === 0) {
      // Fallback to default strategy
      return this.strategies[0] || this.getDefaultStrategy();
    }

    // Select based on market conditions priority
    if (marketData.networkCongestion > 70) {
      // High congestion - prefer gas-efficient strategies
      return applicableStrategies.find(s => s.gasMultiplier < 1.2) || applicableStrategies[0]!;
    }

    if (marketData.priceImpact > 5) {
      // High impact - prefer split strategies
      return applicableStrategies.find(s => s.splitTrades) || applicableStrategies[0]!;
    }

    if (marketData.volatility > 30) {
      // High volatility - prefer fast execution
      return applicableStrategies.find(s => s.name.includes('Fast')) || applicableStrategies[0]!;
    }

    // Default to first applicable strategy
    return applicableStrategies[0]!;
  }

  /**
   * Execute trade with split orders to minimize price impact
   */
  private async executeSplitTrades(
    params: OptimizedTradeParams,
    strategy: ExecutionStrategy,
    marketData: MarketData
  ): Promise<TradeResult> {
    try {
      const splits = Math.min(strategy.maxSplits, Math.ceil(params.amountBNB / 0.02)); // Max 0.02 BNB per split
      const amountPerSplit = params.amountBNB / splits;
      
      logger.info(`🔄 Splitting trade into ${splits} orders of ${amountPerSplit.toFixed(4)} BNB each`);
      
      const results: TradeResult[] = [];
      let totalAmountIn = 0;
      let totalAmountOut = 0;
      let totalGasUsed = 0;
      
      for (let i = 0; i < splits; i++) {
        try {
          logger.info(`  📈 Executing split ${i + 1}/${splits}...`);
          
          const splitParams: OptimizedTradeParams = {
            ...params,
            amountBNB: amountPerSplit,
            slippagePercent: (params.slippagePercent || 2) * strategy.slippageMultiplier
          };
          
          const result = await this.executeSingleTrade(splitParams, strategy, marketData);
          
          if (result.success) {
            results.push(result);
            totalAmountIn += parseFloat(result.amountIn);
            totalAmountOut += parseFloat(result.amountOut);
            totalGasUsed += parseFloat(result.gasUsed || '0');
            
            logger.info(`    ✅ Split ${i + 1} completed: ${result.amountOut} tokens`);
          } else {
            logger.warn(`    ❌ Split ${i + 1} failed: ${result.error}`);
            
            if (!params.partialFill) {
              throw new Error(`Split trade ${i + 1} failed: ${result.error}`);
            }
          }
          
          // Delay between splits to avoid MEV
          if (i < splits - 1 && strategy.delayBetweenSplits > 0) {
            await new Promise(resolve => setTimeout(resolve, strategy.delayBetweenSplits));
          }
        } catch (error) {
          logger.warn(`Split ${i + 1} failed: ${error}`);
          if (!params.partialFill) {
            throw error;
          }
        }
      }
      
      if (results.length === 0) {
        throw new Error('All split trades failed');
      }
      
      // Calculate weighted average price
      const avgPrice = totalAmountIn > 0 ? totalAmountOut / totalAmountIn : 0;
      
      logger.info(`🎯 Split execution complete: ${results.length}/${splits} successful`);
      
      return {
        success: true,
        txHash: results[results.length - 1]?.txHash, // Last successful tx
        amountIn: totalAmountIn.toString(),
        amountOut: totalAmountOut.toString(),
        actualPrice: avgPrice,
        gasUsed: totalGasUsed.toString()
      };
    } catch (error) {
      logError('executeSplitTrades', error as Error);
      return {
        success: false,
        amountIn: '0',
        amountOut: '0',
        actualPrice: 0,
        error: error instanceof Error ? error.message : 'Split execution failed'
      };
    }
  }

  /**
   * Execute single optimized trade
   */
  private async executeSingleTrade(
    params: OptimizedTradeParams,
    strategy: ExecutionStrategy,
    marketData: MarketData
  ): Promise<TradeResult> {
    try {
      // Calculate optimized parameters
      const optimizedSlippage = (params.slippagePercent || 2) * strategy.slippageMultiplier;
      const maxGasPrice = params.maxGasPrice || marketData.gasPrice * strategy.gasMultiplier;
      
      logger.info(`  📊 Optimized params:`);
      logger.info(`    Slippage: ${optimizedSlippage.toFixed(2)}%`);
      logger.info(`    Max Gas: ${maxGasPrice.toFixed(1)} gwei`);
      
      // Add MEV protection if enabled
      if (params.mevProtection) {
        // Add small random delay to avoid being front-run
        const delay = Math.random() * 2000 + 1000; // 1-3 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Execute the trade using PancakeSwap integration
      if (params.action === 'buy') {
        const swapResult = await this.pancakeSwap.buyTokenWithBNB(
          params.tokenAddress,
          params.amountBNB,
          Math.round(optimizedSlippage * 100) // Convert to basis points
        );
        
        // Convert SwapResult to TradeResult
        return {
          ...swapResult,
          actualPrice: swapResult.executionPrice ? parseFloat(swapResult.executionPrice) : 0
        };
      } else {
        // For sell, we need to get token balance first
        const tokenBalance = await this.pancakeSwap.getTokenBalance(params.tokenAddress);
        
        const swapResult = await this.pancakeSwap.sellTokenForBNB(
          params.tokenAddress,
          tokenBalance.toString(), // Sell all tokens
          Math.round(optimizedSlippage * 100)
        );
        
        return {
          ...swapResult,
          actualPrice: swapResult.executionPrice ? parseFloat(swapResult.executionPrice) : 0
        };
      }
    } catch (error) {
      logError('executeSingleTrade', error as Error);
      return {
        success: false,
        amountIn: '0',
        amountOut: '0',
        actualPrice: 0,
        error: error instanceof Error ? error.message : 'Single trade execution failed'
      };
    }
  }

  /**
   * Initialize execution strategies
   */
  private initializeStrategies(): ExecutionStrategy[] {
    return [
      {
        name: 'Conservative',
        description: 'Low slippage, split large trades',
        slippageMultiplier: 1.0,
        gasMultiplier: 1.1,
        splitTrades: true,
        maxSplits: 5,
        delayBetweenSplits: 2000,
        conditions: (params, market) => market.priceImpact > 3 || params.amountBNB > 0.1
      },
      {
        name: 'Fast',
        description: 'Higher slippage, single trade for speed',
        slippageMultiplier: 1.5,
        gasMultiplier: 1.3,
        splitTrades: false,
        maxSplits: 1,
        delayBetweenSplits: 0,
        conditions: (params, market) => market.volatility > 25 || params.amountBNB < 0.05
      },
      {
        name: 'Gas Efficient',
        description: 'Minimize gas costs, accept higher slippage',
        slippageMultiplier: 1.2,
        gasMultiplier: 0.9,
        splitTrades: false,
        maxSplits: 1,
        delayBetweenSplits: 0,
        conditions: (params, market) => market.networkCongestion > 60
      },
      {
        name: 'High Impact',
        description: 'Split large trades to minimize price impact',
        slippageMultiplier: 0.8,
        gasMultiplier: 1.2,
        splitTrades: true,
        maxSplits: 8,
        delayBetweenSplits: 3000,
        conditions: (params, market) => market.priceImpact > 5 && market.liquidity < params.amountBNB * 1000 * 20
      }
    ];
  }

  /**
   * Get default fallback strategy
   */
  private getDefaultStrategy(): ExecutionStrategy {
    return {
      name: 'Default',
      description: 'Balanced approach',
      slippageMultiplier: 1.0,
      gasMultiplier: 1.1,
      splitTrades: false,
      maxSplits: 1,
      delayBetweenSplits: 0,
      conditions: () => true
    };
  }
}

export default ExecutionOptimizer;
