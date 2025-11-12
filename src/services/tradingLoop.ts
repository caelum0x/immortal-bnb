/**
 * Main Trading Loop Service
 * Implements the 8-step trading cycle from PRD:
 * 1. Discover Tokens
 * 2. Analyze Market Conditions
 * 3. Load Relevant Memories
 * 4. AI Decision Making
 * 5. Risk Assessment
 * 6. Execute Trade (if approved)
 * 7. Store Memory
 * 8. Monitor & Learn
 */

import { logger } from '../utils/logger';
import { CONFIG } from '../config';
import { ImmortalAIAgent } from '../ai/immortalAgent';
import { PositionManager } from './positionManager';
import { TelegramBot } from '../alerts/telegramBot';
import { getTrendingTokens, getTokenAnalytics } from '../data/marketFetcher';
import { executeTrade, getWalletBalance } from '../blockchain/tradeExecutor';
import { ethers } from 'ethers';

export interface TradingLoopConfig {
  interval: number; // milliseconds (default: 5 minutes)
  maxConcurrentTrades: number; // maximum open positions
  enableAutoTrading: boolean; // auto-execute trades or require approval
  networks: string[]; // supported networks
  tokenLimit: number; // max tokens to evaluate per cycle
}

export interface Token {
  address: string;
  symbol: string;
  name: string;
  price: number;
  volume24h: number;
  liquidity: number;
  priceChange24h: number;
  marketCap: number;
  riskScore: number;
}

export interface MarketConditions {
  trend: 'bullish' | 'bearish' | 'sideways';
  volatility: number; // 0-1 scale
  volume: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  timestamp: number;
}

