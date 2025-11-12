/**
 * Trading Loop Orchestrator
 * Implements the 8-step trading loop from the PRD:
 * 1. Discover Tokens
 * 2. Analyze Market Conditions
 * 3. Load Relevant Memories
 * 4. AI Decision Making
 * 5. Risk Assessment
 * 6. Execute Trade
 * 7. Store Memory
 * 8. Monitor & Learn
 */

import { logger } from '../utils/logger';
import { CONFIG } from '../config';
import { ImmortalAIAgent } from './immortalAgent';
import { executeTrade, getWalletBalance } from '../blockchain/tradeExecutor';
import { getTokenData } from '../data/marketFetcher';
import DynamicTokenDiscovery from '../blockchain/dynamicTokenDiscovery';
import { storeMemory } from '../blockchain/memoryStorage';
import { RiskManager } from './riskManager';
import { PerformanceTracker } from '../monitoring/performanceTracker';
import type { TradeMemory } from '../types/memory';

export interface TradingLoopConfig {
  enabled: boolean;
  intervalMs: number;
  maxTradesPerCycle: number;
  minConfidence: number;
  enableRiskManagement: boolean;
}

export interface TradingCycleResult {
  cycleId: string;
  timestamp: number;
  tokensDiscovered: number;
  tokensAnalyzed: number;
  decisionsConsidered: number;
  tradesExecuted: number;
  tradesSuccessful: number;
  errors: string[];
  performance: {
    cycleTime: number;
    avgDecisionTime: number;
    avgExecutionTime: number;
  };
}

export class TradingOrchestrator {
  private agent: ImmortalAIAgent;
  private discovery: DynamicTokenDiscovery;
  private riskManager: RiskManager;
  private performanceTracker: PerformanceTracker;
  private isRunning: boolean = false;
  private currentCycle: number = 0;
  private intervalHandle: NodeJS.Timeout | null = null;
  private config: TradingLoopConfig;
  private lastCycleResult: TradingCycleResult | null = null;
  private startTime: number | null = null;

  constructor(config?: Partial<TradingLoopConfig>) {
    this.config = {
      enabled: true,
      intervalMs: CONFIG.BOT_LOOP_INTERVAL_MS || 300000, // 5 minutes
      maxTradesPerCycle: 3,
      minConfidence: CONFIG.MIN_CONFIDENCE_THRESHOLD || 0.6,
      enableRiskManagement: true,
      ...config,
    };

    this.agent = new ImmortalAIAgent();
    this.discovery = new DynamicTokenDiscovery();
    this.riskManager = new RiskManager();
    this.performanceTracker = new PerformanceTracker();

    logger.info('🎯 Trading Orchestrator initialized');
    logger.info(`   - Interval: ${this.config.intervalMs / 1000}s`);
    logger.info(`   - Min Confidence: ${this.config.minConfidence * 100}%`);
    logger.info(`   - Risk Management: ${this.config.enableRiskManagement ? 'ON' : 'OFF'}`);
  }

