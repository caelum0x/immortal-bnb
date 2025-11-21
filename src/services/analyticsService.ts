/**
 * Portfolio Analytics Service
 *
 * Calculates trading performance metrics from the Prisma database:
 * - Profit/loss timeline
 * - Trade distribution (wins/losses)
 * - Top performing tokens
 * - Performance metrics (Sharpe ratio, max drawdown, win rate, etc.)
 */

import { PrismaClient } from '../../generated/prisma';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface ProfitTimelineEntry {
  date: string;
  profit: number;
}

export interface TradeDistribution {
  win: number;
  loss: number;
  breakeven: number;
}

export interface TopToken {
  symbol: string;
  profit: number;
  trades: number;
}

export interface PerformanceMetrics {
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
}

export interface AnalyticsData {
  profitTimeline: ProfitTimelineEntry[];
  tradeDistribution: TradeDistribution;
  topTokens: TopToken[];
  performanceMetrics: PerformanceMetrics;
}

export class AnalyticsService {
  /**
   * Get portfolio analytics for a given timeframe
   */
  async getAnalytics(timeframe: '7d' | '30d' | '90d' | 'all' = '30d', userId?: string): Promise<AnalyticsData> {
    try {
      // Calculate time filter
      const startDate = this.getStartDate(timeframe);

      // Fetch completed trades from database
      const where: any = {
        status: 'SETTLED',
        executedAt: startDate ? { gte: startDate } : undefined,
      };

      if (userId) {
        where.userId = userId;
      }

      const trades = await (prisma as any).trade.findMany({
        where,
        orderBy: { executedAt: 'asc' },
      });

      logger.info(`📊 Analyzing ${trades.length} trades for analytics (timeframe: ${timeframe})`);

      if (trades.length === 0) {
        return this.getEmptyAnalytics();
      }

      // Calculate profit/loss for each trade
      const tradesWithPnL = trades.map((trade: any) => {
        // Calculate PnL based on side and execution
        // For simplicity: (avgFillPrice - price) * filledAmount - fee
        let pnl = 0;

        if (trade.side === 'BUY') {
          // For buy trades, profit if we can sell higher
          // PnL = (exit_price - entry_price) * amount - fees
          // Since we don't have exit price yet, we use the fill vs order price difference
          pnl = (trade.avgFillPrice - trade.price) * trade.filledAmount - trade.fee;
        } else {
          // For sell trades, profit if we bought lower
          pnl = (trade.price - trade.avgFillPrice) * trade.filledAmount - trade.fee;
        }

        return {
          ...trade,
          pnl,
          isWin: pnl > 0.01,
          isLoss: pnl < -0.01,
          isBreakEven: Math.abs(pnl) <= 0.01,
        };
      });

      // 1. Profit Timeline
      const profitTimeline = this.calculateProfitTimeline(tradesWithPnL);

      // 2. Trade Distribution
      const tradeDistribution = this.calculateTradeDistribution(tradesWithPnL);

      // 3. Top Tokens
      const topTokens = this.calculateTopTokens(tradesWithPnL);

      // 4. Performance Metrics
      const performanceMetrics = this.calculatePerformanceMetrics(tradesWithPnL);

      return {
        profitTimeline,
        tradeDistribution,
        topTokens,
        performanceMetrics,
      };

    } catch (error) {
      logger.error('Failed to calculate analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate profit timeline (cumulative P&L over time)
   */
  private calculateProfitTimeline(trades: any[]): ProfitTimelineEntry[] {
    const timeline: ProfitTimelineEntry[] = [];
    let cumulativeProfit = 0;

    trades.forEach(trade => {
      cumulativeProfit += trade.pnl;
      const date = trade.executedAt
        ? new Date(trade.executedAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      // Group by date (combine trades from same day)
      const existing = timeline.find(entry => entry.date === date);
      if (existing) {
        existing.profit = cumulativeProfit;
      } else {
        timeline.push({ date: date as string, profit: cumulativeProfit });
      }
    });

    return timeline;
  }

  /**
   * Calculate trade distribution (wins, losses, break-even)
   */
  private calculateTradeDistribution(trades: any[]): TradeDistribution {
    return {
      win: trades.filter(t => t.isWin).length,
      loss: trades.filter(t => t.isLoss).length,
      breakeven: trades.filter(t => t.isBreakEven).length,
    };
  }

  /**
   * Calculate top performing tokens
   */
  private calculateTopTokens(trades: any[]): TopToken[] {
    const tokenMap = new Map<string, { profit: number; trades: number }>();

    trades.forEach(trade => {
      const symbol = this.extractTokenSymbol(trade.tokenId);
      const existing = tokenMap.get(symbol) || { profit: 0, trades: 0 };

      tokenMap.set(symbol, {
        profit: existing.profit + trade.pnl,
        trades: existing.trades + 1,
      });
    });

    return Array.from(tokenMap.entries())
      .map(([symbol, data]) => ({ symbol, ...data }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(trades: any[]): PerformanceMetrics {
    const winningTrades = trades.filter(t => t.isWin);
    const losingTrades = trades.filter(t => t.isLoss);

    // Total return
    const totalReturn = trades.reduce((sum, t) => sum + t.pnl, 0);

    // Win rate
    const winRate = trades.length > 0
      ? (winningTrades.length / trades.length) * 100
      : 0;

    // Average win/loss
    const wins = winningTrades.map(t => t.pnl);
    const losses = losingTrades.map(t => Math.abs(t.pnl));

    const avgWin = wins.length > 0
      ? wins.reduce((a, b) => a + b, 0) / wins.length
      : 0;

    const avgLoss = losses.length > 0
      ? losses.reduce((a, b) => a + b, 0) / losses.length
      : 0;

    // Profit factor
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

    // Sharpe Ratio (simplified - annualized)
    const returns = trades.map(t => t.pnl);
    const avgReturn = returns.length > 0
      ? returns.reduce((a, b) => a + b, 0) / returns.length
      : 0;

    const variance = returns.length > 0
      ? returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
      : 0;

    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized

    // Max Drawdown
    const maxDrawdown = this.calculateMaxDrawdown(trades);

    return {
      totalReturn,
      sharpeRatio,
      maxDrawdown,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
    };
  }

  /**
   * Calculate maximum drawdown
   */
  private calculateMaxDrawdown(trades: any[]): number {
    let maxDrawdown = 0;
    let peak = 0;
    let runningPL = 0;

    trades.forEach(trade => {
      runningPL += trade.pnl;

      if (runningPL > peak) {
        peak = runningPL;
      }

      const drawdown = peak > 0
        ? ((peak - runningPL) / peak) * 100
        : 0;

      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    return maxDrawdown;
  }

  /**
   * Get start date based on timeframe
   */
  private getStartDate(timeframe: '7d' | '30d' | '90d' | 'all'): Date | null {
    if (timeframe === 'all') return null;

    const now = new Date();
    const days = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
    }[timeframe];

    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    return startDate;
  }

  /**
   * Extract token symbol from tokenId
   */
  private extractTokenSymbol(tokenId: string): string {
    // If it's an address, shorten it
    if (tokenId.startsWith('0x')) {
      return `${tokenId.slice(0, 6)}...${tokenId.slice(-4)}`;
    }
    return tokenId;
  }

  /**
   * Get empty analytics structure
   */
  private getEmptyAnalytics(): AnalyticsData {
    return {
      profitTimeline: [],
      tradeDistribution: { win: 0, loss: 0, breakeven: 0 },
      topTokens: [],
      performanceMetrics: {
        totalReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
      },
    };
  }
}

// Singleton instance
let analyticsService: AnalyticsService | null = null;

/**
 * Get analytics service instance
 */
export function getAnalyticsService(): AnalyticsService {
  if (!analyticsService) {
    analyticsService = new AnalyticsService();
  }
  return analyticsService;
}

export default AnalyticsService;
