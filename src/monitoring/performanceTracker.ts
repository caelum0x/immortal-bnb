/**
 * Performance Tracking System
 * Tracks and analyzes trading performance metrics:
 * - Win rate, profit/loss
 * - Strategy performance
 * - Time-series analysis
 * - Sharpe ratio, drawdown
 * - Trade execution quality
 */

import { logger } from '../utils/logger';

export interface TradeRecord {
  timestamp: number;
  token: string;
  action: 'BUY' | 'SELL';
  amount: number;
  price: number;
  success: boolean;
  confidence: number;
  profitLoss?: number;
  strategy?: string;
}

export interface PerformanceMetrics {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  successRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  avgProfit: number;
  avgLoss: number;
  avgConfidence: number;
  profitFactor: number; // Total profit / Total loss
  sharpeRatio: number;
  maxDrawdown: number;
  winStreak: number;
  lossStreak: number;
  avgTradeTime: number;
}

export interface StrategyPerformance {
  strategyName: string;
  trades: number;
  successRate: number;
  avgReturn: number;
  totalProfit: number;
  lastUsed: number;
}

export interface TimeSeriesMetrics {
  date: string;
  trades: number;
  profit: number;
  successRate: number;
  balance: number;
}

export class PerformanceTracker {
  private trades: TradeRecord[] = [];
  private strategies: Map<string, StrategyPerformance> = new Map();
  private initialBalance: number = 0;
  private currentBalance: number = 0;
  private peakBalance: number = 0;
  private currentStreak: number = 0;
  private lastTradeSuccess: boolean | null = null;

  constructor(initialBalance?: number) {
    this.initialBalance = initialBalance || 0;
    this.currentBalance = initialBalance || 0;
    this.peakBalance = initialBalance || 0;

    logger.info('📊 Performance Tracker initialized');
  }

  /**
   * Record a new trade
   */
  recordTrade(trade: TradeRecord): void {
    this.trades.push(trade);

    // Update balance (estimated)
    if (trade.profitLoss) {
      this.currentBalance += trade.profitLoss;
      if (this.currentBalance > this.peakBalance) {
        this.peakBalance = this.currentBalance;
      }
    }

    // Update streak tracking
    if (this.lastTradeSuccess === null) {
      this.currentStreak = trade.success ? 1 : -1;
    } else if (trade.success === this.lastTradeSuccess) {
      this.currentStreak += trade.success ? 1 : -1;
    } else {
      this.currentStreak = trade.success ? 1 : -1;
    }
    this.lastTradeSuccess = trade.success;

    // Update strategy performance
    if (trade.strategy) {
      this.updateStrategyPerformance(trade);
    }

    logger.debug(
      `   📊 Trade recorded: ${trade.token} ${trade.action} ${trade.success ? '✅' : '❌'}`
    );
  }

  /**
   * Update strategy-specific performance
   */
  private updateStrategyPerformance(trade: TradeRecord): void {
    const strategy = this.strategies.get(trade.strategy!) || {
      strategyName: trade.strategy!,
      trades: 0,
      successRate: 0,
      avgReturn: 0,
      totalProfit: 0,
      lastUsed: Date.now(),
    };

    strategy.trades++;
    strategy.lastUsed = trade.timestamp;

    if (trade.success) {
      const returns = this.trades.filter((t) => t.strategy === trade.strategy && t.success);
      strategy.successRate = (returns.length / strategy.trades) * 100;
    }

    if (trade.profitLoss) {
      strategy.totalProfit += trade.profitLoss;
      strategy.avgReturn = strategy.totalProfit / strategy.trades;
    }

    this.strategies.set(trade.strategy!, strategy);
  }

