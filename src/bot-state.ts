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

export interface Position {
  id: string;
  tokenSymbol: string;
  tokenAddress: string;
  entryPrice: number;
  currentPrice: number;
  amount: number;
  value: number;
  pnl: number;
  pnlPercent: number;
  entryTime: number;
  status: 'active' | 'pending' | 'closed';
}

class BotStateManager {
  private running: boolean = false;
  private config: BotConfig | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private tradeLogs: TradeLog[] = [];
  private positions: Position[] = [];
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
      maxTradeAmount: config.maxTradeAmount || CONFIG.MAX_TRADE_AMOUNT_BNB,
      stopLoss: config.stopLoss || CONFIG.STOP_LOSS_PERCENTAGE,
      interval: config.interval || CONFIG.BOT_LOOP_INTERVAL_MS,
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
   * Get active positions
   */
  getPositions(): Position[] {
    return [...this.positions];
  }

  /**
   * Add a new position
   */
  addPosition(position: Position): void {
    this.positions.push(position);
    logger.info(`📊 Position added: ${position.tokenSymbol} (${position.amount})`);
  }

  /**
   * Update position with current price
   */
  updatePosition(id: string, currentPrice: number): void {
    const position = this.positions.find(p => p.id === id);
    if (position) {
      position.currentPrice = currentPrice;
      position.value = position.amount * currentPrice;
      position.pnl = position.value - (position.amount * position.entryPrice);
      position.pnlPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
    }
  }

  /**
   * Close a position
   */
  async closePosition(id: string): Promise<{ success: boolean; error?: string; trade?: any }> {
    try {
      const positionIndex = this.positions.findIndex(p => p.id === id);

      if (positionIndex === -1) {
        return {
          success: false,
          error: 'Position not found'
        };
      }

      const position = this.positions[positionIndex];
      if (!position) {
        return {
          success: false,
          error: 'Position not found'
        };
      }

      if (position.status === 'closed') {
        return {
          success: false,
          error: 'Position already closed'
        };
      }

      // Mark position as closed
      position.status = 'closed';

      // Create trade log
      const tradeLog: TradeLog = {
        id: `trade-${Date.now()}`,
        timestamp: Date.now(),
        token: position.tokenAddress,
        tokenSymbol: position.tokenSymbol,
        action: 'sell',
        amount: position.amount,
        price: position.currentPrice,
        status: 'success',
        profitLoss: position.pnl,
      };

      this.addTradeLog(tradeLog);

      // Remove from positions array
      this.positions.splice(positionIndex, 1);

      logger.info(`✅ Position closed: ${position.tokenSymbol} | P&L: ${position.pnl.toFixed(4)}`);

      return {
        success: true,
        trade: tradeLog
      };

    } catch (error) {
      logger.error(`Error closing position ${id}:`, error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
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
    this.positions = [];
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
