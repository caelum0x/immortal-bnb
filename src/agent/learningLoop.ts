import { logger } from '../utils/logger';
import { queryMemories, updateMemory, storeMemory } from '../blockchain/memoryStorage';
import type { TradeMemory } from '../types/memory';

interface LearningInsight {
  pattern: string;
  confidence: number;
  description: string;
  actionable: boolean;
}

interface PerformanceMetrics {
  totalTrades: number;
  profitableTrades: number;
  lossfulTrades: number;
  successRate: number;
  avgProfitLoss: number;
  totalProfitLoss: number;
  bestTrade: TradeMemory | null;
  worstTrade: TradeMemory | null;
  avgHoldTime: number;
  winLossRatio: number;
}

export class LearningLoop {
  private lastLearningTime = 0;
  private learningInterval = 30 * 60 * 1000; // 30 minutes
  private insights: LearningInsight[] = [];

  /**
   * Main learning loop - analyze past performance and adapt strategies
   */
  async runLearningCycle(): Promise<void> {
    const now = Date.now();
    
    // Only run learning if enough time has passed
    if (now - this.lastLearningTime < this.learningInterval) {
      return;
    }

    try {
      logger.info('🧠 Starting AI learning cycle...');
      this.lastLearningTime = now;

      // Get all completed trades for analysis
      const completedTrades = await this.getCompletedTrades();
      
      if (completedTrades.length < 5) {
        logger.info('📊 Insufficient trade data for learning (need at least 5 completed trades)');
        return;
      }

      // Analyze performance
      const metrics = this.calculatePerformanceMetrics(completedTrades);
      logger.info(`📈 Performance: ${metrics.successRate.toFixed(1)}% success rate, ${metrics.totalProfitLoss.toFixed(4)} BNB P/L`);

      // Generate insights
      const newInsights = await this.generateLearningInsights(completedTrades, metrics);
      this.insights = [...this.insights, ...newInsights];

      // Store learning insights as immortal memories
      await this.storeLearningInsights(newInsights);

      // Update trade outcomes for pending trades
      await this.updatePendingTradeOutcomes();

      logger.info(`🎓 Learning cycle complete. Generated ${newInsights.length} new insights.`);

    } catch (error) {
      logger.error(`Learning cycle error: ${(error as Error).message}`);
    }
  }

  /**
   * Get all completed trades from memory storage
   */
  private async getCompletedTrades(): Promise<TradeMemory[]> {
    const allTrades = await queryMemories({ limit: 1000 });
    return allTrades.filter(trade => trade.outcome && trade.outcome !== 'pending');
  }

  /**
   * Calculate comprehensive performance metrics
   */
  private calculatePerformanceMetrics(trades: TradeMemory[]): PerformanceMetrics {
    const profitableTrades = trades.filter(t => t.outcome === 'profit');
    const lossfulTrades = trades.filter(t => t.outcome === 'loss');
    
    const totalProfitLoss = trades.reduce((sum, trade) => {
      return sum + (trade.profitLoss || 0);
    }, 0);

    const avgProfitLoss = totalProfitLoss / trades.length;
    const successRate = (profitableTrades.length / trades.length) * 100;

    const avgHoldTime = trades.reduce((sum, trade) => {
      const holdTime = trade.timestamp; // Simplified for now - could track exit times
      return sum + holdTime;
    }, 0) / trades.length;

    const bestTrade = trades.reduce((best, current) => {
      return (current.profitLoss || 0) > (best?.profitLoss || -Infinity) ? current : best;
    }, null as TradeMemory | null);

    const worstTrade = trades.reduce((worst, current) => {
      return (current.profitLoss || 0) < (worst?.profitLoss || Infinity) ? current : worst;
    }, null as TradeMemory | null);

    const avgProfit = profitableTrades.length > 0 
      ? profitableTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0) / profitableTrades.length 
      : 0;