export interface Decision {
  action: 'BUY' | 'SELL' | 'HOLD';
  amount: number;
  confidence: number;
  reasoning: string;
  strategy: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class TradingLoop {
  private agent: ImmortalAIAgent;
  private positionManager: PositionManager;
  private telegram: TelegramBot;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private config: TradingLoopConfig;
  private cycleCount: number = 0;
  private lastCycleTime: number = 0;
  private errors: number = 0;

  constructor(config?: Partial<TradingLoopConfig>) {
    this.config = {
      interval: config?.interval || CONFIG.BOT_LOOP_INTERVAL_MS || 300000, // 5 minutes
      maxConcurrentTrades: config?.maxConcurrentTrades || 5,
      enableAutoTrading: config?.enableAutoTrading ?? true,
      networks: config?.networks || ['bnb'],
      tokenLimit: config?.tokenLimit || 10,
    };

    this.agent = new ImmortalAIAgent();
    this.positionManager = new PositionManager();
    this.telegram = new TelegramBot();

    logger.info('🔧 Trading Loop initialized', { config: this.config });
  }

  /**
   * Start the trading loop
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Trading loop already running');
      throw new Error('Trading loop already running');
    }

    logger.info('🚀 Starting Trading Loop...');

    try {
      // Initialize AI agent and load memories
      logger.info('📚 Loading AI memories from Greenfield...');
      await this.agent.loadMemories();

      // Start position monitoring
      logger.info('📊 Starting position monitoring...');
      await this.positionManager.startMonitoring();

      // Check wallet balance
      const balance = await getWalletBalance();
      if (balance < 0.01) {
        logger.warn(`⚠️  Low balance: ${balance.toFixed(4)} BNB - Consider adding funds`);
      }

      this.isRunning = true;
      this.errors = 0;

      // Execute first cycle immediately
      await this.executeCycle();

      // Set up interval for subsequent cycles
      this.intervalId = setInterval(async () => {
        try {
          await this.executeCycle();
        } catch (error) {
          logger.error('Interval cycle error:', error);
          this.errors++;
          
          // Stop if too many consecutive errors
          if (this.errors >= 5) {
            logger.error('❌ Too many errors, stopping trading loop');
            await this.stop();
            await this.telegram.sendMessage('🚨 Trading loop stopped due to errors');
          }
        }
      }, this.config.interval);

      await this.telegram.sendMessage(
        `🤖 Immortal Bot Started\n` +
        `Network: ${CONFIG.TRADING_NETWORK}\n` +
        `Interval: ${this.config.interval / 60000} minutes\n` +
        `Balance: ${balance.toFixed(4)} BNB`
      );

      logger.info('✅ Trading Loop started successfully');
    } catch (error) {
      logger.error('Failed to start trading loop:', error);
      await this.telegram.sendMessage(`❌ Failed to start: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Stop the trading loop
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Trading loop not running');
      return;
    }

    logger.info('🛑 Stopping Trading Loop...');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;

    // Stop position monitoring
    await this.positionManager.stopMonitoring();

    const stats = await this.positionManager.getPerformanceStats();
    await this.telegram.sendMessage(
      `⏸️ Immortal Bot Stopped\n` +
      `Cycles: ${this.cycleCount}\n` +
      `Win Rate: ${stats.winRate.toFixed(1)}%\n` +
      `Total P&L: ${stats.totalPL.toFixed(2)}%`
    );

    logger.info('✅ Trading Loop stopped');
  }

  /**
   * Check if trading loop is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get loop statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      cycleCount: this.cycleCount,
      lastCycleTime: this.lastCycleTime,
      errors: this.errors,
      uptime: this.lastCycleTime - (this.lastCycleTime - (this.cycleCount * this.config.interval)),
    };
  }

  /**
   * Execute one complete trading cycle (8 steps)
   */
  private async executeCycle(): Promise<void> {
    this.cycleCount++;
    this.lastCycleTime = Date.now();

    const cycleId = `cycle_${this.cycleCount}_${Date.now()}`;
    logger.info(`\n${'='.repeat(70)}`);
    logger.info(`🔄 Trading Cycle #${this.cycleCount} - ${new Date().toISOString()}`);
    logger.info(`${'='.repeat(70)}\n`);

    const startTime = Date.now();

    try {
      // STEP 1: DISCOVER TOKENS
      logger.info('📊 STEP 1: Discovering trending tokens...');
      const tokens = await this.discoverTokens();
      logger.info(`✓ Found ${tokens.length} potential tokens`);

      // STEP 2: ANALYZE MARKET CONDITIONS
      logger.info('\n📈 STEP 2: Analyzing market conditions...');
      const marketConditions = await this.analyzeMarketConditions();
      logger.info(`✓ Market: ${marketConditions.trend}, Volatility: ${(marketConditions.volatility * 100).toFixed(1)}%`);

      // STEP 3: MONITOR EXISTING POSITIONS (Stop-Loss Check)
      logger.info('\n👀 STEP 3: Monitoring existing positions...');
      await this.positionManager.checkAllStopLoss();
      const positions = await this.positionManager.getActivePositions();
      logger.info(`✓ Active positions: ${positions.length}/${this.config.maxConcurrentTrades}`);

      // STEP 4-8: EVALUATE EACH TOKEN
      logger.info('\n🎯 STEP 4-8: Evaluating tokens for trading opportunities...\n');
      
      const tokensToEvaluate = tokens.slice(0, this.config.tokenLimit);
      for (let i = 0; i < tokensToEvaluate.length; i++) {
        const token = tokensToEvaluate[i];
        logger.info(`[${i + 1}/${tokensToEvaluate.length}] Evaluating ${token.symbol}...`);
        
        try {
          await this.evaluateToken(token, marketConditions);
        } catch (error) {
          logger.error(`Error evaluating ${token.symbol}:`, error);
        }
      }

      // PERFORMANCE SUMMARY
      logger.info('\n📊 CYCLE SUMMARY:');
      const performance = await this.positionManager.getPerformanceStats();
      logger.info(`Win Rate: ${performance.winRate.toFixed(1)}%`);
      logger.info(`Total P&L: ${performance.totalPL.toFixed(2)}%`);
      logger.info(`Active Positions: ${positions.length}`);
      
      const duration = Date.now() - startTime;
      logger.info(`Cycle Duration: ${(duration / 1000).toFixed(1)}s`);
      logger.info(`\n${'='.repeat(70)}\n`);

      // Reset error counter on successful cycle
      this.errors = 0;

    } catch (error) {
      logger.error('❌ Trading cycle error:', error);
      this.errors++;
      await this.telegram.sendMessage(`⚠️ Cycle #${this.cycleCount} Error: ${(error as Error).message}`);
    }
  }

  /**
   * STEP 1: Discover trending tokens
   */
  private async discoverTokens(): Promise<Token[]> {
    try {
      // Get trending tokens from DexScreener
      const trending = await getTrendingTokens('bsc', 50);

      // Filter and score tokens
      const tokens: Token[] = trending
        .filter(t => {
          // Basic filters from PRD
          return (
            t.liquidity > 10000 && // Min $10k liquidity
            t.volume24h > 5000 && // Min $5k volume
            t.priceChange24h > -20 && // Not crashing too hard
            t.priceChange24h < 100 // Not pumping too hard (likely scam)
          );
        })
        .map(t => ({
          address: t.address,
          symbol: t.symbol,
          name: t.name || t.symbol,
          price: t.price,
          volume24h: t.volume24h,
          liquidity: t.liquidity,
          priceChange24h: t.priceChange24h,
          marketCap: t.marketCap || 0,
          riskScore: this.calculateRiskScore(t),
        }))
        .sort((a, b) => b.volume24h - a.volume24h) // Sort by volume
        .slice(0, 20); // Top 20

      return tokens;
    } catch (error) {
      logger.error('Token discovery failed:', error);
      return [];
    }
  }

  /**
   * Calculate risk score for a token (0-1, lower is better)
   */
  private calculateRiskScore(token: any): number {
    let score = 0;

    // Low liquidity = higher risk
    if (token.liquidity < 50000) score += 0.3;
    else if (token.liquidity < 100000) score += 0.2;

    // Extreme price changes = higher risk
    if (Math.abs(token.priceChange24h) > 50) score += 0.3;
    else if (Math.abs(token.priceChange24h) > 20) score += 0.2;

    // Low volume = higher risk
    if (token.volume24h < 10000) score += 0.2;

    return Math.min(score, 1);
  }

  /**
   * STEP 2: Analyze overall market conditions
   */
  private async analyzeMarketConditions(): Promise<MarketConditions> {
    try {
      const trending = await getTrendingTokens('bsc', 100);

      // Calculate aggregate metrics
      const avgChange = trending.reduce((sum, t) => sum + t.priceChange24h, 0) / trending.length;
      const totalVolume = trending.reduce((sum, t) => sum + t.volume24h, 0);
      
      // Determine trend
      let trend: 'bullish' | 'bearish' | 'sideways' = 'sideways';
      if (avgChange > 5) trend = 'bullish';
      else if (avgChange < -5) trend = 'bearish';

      // Calculate volatility
      const changes = trending.map(t => t.priceChange24h);
      const variance = changes.reduce((sum, change) => sum + Math.pow(change - avgChange, 2), 0) / changes.length;
      const volatility = Math.sqrt(variance) / 100; // Normalize to 0-1

      // Sentiment based on positive vs negative changes
      const positiveCount = trending.filter(t => t.priceChange24h > 0).length;
      const sentiment = positiveCount > trending.length * 0.6 ? 'positive' :
                        positiveCount < trending.length * 0.4 ? 'negative' : 'neutral';

      return {
        trend,
        volatility: Math.min(volatility, 1),
        volume: totalVolume,
        sentiment,
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.error('Market analysis failed:', error);
      return {
        trend: 'sideways',
        volatility: 0.5,
        volume: 0,
        sentiment: 'neutral',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * STEPS 4-8: Evaluate a single token for trading
   */
  private async evaluateToken(
    token: Token,
    marketConditions: MarketConditions
  ): Promise<void> {
    try {
      // Get available balance
      const balance = await getWalletBalance();
      const maxTradeAmount = Math.min(
        balance * 0.1, // Max 10% of balance per trade
        CONFIG.MAX_TRADE_AMOUNT_BNB
      );

      // Get detailed token analytics
      const analytics = await getTokenAnalytics(token.address);

      // STEP 4: AI DECISION MAKING
      const decision = await this.agent.makeDecision(
        token.address,
        { ...token, ...analytics, marketConditions },
        maxTradeAmount
      );

      logger.info(`  AI Decision: ${decision.action} (${decision.confidence.toFixed(0)}% confidence)`);
      logger.info(`  Reasoning: ${decision.reasoning.substring(0, 100)}...`);

      // STEP 5: RISK ASSESSMENT
      if (decision.action === 'HOLD') {
        logger.info(`  ⏭️  Skipping - AI recommends HOLD`);
        return;
      }

      // Check confidence threshold
      if (decision.confidence < CONFIG.MIN_CONFIDENCE_THRESHOLD * 100) {
        logger.info(`  ⏭️  Skipping - Low confidence (${decision.confidence.toFixed(0)}% < ${CONFIG.MIN_CONFIDENCE_THRESHOLD * 100}%)`);
        return;
      }

      // Check if we can open new position
      const canTrade = await this.positionManager.canOpenPosition(decision.amount);
      if (!canTrade) {
        logger.info(`  ⏭️  Skipping - Max positions reached or insufficient balance`);
        return;
      }

      // Check risk level
      if (decision.riskLevel === 'HIGH' && this.config.maxConcurrentTrades > 2) {
        logger.info(`  ⚠️  High risk trade - Reducing position size`);
        decision.amount *= 0.5;
      }

      // STEP 6: EXECUTE TRADE (if auto-trading enabled)
      if (this.config.enableAutoTrading && decision.action === 'BUY') {
        await this.executeBuyTrade(token, decision, marketConditions);
      } else {
        logger.info(`  ℹ️  Trade ready (auto-trading disabled)`);
      }

    } catch (error) {
      logger.error(`Token evaluation error for ${token.symbol}:`, error);
    }
  }

  /**
   * STEP 6-7: Execute a buy trade and store memory
   */
  private async executeBuyTrade(
    token: Token,
    decision: Decision,
    marketConditions: MarketConditions
  ): Promise<void> {
    logger.info(`  💰 Executing BUY for ${token.symbol}...`);

    try {
      // Execute trade via blockchain
      const WBNB_ADDRESS = CONFIG.TRADING_NETWORK === 'opbnb' 
        ? '0x4200000000000000000000000000000000000006'
        : '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';

      const trade = await executeTrade({
        tokenIn: WBNB_ADDRESS,
        tokenOut: token.address,
        amountIn: ethers.parseEther(decision.amount.toString()),
        slippage: CONFIG.MAX_SLIPPAGE_PERCENTAGE || 2,
      });

      logger.info(`  ✅ Trade executed! TX: ${trade.hash}`);

      // STEP 7: ADD TO POSITION MANAGER
      await this.positionManager.addPosition({
        id: trade.hash || `pos_${Date.now()}`,
        token: token.address,
        symbol: token.symbol,
        entryPrice: token.price,
        amount: decision.amount,
        strategy: decision.strategy,
        confidence: decision.confidence,
        timestamp: Date.now(),
        txHash: trade.hash,
        status: 'open',
      });

      // STEP 8: STORE IN IMMORTAL MEMORY
      await this.agent.learnFromTrade(
        token.symbol,
        token.address,
        'BUY',
        decision.amount,
        token.price,
        token.price, // Exit price (will be updated later)
        marketConditions,
        decision.strategy
      );

      // Send notification
      await this.telegram.sendMessage(
        `✅ BUY ${token.symbol}\n` +
        `Amount: ${decision.amount.toFixed(4)} BNB\n` +
        `Price: $${token.price.toFixed(6)}\n` +
        `Confidence: ${decision.confidence.toFixed(0)}%\n` +
        `Strategy: ${decision.strategy}\n` +
        `TX: ${trade.hash}`
      );

      logger.info(`  🎉 Trade complete and stored in memory`);

    } catch (error) {
      logger.error(`  ❌ Trade execution failed:`, error);
      await this.telegram.sendMessage(
        `❌ Failed to BUY ${token.symbol}\n` +
        `Error: ${(error as Error).message}`
      );
      throw error;
    }
  }
}
