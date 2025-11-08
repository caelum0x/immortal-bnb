/**
 * Bot State Management
 * Centralized state controller for the trading bot
 */

import { logger } from './utils/logger';
import { CONFIG } from './config';

export interface BotConfig {
  tokens: string[];
  riskLevel: number;
  maxTradeAmount: number;
  stopLoss: number;
  interval: number;
  network: 'testnet' | 'mainnet';
}

export interface TradeLog {
  id: string;
  timestamp: number;
  token: string;
  tokenSymbol: string;
  action: 'buy' | 'sell';
  amount: number;
  price: number;
  status: 'pending' | 'success' | 'failed';
  txHash?: string;
  error?: string;
  profitLoss?: number;
}

class BotStateManager {
  private running: boolean = false;
  private config: BotConfig | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private tradeLogs: TradeLog[] = [];
  private stats = {
    totalTrades: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    totalPL: 0,
    avgPL: 0,
  };

  /**
   * Start the bot with configuration
   */
  start(config: Partial<BotConfig>): void {
    if (this.running) {
      throw new Error('Bot is already running');
    }

    // Merge with defaults
    this.config = {
      tokens: config.tokens || [],
      riskLevel: config.riskLevel || 5,
      maxTradeAmount: config.maxTradeAmount || parseFloat(CONFIG.MAX_TRADE_AMOUNT_BNB),
      stopLoss: config.stopLoss || parseFloat(CONFIG.STOP_LOSS_PERCENTAGE),
      interval: config.interval || parseInt(CONFIG.BOT_LOOP_INTERVAL_MS),
      network: (config.network || CONFIG.NETWORK) as 'testnet' | 'mainnet',
    };

    this.running = true;
    logger.info('🚀 Bot started with config:', this.config);
  }

  /**
   * Stop the bot
   */
  stop(): void {
    if (!this.running) {
      throw new Error('Bot is not running');
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.running = false;
    logger.info('🛑 Bot stopped');
  }

  /**
   * Get current bot status
   */
  getStatus() {
    return {
      running: this.running,
      watchlist: this.config?.tokens || [],
      riskLevel: this.config?.riskLevel || 5,
      config: {
        maxTradeAmount: this.config?.maxTradeAmount || 1.0,
        stopLoss: this.config?.stopLoss || 10,
        network: this.config?.network || 'testnet',
        interval: this.config?.interval || 300000,
      },
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): BotConfig | null {
    return this.config;
  }

  /**
   * Check if bot is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Add a trade log
   */
  addTradeLog(log: TradeLog): void {
    this.tradeLogs.unshift(log);

    // Update stats
    if (log.status === 'success') {
      this.stats.totalTrades++;
      if (log.profitLoss && log.profitLoss > 0) {
        this.stats.wins++;
        this.stats.totalPL += log.profitLoss;
      } else if (log.profitLoss && log.profitLoss < 0) {
        this.stats.losses++;
        this.stats.totalPL += log.profitLoss;
      }
      this.stats.winRate = this.stats.totalTrades > 0
        ? (this.stats.wins / this.stats.totalTrades) * 100
        : 0;
      this.stats.avgPL = this.stats.totalTrades > 0
        ? this.stats.totalPL / this.stats.totalTrades
        : 0;
    }

    // Keep only last 100 logs
    if (this.tradeLogs.length > 100) {
      this.tradeLogs = this.tradeLogs.slice(0, 100);
    }
  }

  /**
   * Get trade logs
   */
  getTradeLogs(limit: number = 50): TradeLog[] {
    return this.tradeLogs.slice(0, limit);
  }

  /**
   * Get trading statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Set interval ID for cleanup
   */
  setIntervalId(id: NodeJS.Timeout): void {
    this.intervalId = id;
  }

  /**
   * Reset state (for testing)
   */
  reset(): void {
    this.running = false;
    this.config = null;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.tradeLogs = [];
    this.stats = {
      totalTrades: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      totalPL: 0,
      avgPL: 0,
    };
  }
}

// Singleton instance
export const BotState = new BotStateManager();
