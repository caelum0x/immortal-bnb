// src/blockchain/automatedTrader.ts
// Automated trading system that discovers tokens dynamically and executes trades
// Combines token discovery, decision engine, and trade execution

import { logger, logError, logTrade } from '../utils/logger';
import { CONFIG } from '../config';
import TokenDiscovery from './tokenDiscovery';
import TradeDecisionEngine from './tradeDecisionEngine';
import { executeTrade, initializeProvider, getWalletBalance } from './tradeExecutor';
import DynamicMarketFetcher from '../data/dynamicMarketFetcher';
import type { DiscoveredToken } from './tokenDiscovery';
import type { TradeAnalysis } from './tradeDecisionEngine';
import type { EnhancedDiscoveredToken } from '../data/dynamicMarketFetcher';

export interface AutoTradeConfig {
  maxTradeAmount: number; // Maximum BNB per trade
  minTradeAmount: number; // Minimum BNB per trade
  maxConcurrentTrades: number; // Maximum number of open positions
  profitTargetPercent: number; // Take profit at this percentage
  stopLossPercent: number; // Stop loss at this percentage
  maxDailyTrades: number; // Maximum trades per day
  minConfidence: number; // Minimum confidence score (0-100)
  discoveryInterval: number; // How often to discover new tokens (ms)
  monitorInterval: number; // How often to check positions (ms)
  enableNewTokenListener: boolean; // Listen for new token launches
  blacklistTokens: string[]; // Tokens to never trade
}

export interface TradePosition {
  tokenAddress: string;
  symbol: string;
  entryPrice: number;
  amount: number;
  entryTime: number;
  txHash: string;
  targetPrice?: number;
  stopPrice?: number;
  currentPrice?: number;
  unrealizedPnl?: number;
}

export interface TradingStats {
  totalTrades: number;
  successfulTrades: number;
  totalPnl: number;
  winRate: number;
  averageHoldTime: number;
  bestTrade: number;
  worstTrade: number;
  dailyTrades: number;
  openPositions: number;
}

/**
 * Automated Trading System
 * Discovers, analyzes, and trades tokens automatically based on dynamic criteria
 */
export class AutomatedTrader {
  private tokenDiscovery: TokenDiscovery;
  private decisionEngine: TradeDecisionEngine;
  private marketFetcher: DynamicMarketFetcher;
  private config: AutoTradeConfig;
  private positions: Map<string, TradePosition> = new Map();
  private stats: TradingStats;
  private isRunning = false;
  private discoveryTimer?: NodeJS.Timeout;
  private monitorTimer?: NodeJS.Timeout;
  private lastResetDate = new Date().toDateString();

  constructor(config: Partial<AutoTradeConfig> = {}) {
    this.tokenDiscovery = new TokenDiscovery();
    this.decisionEngine = new TradeDecisionEngine();
    this.marketFetcher = new DynamicMarketFetcher();
    
    // Default configuration
    this.config = {
      maxTradeAmount: 0.1, // 0.1 BNB max per trade
      minTradeAmount: 0.01, // 0.01 BNB min per trade  
      maxConcurrentTrades: 5,
      profitTargetPercent: 50, // 50% profit target
      stopLossPercent: 30, // 30% stop loss
      maxDailyTrades: 20,
      minConfidence: 75,
      discoveryInterval: 300000, // 5 minutes
      monitorInterval: 60000, // 1 minute
      enableNewTokenListener: true,
      blacklistTokens: [],
      ...config
    };

    this.stats = {
      totalTrades: 0,
      successfulTrades: 0,
      totalPnl: 0,
      winRate: 0,
      averageHoldTime: 0,
      bestTrade: 0,
      worstTrade: 0,
      dailyTrades: 0,
      openPositions: 0
    };

    logger.info('🤖 Automated Trader initialized');
    this.logConfig();
  }