  /**
   * Start the automated trading loop
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Trading loop already running');
      return;
    }

    logger.info('🚀 Starting automated trading loop...');

    // Load agent memories before starting
    await this.agent.loadMemories();

    this.isRunning = true;
    this.currentCycle = 0;
    this.startTime = Date.now();

    // Run first cycle immediately
    await this.executeTradingCycle();

    // Schedule recurring cycles
    this.intervalHandle = setInterval(async () => {
      if (this.isRunning) {
        await this.executeTradingCycle();
      }
    }, this.config.intervalMs);

    logger.info('✅ Trading loop started successfully');
  }

  /**
   * Stop the automated trading loop
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Trading loop not running');
      return;
    }

    logger.info('🛑 Stopping trading loop...');

    this.isRunning = false;
    this.startTime = null;

    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }

    logger.info('✅ Trading loop stopped');
  }

  /**
   * Execute a complete trading cycle (8 steps)
   */
  private async executeTradingCycle(): Promise<TradingCycleResult> {
    const cycleStart = Date.now();
    this.currentCycle++;

    const cycleId = `cycle_${this.currentCycle}_${Date.now()}`;

    logger.info(`\n${'='.repeat(80)}`);
    logger.info(`🔄 Trading Cycle #${this.currentCycle} (${cycleId})`);
    logger.info(`${'='.repeat(80)}\n`);

    const result: TradingCycleResult = {
      cycleId,
      timestamp: Date.now(),
      tokensDiscovered: 0,
      tokensAnalyzed: 0,
      decisionsConsidered: 0,
      tradesExecuted: 0,
      tradesSuccessful: 0,
      errors: [],
      performance: {
        cycleTime: 0,
        avgDecisionTime: 0,
        avgExecutionTime: 0,
      },
    };

    try {
      // ═══════════════════════════════════════════════════════════
      // STEP 1: DISCOVER TOKENS
      // ═══════════════════════════════════════════════════════════
      logger.info('📡 Step 1: Discovering tokens...');
      const stepStart = Date.now();

      const discoveredTokens = await this.discovery.discoverTrendingTokens({ limit: 20 });
      result.tokensDiscovered = discoveredTokens.length;

      logger.info(`   ✓ Discovered ${discoveredTokens.length} tokens (${Date.now() - stepStart}ms)`);

      if (discoveredTokens.length === 0) {
        logger.warn('   ⚠️ No tokens discovered, skipping cycle');
        return result;
      }

      // Filter tokens by risk level and liquidity
      const viableTokens = discoveredTokens.filter(
        (token) => token.riskLevel !== 'HIGH' && token.liquidity > 10000
      );

      result.tokensAnalyzed = viableTokens.length;
      logger.info(`   ✓ ${viableTokens.length} tokens passed initial filters`);

      // ═══════════════════════════════════════════════════════════
      // STEP 2: ANALYZE MARKET CONDITIONS
      // ═══════════════════════════════════════════════════════════
      logger.info('\n📊 Step 2: Analyzing market conditions...');

      const walletBalance = await getWalletBalance();
      logger.info(`   ✓ Wallet Balance: ${walletBalance.toFixed(4)} BNB`);

      if (walletBalance < 0.01) {
        logger.error('   ❌ Insufficient balance, stopping cycle');
        result.errors.push('Insufficient balance');
        return result;
      }

      // ═══════════════════════════════════════════════════════════
      // STEP 3-6: PROCESS EACH TOKEN
      // ═══════════════════════════════════════════════════════════
      const decisionTimes: number[] = [];
      const executionTimes: number[] = [];

      for (const token of viableTokens.slice(0, 5)) {
        // Limit to top 5 tokens
        try {
          logger.info(`\n💎 Analyzing ${token.symbol} (${token.address.slice(0, 8)}...)`);

          // STEP 3: Load relevant memories
          logger.info('   🧠 Step 3: Loading relevant memories...');
          const similarMemories = this.agent['findSimilarSituations'](
            token.address,
            {
              volume24h: token.volume24h,
              liquidity: token.liquidity,
              priceChange24h: token.priceChange24h,
            }
          );
          logger.info(`   ✓ Found ${similarMemories.length} similar past trades`);

          // STEP 4: AI Decision Making
          logger.info('   🤖 Step 4: AI decision making...');
          const decisionStart = Date.now();

          const decision = await this.agent.makeDecision(
            token.address,
            {
              symbol: token.symbol,
              price: token.price,
              volume24h: token.volume24h,
              liquidity: token.liquidity,
              priceChange24h: token.priceChange24h,
            },
            walletBalance
          );

          const decisionTime = Date.now() - decisionStart;
          decisionTimes.push(decisionTime);
          result.decisionsConsidered++;

          logger.info(`   ✓ Decision: ${decision.action} (${decisionTime}ms)`);
          logger.info(`   ✓ Confidence: ${(decision.confidence * 100).toFixed(1)}%`);
          logger.info(`   ✓ Amount: ${decision.amount.toFixed(4)} BNB`);
          logger.info(`   ✓ Reasoning: ${decision.reasoning.substring(0, 100)}...`);

          if (decision.action === 'HOLD' || decision.confidence < this.config.minConfidence) {
            logger.info('   ⏭️ Skipping trade (low confidence or HOLD)');
            continue;
          }

          // STEP 5: Risk Assessment
          logger.info('   🛡️ Step 5: Risk assessment...');

          if (this.config.enableRiskManagement) {
            const riskAssessment = await this.riskManager.assessTrade({
              tokenAddress: token.address,
              action: decision.action,
              amount: decision.amount,
              confidence: decision.confidence,
              currentBalance: walletBalance,
              tokenData: token,
            });

            if (!riskAssessment.approved) {
              logger.warn(`   ❌ Trade rejected by risk manager: ${riskAssessment.reason}`);
              result.errors.push(`Risk check failed: ${riskAssessment.reason}`);
              continue;
            }

            logger.info('   ✓ Risk assessment passed');

            // Apply risk adjustments
            if (riskAssessment.adjustedAmount) {
              logger.info(
                `   ✓ Amount adjusted: ${decision.amount} → ${riskAssessment.adjustedAmount} BNB`
              );
              decision.amount = riskAssessment.adjustedAmount;
            }
          }

          // STEP 6: Execute Trade
          logger.info('   ⚡ Step 6: Executing trade...');
          const executionStart = Date.now();

          const tradeResult = await executeTrade({
            tokenAddress: token.address,
            action: decision.action === 'BUY' ? 'buy' : 'sell',
            amountBNB: decision.amount,
            slippagePercent: CONFIG.MAX_SLIPPAGE_PERCENTAGE || 2,
          });

          const executionTime = Date.now() - executionStart;
          executionTimes.push(executionTime);

          result.tradesExecuted++;

          if (tradeResult.success) {
            result.tradesSuccessful++;
            logger.info(`   ✅ Trade executed successfully! (${executionTime}ms)`);
            logger.info(`   ✓ TX Hash: ${tradeResult.txHash}`);
            logger.info(`   ✓ Amount Out: ${tradeResult.amountOut}`);
            logger.info(`   ✓ Actual Price: ${tradeResult.actualPrice.toFixed(8)}`);

            // STEP 7: Store Memory
            logger.info('   💾 Step 7: Storing memory...');

            try {
              const memory: TradeMemory = {
                id: `${cycleId}_${token.symbol}`,
                timestamp: Date.now(),
                tokenAddress: token.address,
                tokenSymbol: token.symbol,
                action: decision.action.toLowerCase() as 'buy' | 'sell',
                amount: decision.amount,
                entryPrice: tradeResult.actualPrice,
                aiReasoning: `${decision.reasoning} (Confidence: ${(decision.confidence * 100).toFixed(1)}%, Strategy: ${decision.strategy || 'N/A'})`,
                outcome: 'pending',
                marketConditions: {
                  volume24h: token.volume24h,
                  liquidity: token.liquidity,
                  priceChange24h: token.priceChange24h,
                  buySellPressure: 0,
                },
                lessons: '',
              };

              await storeMemory(memory);
              logger.info('   ✓ Memory stored to BNB Greenfield');
            } catch (memoryError) {
              logger.error('   ❌ Failed to store memory:', memoryError);
              result.errors.push('Memory storage failed');
            }

            // Track performance
            this.performanceTracker.recordTrade({
              timestamp: Date.now(),
              token: token.symbol,
              action: decision.action,
              amount: decision.amount,
              price: tradeResult.actualPrice,
              success: true,
              confidence: decision.confidence,
            });
          } else {
            logger.error(`   ❌ Trade failed: ${tradeResult.error}`);
            result.errors.push(`Trade failed: ${tradeResult.error}`);
          }

          // Respect rate limits
          if (result.tradesExecuted >= this.config.maxTradesPerCycle) {
            logger.info(`\n⏸️ Max trades per cycle reached (${this.config.maxTradesPerCycle})`);
            break;
          }
        } catch (tokenError) {
          logger.error(`   ❌ Error processing ${token.symbol}:`, tokenError);
          result.errors.push(`Token processing error: ${tokenError}`);
        }
      }

      // ═══════════════════════════════════════════════════════════
      // STEP 8: Monitor & Learn
      // ═══════════════════════════════════════════════════════════
      logger.info('\n📈 Step 8: Monitor & Learn...');

      // Calculate performance metrics
      result.performance.cycleTime = Date.now() - cycleStart;
      result.performance.avgDecisionTime =
        decisionTimes.length > 0
          ? decisionTimes.reduce((a, b) => a + b, 0) / decisionTimes.length
          : 0;
      result.performance.avgExecutionTime =
        executionTimes.length > 0
          ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
          : 0;

      // Get performance summary
      const perfSummary = this.performanceTracker.getSummary();
      logger.info(`   ✓ Total Trades: ${perfSummary.totalTrades}`);
      logger.info(`   ✓ Success Rate: ${(perfSummary.successRate * 100).toFixed(1)}%`);
      logger.info(`   ✓ Avg Confidence: ${(perfSummary.avgConfidence * 100).toFixed(1)}%`);

      // Evolve agent personality based on performance
      if (result.tradesExecuted > 0) {
        logger.info('   🧬 Evolving agent personality...');
        // This will adjust risk tolerance, aggressiveness, etc.
        await this.agent['evolvePersonality']();
      }
    } catch (error) {
      logger.error('❌ Critical error in trading cycle:', error);
      result.errors.push(`Critical error: ${error}`);
    }

    // ═══════════════════════════════════════════════════════════
    // CYCLE SUMMARY
    // ═══════════════════════════════════════════════════════════
    logger.info(`\n${'='.repeat(80)}`);
    logger.info(`📊 Cycle #${this.currentCycle} Summary`);
    logger.info(`${'='.repeat(80)}`);
    logger.info(`   Tokens Discovered: ${result.tokensDiscovered}`);
    logger.info(`   Tokens Analyzed: ${result.tokensAnalyzed}`);
    logger.info(`   Decisions Made: ${result.decisionsConsidered}`);
    logger.info(`   Trades Executed: ${result.tradesExecuted}`);
    logger.info(`   Trades Successful: ${result.tradesSuccessful}`);
    logger.info(`   Errors: ${result.errors.length}`);
    logger.info(`   Cycle Time: ${(result.performance.cycleTime / 1000).toFixed(2)}s`);
    logger.info(
      `   Avg Decision Time: ${result.performance.avgDecisionTime.toFixed(0)}ms`
    );
    logger.info(
      `   Avg Execution Time: ${result.performance.avgExecutionTime.toFixed(0)}ms`
    );
    logger.info(`${'='.repeat(80)}\n`);

    this.lastCycleResult = result;
    return result;
  }