    const avgLoss = lossfulTrades.length > 0 
      ? Math.abs(lossfulTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0) / lossfulTrades.length)
      : 0;

    const winLossRatio = avgLoss > 0 ? avgProfit / avgLoss : 0;

    return {
      totalTrades: trades.length,
      profitableTrades: profitableTrades.length,
      lossfulTrades: lossfulTrades.length,
      successRate,
      avgProfitLoss,
      totalProfitLoss,
      bestTrade,
      worstTrade,
      avgHoldTime,
      winLossRatio
    };
  }

  /**
   * Generate actionable learning insights from trade history
   */
  private async generateLearningInsights(
    trades: TradeMemory[], 
    metrics: PerformanceMetrics
  ): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    // Pattern 1: Token-specific performance
    const tokenPerformance = this.analyzeTokenPerformance(trades);
    for (const [token, perf] of Object.entries(tokenPerformance)) {
      if (perf.trades >= 3) {
        if (perf.successRate < 30) {
          insights.push({
            pattern: `AVOID_TOKEN_${token}`,
            confidence: Math.min(0.9, (100 - perf.successRate) / 100),
            description: `Token ${token} has poor performance: ${perf.successRate.toFixed(1)}% success rate over ${perf.trades} trades`,
            actionable: true
          });
        } else if (perf.successRate > 70) {
          insights.push({
            pattern: `FAVOR_TOKEN_${token}`,
            confidence: Math.min(0.9, perf.successRate / 100),
            description: `Token ${token} shows strong performance: ${perf.successRate.toFixed(1)}% success rate over ${perf.trades} trades`,
            actionable: true
          });
        }
      }
    }

    // Pattern 2: Market condition analysis
    const marketConditionInsights = this.analyzeMarketConditions(trades);
    insights.push(...marketConditionInsights);

    // Pattern 3: Trade size optimization
    const tradeSizeInsights = this.analyzeTradeSizeEffectiveness(trades);
    insights.push(...tradeSizeInsights);

    // Pattern 4: Timing analysis
    const timingInsights = this.analyzeTradeTimings(trades);
    insights.push(...timingInsights);

    return insights.filter(insight => insight.confidence > 0.6);
  }

  /**
   * Analyze performance by token
   */
  private analyzeTokenPerformance(trades: TradeMemory[]): Record<string, any> {
    const tokenStats: Record<string, { trades: number; profits: number; successRate: number }> = {};

    for (const trade of trades) {
      const token = trade.tokenSymbol;
      if (!tokenStats[token]) {
        tokenStats[token] = { trades: 0, profits: 0, successRate: 0 };
      }

      tokenStats[token].trades++;
      if (trade.outcome === 'profit') {
        tokenStats[token].profits++;
      }
    }

    // Calculate success rates
    for (const token in tokenStats) {
      const stats = tokenStats[token];
      if (stats) {
        stats.successRate = (stats.profits / stats.trades) * 100;
      }
    }

    return tokenStats;
  }

  /**
   * Analyze effectiveness based on market conditions
   */
  private analyzeMarketConditions(trades: TradeMemory[]): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Group trades by volume ranges
    const highVolumeTrades = trades.filter(t => (t.marketConditions?.volume24h || 0) > 1000000);
    const lowVolumeTrades = trades.filter(t => (t.marketConditions?.volume24h || 0) < 100000);

    if (highVolumeTrades.length >= 5) {
      const highVolumeSuccess = (highVolumeTrades.filter(t => t.outcome === 'profit').length / highVolumeTrades.length) * 100;
      
      if (highVolumeSuccess > 60) {
        insights.push({
          pattern: 'PREFER_HIGH_VOLUME',
          confidence: Math.min(0.9, highVolumeSuccess / 100),
          description: `High volume trades (>$1M) show ${highVolumeSuccess.toFixed(1)}% success rate`,
          actionable: true
        });
      }
    }

    if (lowVolumeTrades.length >= 5) {
      const lowVolumeSuccess = (lowVolumeTrades.filter(t => t.outcome === 'profit').length / lowVolumeTrades.length) * 100;
      
      if (lowVolumeSuccess < 40) {
        insights.push({
          pattern: 'AVOID_LOW_VOLUME',
          confidence: Math.min(0.9, (100 - lowVolumeSuccess) / 100),
          description: `Low volume trades (<$100K) show poor ${lowVolumeSuccess.toFixed(1)}% success rate`,
          actionable: true
        });
      }
    }

    return insights;
  }

  /**
   * Analyze trade size effectiveness
   */
  private analyzeTradeSizeEffectiveness(trades: TradeMemory[]): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Group by trade size percentages
    const smallTrades = trades.filter(t => t.amount <= 0.02); // <= 2%
    const mediumTrades = trades.filter(t => t.amount > 0.02 && t.amount <= 0.05); // 2-5%
    const largeTrades = trades.filter(t => t.amount > 0.05); // >5%

    const groups = [
      { name: 'SMALL', trades: smallTrades, range: '≤2%' },
      { name: 'MEDIUM', trades: mediumTrades, range: '2-5%' },
      { name: 'LARGE', trades: largeTrades, range: '>5%' }
    ];

    for (const group of groups) {
      if (group.trades.length >= 3) {
        const successRate = (group.trades.filter(t => t.outcome === 'profit').length / group.trades.length) * 100;
        const avgProfitLoss = group.trades.reduce((sum, t) => sum + (t.profitLoss || 0), 0) / group.trades.length;

        if (successRate > 65 && avgProfitLoss > 0) {
          insights.push({
            pattern: `OPTIMAL_SIZE_${group.name}`,
            confidence: Math.min(0.8, successRate / 100),
            description: `${group.range} trades show strong performance: ${successRate.toFixed(1)}% success, ${avgProfitLoss.toFixed(4)} BNB avg P/L`,
            actionable: true
          });
        }
      }
    }

    return insights;
  }

  /**
   * Analyze trade timing patterns
   */
  private analyzeTradeTimings(trades: TradeMemory[]): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Analyze by hour of day
    const hourlyStats: Record<number, { trades: number; profits: number }> = {};
    
    for (const trade of trades) {
      const hour = new Date(trade.timestamp).getHours();
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = { trades: 0, profits: 0 };
      }
      
      hourlyStats[hour].trades++;
      if (trade.outcome === 'profit') {
        hourlyStats[hour].profits++;
      }
    }

    // Find best performing hours
    const bestHours = Object.entries(hourlyStats)
      .filter(([_, stats]) => stats.trades >= 3)
      .map(([hour, stats]) => ({
        hour: parseInt(hour),
        successRate: (stats.profits / stats.trades) * 100
      }))
      .filter(h => h.successRate > 70)
      .sort((a, b) => b.successRate - a.successRate);

    if (bestHours.length > 0) {
      const topHour = bestHours[0];
      if (topHour) {
        insights.push({
          pattern: `OPTIMAL_HOUR_${topHour.hour}`,
          confidence: Math.min(0.8, topHour.successRate / 100),
          description: `Hour ${topHour.hour}:00 shows excellent performance: ${topHour.successRate.toFixed(1)}% success rate`,
          actionable: true
        });
      }
    }

    return insights;
  }

  /**
   * Store learning insights as memories for future reference
   */
  private async storeLearningInsights(insights: LearningInsight[]): Promise<void> {
    for (const insight of insights) {
      const learningMemory = {
        id: `learning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        type: 'learning_insight',
        pattern: insight.pattern,
        confidence: insight.confidence,
        description: insight.description,
        actionable: insight.actionable
      };

      await storeMemory(learningMemory as any);
    }

    logger.info(`📝 Stored ${insights.length} learning insights in immortal memory`);
  }

  /**
   * Update outcomes for pending trades based on current prices
   */
  private async updatePendingTradeOutcomes(): Promise<void> {
    const pendingTrades = await queryMemories({ outcome: 'pending' });
    
    logger.info(`🔄 Checking ${pendingTrades.length} pending trades for outcome updates...`);

    // TODO: Implement price checking and outcome updating logic
    // This would require fetching current prices and comparing to entry prices
    // For now, we'll log the count
    
    if (pendingTrades.length > 0) {
      logger.info(`⏳ ${pendingTrades.length} trades still pending outcome determination`);
    }
  }

  /**
   * Get current learning insights
   */
  getLearningInsights(): LearningInsight[] {
    return this.insights;
  }

  /**
   * Get insights that match a specific pattern
   */
  getInsightsByPattern(pattern: string): LearningInsight[] {
    return this.insights.filter(insight => 
      insight.pattern.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Check if we should avoid a specific action based on learning
   */
  shouldAvoidAction(tokenSymbol: string, action: string): boolean {
    const avoidPattern = `AVOID_TOKEN_${tokenSymbol}`;
    const insight = this.insights.find(i => i.pattern === avoidPattern);
    return insight ? insight.confidence > 0.7 : false;
  }

  /**
   * Get recommended position size based on learning
   */
  getOptimalPositionSize(): number {
    // Look for optimal size insights
    const sizeInsights = this.insights.filter(i => i.pattern.startsWith('OPTIMAL_SIZE_'));
    
    if (sizeInsights.length === 0) {
      return 0.03; // Default 3%
    }

    // Return size based on highest confidence insight
    const bestInsight = sizeInsights.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    if (bestInsight.pattern.includes('SMALL')) return 0.02; // 2%
    if (bestInsight.pattern.includes('MEDIUM')) return 0.035; // 3.5%
    if (bestInsight.pattern.includes('LARGE')) return 0.06; // 6%
    
    return 0.03; // Default
  }

  /**
   * Get recent memories to inform AI decisions (backward compatibility)
   */
  async getRecentMemories(limit = 10): Promise<string[]> {
    try {
      const memories = await queryMemories({ limit });
      return memories.map(memory => this.formatMemoryForPrompt(memory));
    } catch (error) {
      logger.error(`Error getting recent memories: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Format memory for AI prompt
   */
  private formatMemoryForPrompt(memory: TradeMemory): string {
    return `
Memory #${memory.id}:
- Token: ${memory.tokenSymbol} (${memory.tokenAddress})
- Action: ${memory.action.toUpperCase()}
- Entry: $${memory.entryPrice}${memory.exitPrice ? ` → Exit: $${memory.exitPrice}` : ''}
- Amount: ${memory.amount} BNB
- Outcome: ${memory.outcome || 'pending'}${memory.profitLoss ? ` (${memory.profitLoss > 0 ? '+' : ''}${memory.profitLoss.toFixed(4)} BNB)` : ''}
- Reasoning: ${memory.aiReasoning}
- Market: Vol $${memory.marketConditions?.volume24h?.toLocaleString() || 'N/A'}, Liq $${memory.marketConditions?.liquidity?.toLocaleString() || 'N/A'}
`.trim();
  }
}

export const learningLoop = new LearningLoop();

// Legacy exports for backward compatibility
export const getRecentMemories = learningLoop.getRecentMemories.bind(learningLoop);

export default {
  getRecentMemories,
  learningLoop
};