  /**
   * Start automated trading
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Automated trader is already running');
      return;
    }

    try {
      logger.info('🚀 Starting automated trading system...');
      
      // Initialize trading system
      await initializeProvider();
      
      // Check wallet balance
      const balance = await getWalletBalance();
      if (balance < this.config.minTradeAmount) {
        throw new Error(`Insufficient balance: ${balance} BNB (minimum: ${this.config.minTradeAmount} BNB)`);
      }

      logger.info(`💰 Available balance: ${balance.toFixed(4)} BNB`);
      
      this.isRunning = true;

      // Start discovery loop
      this.startDiscoveryLoop();
      
      // Start position monitoring
      this.startMonitoringLoop();

      // Start new token listener if enabled
      if (this.config.enableNewTokenListener) {
        this.startNewTokenListener();
      }

      logger.info('✅ Automated trading system started successfully');
      
    } catch (error) {
      logError('start', error as Error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop automated trading
   */
  async stop(): Promise<void> {
    logger.info('🛑 Stopping automated trading system...');
    
    this.isRunning = false;
    
    if (this.discoveryTimer) {
      clearInterval(this.discoveryTimer);
    }
    
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
    }

    // Close all positions
    await this.closeAllPositions();
    
    logger.info('✅ Automated trading system stopped');
    this.logStats();
  }

  /**
   * Get current trading statistics
   */
  getStats(): TradingStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Get current open positions
   */
  getPositions(): TradePosition[] {
    return Array.from(this.positions.values());
  }

  /**
   * Add token to blacklist
   */
  blacklistToken(tokenAddress: string): void {
    if (!this.config.blacklistTokens.includes(tokenAddress.toLowerCase())) {
      this.config.blacklistTokens.push(tokenAddress.toLowerCase());
      logger.info(`🚫 Blacklisted token: ${tokenAddress}`);
    }
  }

  /**
   * Start token discovery loop with dynamic scanning
   */
  private startDiscoveryLoop(): void {
    logger.info('🔍 Starting enhanced dynamic token discovery loop...');
    
    const discover = async () => {
      if (!this.isRunning) return;

      try {
        // Reset daily trades if new day
        this.resetDailyStatsIfNeeded();
        
        // Check if we can make more trades today
        if (this.stats.dailyTrades >= this.config.maxDailyTrades) {
          logger.info(`📊 Daily trade limit reached (${this.config.maxDailyTrades})`);
          return;
        }

        // Check if we have room for more positions
        if (this.positions.size >= this.config.maxConcurrentTrades) {
          logger.info(`📊 Max concurrent trades reached (${this.config.maxConcurrentTrades})`);
          return;
        }

        // Calculate available trade amount
        const balance = await getWalletBalance();
        const reservedAmount = Array.from(this.positions.values())
          .reduce((sum, pos) => sum + pos.amount, 0);
        const availableAmount = Math.min(
          balance - reservedAmount,
          this.config.maxTradeAmount
        );

        if (availableAmount < this.config.minTradeAmount) {
          logger.info(`💰 Insufficient balance for new trades: ${availableAmount.toFixed(4)} BNB`);
          return;
        }

        logger.info(`\n🔍 Dynamic discovery scan - analyzing market conditions...`);
        logger.info(`  Available: ${availableAmount.toFixed(4)} BNB`);
        
        // Enhanced dynamic discovery with multiple strategies
        const opportunities = await this.performDynamicDiscovery(availableAmount);

        if (opportunities.length === 0) {
          logger.info('📊 No suitable trading opportunities found in current market conditions');
          return;
        }

        // Execute the best opportunity with dynamic sizing
        const bestOpp = opportunities[0];
        if (bestOpp) {
          await this.executeTradingOpportunity(bestOpp, availableAmount);
        }

      } catch (error) {
        logError('discoveryLoop', error as Error);
      }
    };

    // Run immediately and then on interval
    discover();
    this.discoveryTimer = setInterval(discover, this.config.discoveryInterval);
  }

  /**
   * Enhanced dynamic discovery using multiple sources and market-adaptive filtering
   */
  private async performDynamicDiscovery(availableAmount: number): Promise<TradeAnalysis[]> {
    try {
      logger.info(`🔍 Starting comprehensive dynamic discovery scan...`);
      
      // Get current market snapshot for context
      const marketSnapshot = await this.marketFetcher.getMarketSnapshot();
      logger.info(`📊 Market conditions: ${marketSnapshot.volatilityIndex.toFixed(1)}% volatility, $${(marketSnapshot.averageVolume / 1000).toFixed(0)}k avg volume`);

      // Use predefined strategies with market-adaptive parameters
      const strategies = this.marketFetcher.getDefaultStrategies();
      
      // Adjust strategies based on market volatility
      if (marketSnapshot.volatilityIndex > 30) {
        logger.info('🔥 High volatility detected - using conservative discovery');
        strategies.forEach(strategy => {
          if (strategy.filter.liquidityMultiplier) {
            strategy.filter.liquidityMultiplier *= 1.5; // Require more liquidity
          }
          if (strategy.filter.volatilityThreshold) {
            strategy.filter.volatilityThreshold *= 0.7; // Lower volatility tolerance
          }
        });
      } else if (marketSnapshot.volatilityIndex < 10) {
        logger.info('🌊 Low volatility detected - using aggressive discovery');
        strategies.forEach(strategy => {
          if (strategy.filter.volumePercentile) {
            strategy.filter.volumePercentile *= 0.8; // Lower volume requirements
          }
        });
      }

      // Discover tokens using enhanced strategies
      const discoveredTokens = await this.marketFetcher.discoverWithStrategies(
        strategies,
        availableAmount,
        15 // Get top 15 candidates
      );

      if (discoveredTokens.length === 0) {
        logger.info('📊 No tokens found matching current market criteria');
        return [];
      }

      logger.info(`🎯 Analyzing ${discoveredTokens.length} discovered tokens...`);

      // Analyze each discovered token
      const analyses: TradeAnalysis[] = [];
      for (const token of discoveredTokens.slice(0, 8)) { // Analyze top 8
        try {
          const analysis = await this.decisionEngine.analyzeToken(
            token.tokenAddress,
            availableAmount
          );
          
          if (analysis && analysis.decision.executable && 
              analysis.decision.confidence >= this.config.minConfidence) {
            
            // Enhance analysis with discovery confidence
            analysis.decision.confidence = Math.min(95, 
              (analysis.decision.confidence + (token.confidence || 50)) / 2
            );
            
            analyses.push(analysis);
            logger.info(`  ✅ ${token.symbol}: ${analysis.decision.confidence}% confidence (${token.strategy})`);
          } else {
            logger.info(`  ❌ ${token.symbol}: Below threshold or not executable`);
          }
        } catch (error) {
          logger.warn(`  ⚠️  Failed to analyze ${token.symbol}: ${error}`);
        }
      }

      // Sort by enhanced confidence
      analyses.sort((a, b) => b.decision.confidence - a.decision.confidence);
      
      logger.info(`🚀 Discovery complete: ${analyses.length} high-quality opportunities`);
      return analyses;
    } catch (error) {
      logError('performDynamicDiscovery', error as Error);
      return [];
    }
  }

  /**
   * Discover trending tokens using DexScreener API with dynamic filters
   */
  private async discoverTrendingTokens(maxAmount: number): Promise<any[]> {
    try {
      logger.info('  � Scanning trending tokens...');
      
      // Dynamic parameters based on market conditions
      const marketVolume = await this.getMarketAverageVolume();
      const minVolume = marketVolume * 0.1; // 10% of market average
      
      const opportunities = await this.decisionEngine.findBestOpportunities(
        maxAmount,
        5,
        this.config.minConfidence
      );

      logger.info(`    Found ${opportunities.length} trending opportunities`);
      return opportunities;
    } catch (error) {
      logError('discoverTrendingTokens', error as Error);
      return [];
    }
  }

  /**
   * Discover new token launches using real-time events
   */
  private async discoverNewLaunches(maxAmount: number): Promise<any[]> {
    try {
      logger.info('  🆕 Scanning new launches...');
      
      const opportunities = await this.decisionEngine.findBestOpportunities(
        maxAmount,
        3,
        this.config.minConfidence
      );

      logger.info(`    Found ${opportunities.length} new launch opportunities`);
      return opportunities;
    } catch (error) {
      logError('discoverNewLaunches', error as Error);
      return [];
    }
  }

  /**
   * Discover volume breakout opportunities
   */
  private async discoverVolumeBreakouts(maxAmount: number): Promise<any[]> {
    try {
      logger.info('  📈 Scanning volume breakouts...');
      
      const opportunities = await this.decisionEngine.findBestOpportunities(
        maxAmount,
        3,
        this.config.minConfidence
      );

      logger.info(`    Found ${opportunities.length} breakout opportunities`);
      return opportunities;
    } catch (error) {
      logError('discoverVolumeBreakouts', error as Error);
      return [];
    }
  }

  /**
   * Discover liquidity arbitrage opportunities
   */
  private async discoverLiquidityOpportunities(maxAmount: number): Promise<any[]> {
    try {
      logger.info('  💧 Scanning liquidity opportunities...');
      
      const opportunities = await this.decisionEngine.findBestOpportunities(
        maxAmount,
        2,
        this.config.minConfidence
      );

      logger.info(`    Found ${opportunities.length} liquidity opportunities`);
      return opportunities;
    } catch (error) {
      logError('discoverLiquidityOpportunities', error as Error);
      return [];
    }
  }

  /**
   * Get market average volume for dynamic thresholds
   */
  private async getMarketAverageVolume(): Promise<number> {
    try {
      // Get top 50 pairs to calculate market average
      const topTokens = await this.tokenDiscovery.discoverTrendingTokens({
        limit: 50,
        sortBy: 'volume24h'
      });

      if (topTokens.length === 0) return 100000; // Fallback value

      const totalVolume = topTokens.reduce((sum: number, token: DiscoveredToken) => sum + token.volume24h, 0);
      return totalVolume / topTokens.length;
    } catch (error) {
      logError('getMarketAverageVolume', error as Error);
      return 100000; // Fallback value
    }
  }

  /**
   * Start position monitoring loop
   */
  private startMonitoringLoop(): void {
    logger.info('👀 Starting position monitoring loop...');
    
    const monitor = async () => {
      if (!this.isRunning || this.positions.size === 0) return;

      try {
        logger.info(`\n👀 Monitoring ${this.positions.size} open positions...`);
        
        for (const [tokenAddress, position] of this.positions) {
          await this.monitorPosition(tokenAddress, position);
        }

      } catch (error) {
        logError('monitoringLoop', error as Error);
      }
    };

    this.monitorTimer = setInterval(monitor, this.config.monitorInterval);
  }

  /**
   * Start listening for new token launches
   */
  private startNewTokenListener(): void {
    logger.info('👂 Starting new token listener...');
    
    this.tokenDiscovery.startNewTokenListener(async (token: DiscoveredToken) => {
      if (!this.isRunning) return;
      
      logger.info(`🆕 New token detected: ${token.symbol} (${token.tokenAddress})`);
      
      // Quick analysis for new tokens
      const analysis = await this.decisionEngine.analyzeToken(
        token.tokenAddress,
        this.config.minTradeAmount
      );

      if (analysis && analysis.decision.executable && analysis.decision.confidence >= this.config.minConfidence) {
        logger.info(`🚀 New token opportunity: ${token.symbol} (${analysis.decision.confidence}% confidence)`);
        
        // Execute if we have capacity
        if (this.positions.size < this.config.maxConcurrentTrades) {
          await this.executeTradingOpportunity(analysis, this.config.minTradeAmount);
        }
      }
    });
  }

  /**
   * Execute a trading opportunity
   */
  private async executeTradingOpportunity(analysis: TradeAnalysis, maxAmount: number): Promise<void> {
    try {
      const { token, decision } = analysis;
      
      // Check blacklist
      if (this.config.blacklistTokens.includes(token.tokenAddress.toLowerCase())) {
        logger.info(`🚫 Skipping blacklisted token: ${token.symbol}`);
        return;
      }

      // Check if we already have a position
      if (this.positions.has(token.tokenAddress)) {
        logger.info(`📊 Already have position in ${token.symbol}`);
        return;
      }

      const tradeAmount = Math.min(decision.recommendedAmount || maxAmount, maxAmount);
      
      logger.info(`\n🎯 Executing trade opportunity:`);
      logger.info(`  Token: ${token.symbol}`);
      logger.info(`  Amount: ${tradeAmount} BNB`);
      logger.info(`  Confidence: ${decision.confidence}%`);
      logger.info(`  Reason: ${decision.reason}`);

      // Execute the trade
      const result = await executeTrade({
        tokenAddress: token.tokenAddress,
        action: 'buy',
        amountBNB: tradeAmount,
        slippagePercent: 2 // 2% slippage for automated trades
      });

      if (result.success && result.txHash) {
        // Create position
        const position: TradePosition = {
          tokenAddress: token.tokenAddress,
          symbol: token.symbol,
          entryPrice: result.actualPrice,
          amount: tradeAmount,
          entryTime: Date.now(),
          txHash: result.txHash,
          targetPrice: result.actualPrice * (1 + this.config.profitTargetPercent / 100),
          stopPrice: result.actualPrice * (1 - this.config.stopLossPercent / 100)
        };

        this.positions.set(token.tokenAddress, position);
        this.stats.totalTrades++;
        this.stats.dailyTrades++;

        logger.info(`✅ Position opened successfully!`);
        logger.info(`  TX: ${result.txHash}`);
        logger.info(`  Entry Price: ${result.actualPrice.toFixed(8)} BNB`);
        logger.info(`  Target: ${position.targetPrice?.toFixed(8)} BNB (+${this.config.profitTargetPercent}%)`);
        logger.info(`  Stop: ${position.stopPrice?.toFixed(8)} BNB (-${this.config.stopLossPercent}%)`);

        logTrade('BUY', token.tokenAddress, tradeAmount);
      } else {
        logger.error(`❌ Trade failed: ${result.error}`);
      }

    } catch (error) {
      logError('executeTradingOpportunity', error as Error);
    }
  }

  /**
   * Monitor a position for exit conditions
   */
  private async monitorPosition(tokenAddress: string, position: TradePosition): Promise<void> {
    try {
      // Get current token price
      const tokens = await this.tokenDiscovery.getTokenByAddress(tokenAddress);
      if (tokens.length === 0 || !tokens[0]) {
        logger.warn(`Could not get price for ${position.symbol} - may have been delisted`);
        return;
      }

      const currentPrice = tokens[0].priceUsd * 1000; // Convert to BNB (rough)
      position.currentPrice = currentPrice;
      
      const pnlPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
      position.unrealizedPnl = position.amount * (pnlPercent / 100);

      logger.info(`  ${position.symbol}: ${pnlPercent.toFixed(2)}% (${position.unrealizedPnl.toFixed(4)} BNB)`);

      // Check exit conditions
      let shouldExit = false;
      let exitReason = '';

      if (position.targetPrice && currentPrice >= position.targetPrice) {
        shouldExit = true;
        exitReason = `Target reached (+${this.config.profitTargetPercent}%)`;
      } else if (position.stopPrice && currentPrice <= position.stopPrice) {
        shouldExit = true;
        exitReason = `Stop loss (-${this.config.stopLossPercent}%)`;
      } else {
        // Check for extreme conditions
        const holdTimeHours = (Date.now() - position.entryTime) / (1000 * 60 * 60);
        
        if (holdTimeHours > 24 && pnlPercent < -50) {
          shouldExit = true;
          exitReason = 'Emergency exit (24h + 50% loss)';
        } else if (pnlPercent > 200) {
          shouldExit = true;
          exitReason = 'Extreme profit (+200%)';
        }
      }

      if (shouldExit) {
        await this.closePosition(tokenAddress, exitReason);
      }

    } catch (error) {
      logError(`monitorPosition(${position.symbol})`, error as Error);
    }
  }

  /**
   * Close a specific position
   */
  private async closePosition(tokenAddress: string, reason: string): Promise<void> {
    const position = this.positions.get(tokenAddress);
    if (!position) return;

    try {
      logger.info(`\n🔄 Closing position: ${position.symbol}`);
      logger.info(`  Reason: ${reason}`);

      const result = await executeTrade({
        tokenAddress,
        action: 'sell',
        amountBNB: 0, // Sell all tokens
        slippagePercent: 3 // Higher slippage for exits
      });

      if (result.success) {
        const holdTime = Date.now() - position.entryTime;
        const pnl = parseFloat(result.amountOut) - position.amount;
        const pnlPercent = (pnl / position.amount) * 100;

        // Update stats
        if (pnl > 0) {
          this.stats.successfulTrades++;
          if (pnl > this.stats.bestTrade) {
            this.stats.bestTrade = pnl;
          }
        } else {
          if (pnl < this.stats.worstTrade) {
            this.stats.worstTrade = pnl;
          }
        }

        this.stats.totalPnl += pnl;

        logger.info(`✅ Position closed successfully!`);
        logger.info(`  TX: ${result.txHash}`);
        logger.info(`  PnL: ${pnl.toFixed(4)} BNB (${pnlPercent.toFixed(2)}%)`);
        logger.info(`  Hold time: ${(holdTime / (1000 * 60 * 60)).toFixed(1)} hours`);

        logTrade('SELL', tokenAddress, parseFloat(result.amountOut));
      } else {
        logger.error(`❌ Failed to close position: ${result.error}`);
      }

      // Remove position regardless of success/failure
      this.positions.delete(tokenAddress);

    } catch (error) {
      logError('closePosition', error as Error);
    }
  }

  /**
   * Close all open positions
   */
  private async closeAllPositions(): Promise<void> {
    logger.info(`🔄 Closing all ${this.positions.size} positions...`);
    
    for (const tokenAddress of this.positions.keys()) {
      await this.closePosition(tokenAddress, 'System shutdown');
    }
  }

  /**
   * Update trading statistics
   */
  private updateStats(): void {
    this.stats.openPositions = this.positions.size;
    this.stats.winRate = this.stats.totalTrades > 0 ? 
      (this.stats.successfulTrades / this.stats.totalTrades) * 100 : 0;
  }

  /**
   * Reset daily statistics if new day
   */
  private resetDailyStatsIfNeeded(): void {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.stats.dailyTrades = 0;
      this.lastResetDate = today;
      logger.info('📅 Daily stats reset for new day');
    }
  }

  /**
   * Log current configuration
   */
  private logConfig(): void {
    logger.info('⚙️  Trading Configuration:');
    logger.info(`  Trade Amount: ${this.config.minTradeAmount} - ${this.config.maxTradeAmount} BNB`);
    logger.info(`  Max Concurrent: ${this.config.maxConcurrentTrades}`);
    logger.info(`  Max Daily: ${this.config.maxDailyTrades}`);
    logger.info(`  Profit Target: ${this.config.profitTargetPercent}%`);
    logger.info(`  Stop Loss: ${this.config.stopLossPercent}%`);
    logger.info(`  Min Confidence: ${this.config.minConfidence}%`);
    logger.info(`  Discovery Interval: ${this.config.discoveryInterval / 1000}s`);
    logger.info(`  Monitor Interval: ${this.config.monitorInterval / 1000}s`);
  }

  /**
   * Log trading statistics
   */
  private logStats(): void {
    this.updateStats();
    
    logger.info('\n📊 Trading Statistics:');
    logger.info(`  Total Trades: ${this.stats.totalTrades}`);
    logger.info(`  Successful: ${this.stats.successfulTrades}`);
    logger.info(`  Win Rate: ${this.stats.winRate.toFixed(1)}%`);
    logger.info(`  Total PnL: ${this.stats.totalPnl.toFixed(4)} BNB`);
    logger.info(`  Best Trade: ${this.stats.bestTrade.toFixed(4)} BNB`);
    logger.info(`  Worst Trade: ${this.stats.worstTrade.toFixed(4)} BNB`);
    logger.info(`  Daily Trades: ${this.stats.dailyTrades}`);
    logger.info(`  Open Positions: ${this.stats.openPositions}`);
  }
}

export default AutomatedTrader;