  /**
   * Get orchestrator status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      currentCycle: this.currentCycle,
      lastCycleResult: this.lastCycleResult,
      config: this.config,
      uptime: this.isRunning ? Date.now() - (this.lastCycleResult?.timestamp || Date.now()) : 0,
    };
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return this.performanceTracker.getSummary();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<TradingLoopConfig>) {
    this.config = { ...this.config, ...newConfig };
    logger.info('⚙️ Configuration updated:', newConfig);

    // Restart interval if running
    if (this.isRunning && this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = setInterval(async () => {
        if (this.isRunning) {
          await this.executeTradingCycle();
        }
      }, this.config.intervalMs);
    }
  }

  /**
   * Get comprehensive performance metrics
   */
  async getPerformance(): Promise<{
    summary: any;
    recentTrades: any[];
    strategies: any[];
    timeSeries: any[];
    bestTokens: any[];
  }> {
    return {
      summary: this.performanceTracker.getSummary(),
      recentTrades: this.performanceTracker.getRecentTrades(20),
      strategies: this.performanceTracker.getStrategyPerformance(),
      timeSeries: this.performanceTracker.getTimeSeriesData(24),
      bestTokens: this.performanceTracker.getBestTokens(10),
    };
  }

  /**
   * Get current risk status
   */
  async getRiskStatus(): Promise<{
    openPositions: any[];
    totalExposure: number;
    portfolioRisk: any;
    riskProfile: any;
  }> {
    const positions = this.riskManager.getOpenPositions();
    const totalExposure = positions.reduce((sum, pos) => sum + pos.amount, 0);
    const portfolioRisk = await this.riskManager.getPortfolioRisk();
    const riskProfile = this.riskManager.getRiskProfile();

    return {
      openPositions: positions,
      totalExposure,
      portfolioRisk,
      riskProfile,
    };
  }

  /**
   * Get current trading cycle status
   */
  async getCycleStatus(): Promise<{
    isRunning: boolean;
    config: TradingLoopConfig;
    lastCycleResult: TradingCycleResult | null;
    uptime: number;
  }> {
    const uptime = this.startTime ? Date.now() - this.startTime : 0;

    return {
      isRunning: this.isRunning,
      config: this.config,
      lastCycleResult: this.lastCycleResult,
      uptime,
    };
  }
}

// Singleton instance
let orchestratorInstance: TradingOrchestrator | null = null;

export function getTradingOrchestrator(): TradingOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new TradingOrchestrator();
  }
  return orchestratorInstance;
}

export function resetTradingOrchestrator(): void {
  orchestratorInstance = null;
}