  /**
   * Get comprehensive performance summary
   */
  getSummary(): PerformanceMetrics {
    const successfulTrades = this.trades.filter((t) => t.success);
    const failedTrades = this.trades.filter((t) => !t.success);

    const profitableTrades = this.trades.filter((t) => t.profitLoss && t.profitLoss > 0);
    const losingTrades = this.trades.filter((t) => t.profitLoss && t.profitLoss < 0);

    const totalProfit = profitableTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0));

    const avgProfit =
      profitableTrades.length > 0 ? totalProfit / profitableTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;

    const avgConfidence =
      this.trades.length > 0
        ? this.trades.reduce((sum, t) => sum + t.confidence, 0) / this.trades.length
        : 0;

    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;

    const sharpeRatio = this.calculateSharpeRatio();
    const maxDrawdown = this.calculateMaxDrawdown();

    // Calculate streaks
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;

    this.trades.forEach((trade) => {
      if (trade.success) {
        currentWinStreak++;
        currentLossStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      } else {
        currentLossStreak++;
        currentWinStreak = 0;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
      }
    });

    // Calculate average trade time (time between trades)
    const lastTrade = this.trades[this.trades.length - 1];
    const firstTrade = this.trades[0];
    const avgTradeTime =
      this.trades.length > 1 && lastTrade && firstTrade
        ? (lastTrade.timestamp - firstTrade.timestamp) /
          (this.trades.length - 1)
        : 0;

    return {
      totalTrades: this.trades.length,
      successfulTrades: successfulTrades.length,
      failedTrades: failedTrades.length,
      successRate: this.trades.length > 0 ? (successfulTrades.length / this.trades.length) : 0,
      totalProfit,
      totalLoss,
      netProfit: totalProfit - totalLoss,
      avgProfit,
      avgLoss,
      avgConfidence,
      profitFactor,
      sharpeRatio,
      maxDrawdown,
      winStreak: maxWinStreak,
      lossStreak: maxLossStreak,
      avgTradeTime,
    };
  }

  /**
   * Calculate Sharpe Ratio
   * Risk-adjusted return measure
   */
  private calculateSharpeRatio(): number {
    if (this.trades.length < 2) return 0;

    const returns = this.trades
      .filter((t) => t.profitLoss !== undefined)
      .map((t) => t.profitLoss!);

    if (returns.length < 2) return 0;

    // Calculate mean return
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;

    // Calculate standard deviation
    const squaredDiffs = returns.map((r) => Math.pow(r - meanReturn, 2));
    const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    // Sharpe ratio = mean return / std dev
    // Annualized: multiply by sqrt(trading periods per year)
    const sharpeRatio = meanReturn / stdDev;

    return sharpeRatio;
  }

  /**
   * Calculate maximum drawdown
   * Largest peak-to-trough decline
   */
  private calculateMaxDrawdown(): number {
    if (this.peakBalance === 0) return 0;

    const drawdown = ((this.peakBalance - this.currentBalance) / this.peakBalance) * 100;
    return Math.max(0, drawdown);
  }

  /**
   * Get strategy-specific performance
   */
  getStrategyPerformance(): StrategyPerformance[] {
    return Array.from(this.strategies.values()).sort(
      (a, b) => b.successRate - a.successRate
    );
  }

  /**
   * Get time-series data for charting
   */
  getTimeSeriesData(intervalHours: number = 24): TimeSeriesMetrics[] {
    const series: Map<string, TimeSeriesMetrics> = new Map();

    let runningBalance = this.initialBalance;

    this.trades.forEach((trade) => {
      const date = new Date(trade.timestamp);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!dateKey) return;

      const existing = series.get(dateKey) || {
        date: dateKey,
        trades: 0,
        profit: 0,
        successRate: 0,
        balance: runningBalance,
      };

      existing.trades++;
      if (trade.profitLoss) {
        existing.profit += trade.profitLoss;
        runningBalance += trade.profitLoss;
      }
      existing.balance = runningBalance;

      series.set(dateKey, existing);
    });

    // Calculate success rates
    series.forEach((metrics, date) => {
      const dayTrades = this.trades.filter((t) => {
        const tradeDate = new Date(t.timestamp).toISOString().split('T')[0];
        return tradeDate && tradeDate === date;
      });
      const successful = dayTrades.filter((t) => t.success).length;
      metrics.successRate = dayTrades.length > 0 ? (successful / dayTrades.length) * 100 : 0;
    });

    return Array.from(series.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get recent trades
   */
  getRecentTrades(limit: number = 20): TradeRecord[] {
    return this.trades.slice(-limit).reverse();
  }

  /**
   * Get performance by time period
   */
  getPerformanceByPeriod(days: number): PerformanceMetrics {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const recentTrades = this.trades.filter((t) => t.timestamp >= cutoff);

    // Create temporary tracker for period
    const tempTracker = new PerformanceTracker(this.initialBalance);
    recentTrades.forEach((trade) => tempTracker.recordTrade(trade));

    return tempTracker.getSummary();
  }

  /**
   * Get best performing tokens
   */
  getBestTokens(limit: number = 10): Array<{
    token: string;
    trades: number;
    successRate: number;
    totalProfit: number;
  }> {
    const tokenStats = new Map<
      string,
      { token: string; trades: number; successful: number; totalProfit: number }
    >();

    this.trades.forEach((trade) => {
      const existing = tokenStats.get(trade.token) || {
        token: trade.token,
        trades: 0,
        successful: 0,
        totalProfit: 0,
      };

      existing.trades++;
      if (trade.success) existing.successful++;
      if (trade.profitLoss) existing.totalProfit += trade.profitLoss;

      tokenStats.set(trade.token, existing);
    });

    return Array.from(tokenStats.values())
      .map((stats) => ({
        token: stats.token,
        trades: stats.trades,
        successRate: (stats.successful / stats.trades) * 100,
        totalProfit: stats.totalProfit,
      }))
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, limit);
  }

  /**
   * Export performance data to JSON
   */
  exportData(): {
    summary: PerformanceMetrics;
    trades: TradeRecord[];
    strategies: StrategyPerformance[];
    timeSeries: TimeSeriesMetrics[];
  } {
    return {
      summary: this.getSummary(),
      trades: this.trades,
      strategies: this.getStrategyPerformance(),
      timeSeries: this.getTimeSeriesData(),
    };
  }

  /**
   * Reset tracker (for testing)
   */
  reset(): void {
    this.trades = [];
    this.strategies.clear();
    this.currentBalance = this.initialBalance;
    this.peakBalance = this.initialBalance;
    this.currentStreak = 0;
    this.lastTradeSuccess = null;

    logger.info('📊 Performance Tracker reset');
  }
}
