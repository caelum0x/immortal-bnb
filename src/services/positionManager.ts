/**
 * Position Manager Service
 * Tracks open trading positions, monitors P&L, and executes stop-loss
 * Implements position management requirements from PRD
 */

import { logger } from '../utils/logger';
import { CONFIG } from '../config';
import { getTokenPrice } from '../data/marketFetcher';
import { executeTrade, getWalletBalance } from '../blockchain/tradeExecutor';
import { ethers } from 'ethers';

export interface Position {
  id: string;
  token: string; // token address
  symbol: string;
  entryPrice: number;
  currentPrice?: number;
  amount: number; // amount in BNB
  strategy: string;
  confidence: number;
  timestamp: number;
  txHash?: string;
  status: 'open' | 'closed' | 'stop-loss';
  exitPrice?: number;
  exitTimestamp?: number;
  exitTxHash?: string;
  profitLoss?: number; // percentage
  profitLossAmount?: number; // in BNB
}

export interface PerformanceStats {
  totalTrades: number;
  openPositions: number;
  closedPositions: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPL: number; // percentage
  totalPLAmount: number; // in BNB
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  currentDrawdown: number;
}

export class PositionManager {
  private positions: Map<string, Position> = new Map();
  private closedPositions: Position[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;

  constructor() {
    logger.info('📊 Position Manager initialized');
  }

  /**
   * Start monitoring positions for price updates and stop-loss
   */
  async startMonitoring(intervalMs: number = 60000): Promise<void> {
    if (this.isMonitoring) {
      logger.warn('Position monitoring already active');
      return;
    }

    logger.info('👀 Starting position monitoring...');
    this.isMonitoring = true;

    // Monitor positions every minute
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.updateAllPositions();
      } catch (error) {
        logger.error('Position monitoring error:', error);
      }
    }, intervalMs);

    logger.info('✅ Position monitoring active');
  }

  /**
   * Stop monitoring positions
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      logger.warn('Position monitoring not active');
      return;
    }

    logger.info('⏸️  Stopping position monitoring...');

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isMonitoring = false;
    logger.info('✅ Position monitoring stopped');
  }

  /**
   * Add a new position
   */
  async addPosition(position: Omit<Position, 'currentPrice' | 'exitPrice' | 'exitTimestamp' | 'exitTxHash' | 'profitLoss' | 'profitLossAmount'>): Promise<void> {
    const newPosition: Position = {
      ...position,
      currentPrice: position.entryPrice,
      status: 'open',
    };

    this.positions.set(position.id, newPosition);
    
    logger.info(`✅ Position added: ${position.symbol} (ID: ${position.id})`);
    logger.info(`   Entry: $${position.entryPrice.toFixed(6)}, Amount: ${position.amount.toFixed(4)} BNB`);
  }

  /**
   * Update all positions with current prices
   */
  async updateAllPositions(): Promise<void> {
    if (this.positions.size === 0) {
      return;
    }

    logger.debug(`📈 Updating ${this.positions.size} positions...`);

    for (const [id, position] of this.positions) {
      try {
        await this.updatePosition(id);
      } catch (error) {
        logger.error(`Error updating position ${id}:`, error);
      }
    }
  }

  /**
   * Update a specific position with current price
   */
  async updatePosition(positionId: string): Promise<void> {
    const position = this.positions.get(positionId);
    if (!position) {
      logger.warn(`Position not found: ${positionId}`);
      return;
    }

    try {
      // Get current token price
      const currentPrice = await getTokenPrice(position.token);
      
      // Calculate P&L
      const profitLoss = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
      const profitLossAmount = (profitLoss / 100) * position.amount;

      // Update position
      position.currentPrice = currentPrice;
      position.profitLoss = profitLoss;
      position.profitLossAmount = profitLossAmount;

      this.positions.set(positionId, position);

      logger.debug(
        `Position ${position.symbol}: ` +
        `$${currentPrice.toFixed(6)} (${profitLoss > 0 ? '+' : ''}${profitLoss.toFixed(2)}%)`
      );

    } catch (error) {
      logger.error(`Failed to update position ${positionId}:`, error);
    }
  }

  /**
   * Check stop-loss for all positions
   */
  async checkAllStopLoss(): Promise<void> {
    const positions = Array.from(this.positions.values());
    
    for (const position of positions) {
      try {
        const shouldStopLoss = await this.checkStopLoss(position);
        if (shouldStopLoss) {
          await this.executeStopLoss(position);
        }
      } catch (error) {
        logger.error(`Stop-loss check error for ${position.symbol}:`, error);
      }
    }
  }

  /**
   * Check if a position should trigger stop-loss
   */
  async checkStopLoss(position: Position): Promise<boolean> {
    if (position.status !== 'open') {
      return false;
    }

    // Update position price
    await this.updatePosition(position.id);

    const updatedPosition = this.positions.get(position.id);
    if (!updatedPosition || !updatedPosition.profitLoss) {
      return false;
    }

    const stopLossThreshold = -(CONFIG.STOP_LOSS_PERCENTAGE || 10);

    // Check if loss exceeds threshold
    if (updatedPosition.profitLoss <= stopLossThreshold) {
      logger.warn(
        `⚠️  STOP-LOSS TRIGGERED: ${position.symbol} ` +
        `(${updatedPosition.profitLoss.toFixed(2)}% loss)`
      );
      return true;
    }

    return false;
  }

  /**
   * Execute stop-loss for a position
   */
  private async executeStopLoss(position: Position): Promise<void> {
    logger.info(`🛑 Executing stop-loss for ${position.symbol}...`);

    try {
      // Execute sell trade
      const WBNB_ADDRESS = CONFIG.TRADING_NETWORK === 'opbnb' 
        ? '0x4200000000000000000000000000000000000006'
        : '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';

      const trade = await executeTrade({
        tokenIn: position.token,
        tokenOut: WBNB_ADDRESS,
        amountIn: ethers.parseEther(position.amount.toString()),
        slippage: CONFIG.MAX_SLIPPAGE_PERCENTAGE || 2,
      } as any);

      // Update position
      position.status = 'stop-loss';
      position.exitPrice = position.currentPrice;
      position.exitTimestamp = Date.now();
      position.exitTxHash = (trade as any).hash;

      // Move to closed positions
      this.closedPositions.push(position);
      this.positions.delete(position.id);

      logger.info(
        `✅ Stop-loss executed: ${position.symbol} ` +
        `(${position.profitLoss?.toFixed(2)}% loss)`
      );

    } catch (error) {
      logger.error(`Failed to execute stop-loss for ${position.symbol}:`, error);
      throw error;
    }
  }

  /**
   * Manually close a position
   */
  async closePosition(
    positionId: string,
    exitPrice?: number,
    txHash?: string
  ): Promise<void> {
    const position = this.positions.get(positionId);
    if (!position) {
      throw new Error(`Position not found: ${positionId}`);
    }

    // Update position with exit data
    position.status = 'closed';
    position.exitPrice = exitPrice || position.currentPrice || position.entryPrice;
    position.exitTimestamp = Date.now();
    position.exitTxHash = txHash;

    // Recalculate P&L with exit price
    position.profitLoss = ((position.exitPrice - position.entryPrice) / position.entryPrice) * 100;
    position.profitLossAmount = (position.profitLoss / 100) * position.amount;

    // Move to closed positions
    this.closedPositions.push(position);
    this.positions.delete(positionId);

    logger.info(
      `📕 Position closed: ${position.symbol} ` +
      `(${position.profitLoss > 0 ? '+' : ''}${position.profitLoss.toFixed(2)}%)`
    );
  }

  /**
   * Get all active positions
   */
  async getActivePositions(): Promise<Position[]> {
    return Array.from(this.positions.values());
  }

  /**
   * Get closed positions
   */
  async getClosedPositions(limit: number = 50): Promise<Position[]> {
    return this.closedPositions.slice(0, limit);
  }

  /**
   * Get a specific position
   */
  async getPosition(positionId: string): Promise<Position | undefined> {
    return this.positions.get(positionId);
  }

  /**
   * Check if we can open a new position (risk management)
   */
  async canOpenPosition(tradeAmount: number): Promise<boolean> {
    const openPositions = this.positions.size;
    const maxPositions = CONFIG.MAX_CONCURRENT_POSITIONS || 5;

    // Check max positions
    if (openPositions >= maxPositions) {
      logger.warn(`Max positions reached (${openPositions}/${maxPositions})`);
      return false;
    }

    // Check available balance
    const balance = await getWalletBalance();
    if (tradeAmount > balance * 0.1) {
      logger.warn(`Trade amount too large (${tradeAmount} > 10% of ${balance.toFixed(4)} BNB)`);
      return false;
    }

    // Check total exposure
    const totalExposure = Array.from(this.positions.values())
      .reduce((sum, pos) => sum + pos.amount, 0);
    
    if (totalExposure + tradeAmount > balance * 0.5) {
      logger.warn(`Total exposure too high (${(totalExposure + tradeAmount).toFixed(4)} > 50% of balance)`);
      return false;
    }

    return true;
  }

  /**
   * Get performance statistics
   */
  async getPerformanceStats(): Promise<PerformanceStats> {
    const allPositions = [...this.closedPositions];
    
    const wins = allPositions.filter(p => (p.profitLoss || 0) > 0).length;
    const losses = allPositions.filter(p => (p.profitLoss || 0) < 0).length;
    
    const totalPL = allPositions.reduce((sum, p) => sum + (p.profitLoss || 0), 0);
    const totalPLAmount = allPositions.reduce((sum, p) => sum + (p.profitLossAmount || 0), 0);
    
    const winningTrades = allPositions.filter(p => (p.profitLoss || 0) > 0);
    const losingTrades = allPositions.filter(p => (p.profitLoss || 0) < 0);
    
    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, p) => sum + (p.profitLoss || 0), 0) / winningTrades.length
      : 0;
    
    const avgLoss = losingTrades.length > 0
      ? losingTrades.reduce((sum, p) => sum + (p.profitLoss || 0), 0) / losingTrades.length
      : 0;
    
    const largestWin = winningTrades.length > 0
      ? Math.max(...winningTrades.map(p => p.profitLoss || 0))
      : 0;
    
    const largestLoss = losingTrades.length > 0
      ? Math.min(...losingTrades.map(p => p.profitLoss || 0))
      : 0;

    // Calculate current drawdown from open positions
    const currentDrawdown = Array.from(this.positions.values())
      .filter(p => (p.profitLoss || 0) < 0)
      .reduce((sum, p) => sum + (p.profitLoss || 0), 0);

    return {
      totalTrades: allPositions.length,
      openPositions: this.positions.size,
      closedPositions: allPositions.length,
      wins,
      losses,
      winRate: allPositions.length > 0 ? (wins / allPositions.length) * 100 : 0,
      totalPL,
      totalPLAmount,
      avgWin,
      avgLoss,
      largestWin,
      largestLoss,
      currentDrawdown,
    };
  }

  /**
   * Get portfolio value (all positions + available balance)
   */
  async getPortfolioValue(): Promise<{
    totalValue: number;
    availableBalance: number;
    positionValue: number;
    unrealizedPL: number;
  }> {
    const balance = await getWalletBalance();
    
    const positions = Array.from(this.positions.values());
    const positionValue = positions.reduce((sum, p) => sum + p.amount, 0);
    const unrealizedPL = positions.reduce((sum, p) => sum + (p.profitLossAmount || 0), 0);

    return {
      totalValue: balance + positionValue + unrealizedPL,
      availableBalance: balance,
      positionValue,
      unrealizedPL,
    };
  }

  /**
   * Clear all positions (for testing)
   */
  async clearAll(): Promise<void> {
    this.positions.clear();
    this.closedPositions = [];
    logger.info('🗑️  All positions cleared');
  }
}
