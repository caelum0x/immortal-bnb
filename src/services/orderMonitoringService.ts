/**
 * Order Monitoring Service
 *
 * Monitors open orders and executes them when conditions are met:
 * - LIMIT orders: Execute when market price reaches limit price
 * - STOP_LOSS orders: Execute when price drops to stop loss level
 * - TAKE_PROFIT orders: Execute when price rises to take profit level
 * - TRAILING_STOP orders: Execute with dynamic stop loss that follows price
 */

import { PrismaClient, OrderType, OrderStatus, TradeSide } from '../../generated/prisma';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';
import { metricsService } from './metricsService';
import webSocketManager from './webSocketManager';

const prisma = new PrismaClient();

export interface MarketPrice {
  tokenId: string;
  price: number;
  timestamp: Date;
}

export interface OrderExecutionResult {
  orderId: string;
  success: boolean;
  executedPrice?: number;
  executedAmount?: number;
  txHash?: string;
  error?: string;
}

class OrderMonitoringService extends EventEmitter {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private priceCache: Map<string, MarketPrice> = new Map();
  private trailingStopHighs: Map<string, number> = new Map(); // Track highest prices for trailing stops

  /**
   * Start monitoring orders
   */
  start(intervalMs: number = 5000): void {
    if (this.monitoringInterval) {
      logger.warn('⚠️  Order monitoring already running');
      return;
    }

    logger.info('🔍 Starting order monitoring service...');
    logger.info(`  - Check interval: ${intervalMs}ms`);

    this.monitoringInterval = setInterval(async () => {
      await this.checkOrders();
    }, intervalMs);

    // Initial check
    this.checkOrders();
  }

  /**
   * Stop monitoring orders
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('⏸️  Order monitoring stopped');
    }
  }

  /**
   * Update market price for a token
   */
  updatePrice(tokenId: string, price: number): void {
    this.priceCache.set(tokenId, {
      tokenId,
      price,
      timestamp: new Date(),
    });

    // Emit price update event
    this.emit('priceUpdate', { tokenId, price });
  }

  /**
   * Get current market price
   */
  getPrice(tokenId: string): number | null {
    const cached = this.priceCache.get(tokenId);
    if (!cached) return null;

    // Price expires after 30 seconds
    const age = Date.now() - cached.timestamp.getTime();
    if (age > 30000) {
      this.priceCache.delete(tokenId);
      return null;
    }

    return cached.price;
  }

  /**
   * Main monitoring loop - check all open orders
   */
  private async checkOrders(): Promise<void> {
    try {
      // Fetch all open orders
      const openOrders = await prisma.order.findMany({
        where: {
          status: {
            in: [OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED],
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (openOrders.length === 0) return;

      logger.debug(`🔍 Checking ${openOrders.length} open orders...`);

      // Check each order
      for (const order of openOrders) {
        try {
          await this.checkOrder(order);
        } catch (error) {
          logger.error(`Failed to check order ${order.id}:`, error);
        }
      }

    } catch (error) {
      logger.error('Failed to fetch open orders:', error);
    }
  }

  /**
   * Check a single order and execute if conditions are met
   */
  private async checkOrder(order: any): Promise<void> {
    const currentPrice = this.getPrice(order.tokenId);

    if (!currentPrice) {
      // No price data available yet
      return;
    }

    let shouldExecute = false;
    let executionReason = '';

    switch (order.type) {
      case OrderType.LIMIT:
        shouldExecute = this.checkLimitOrder(order, currentPrice);
        executionReason = shouldExecute ? `Limit price ${order.price} reached` : '';
        break;

      case OrderType.STOP_LOSS:
        shouldExecute = this.checkStopLossOrder(order, currentPrice);
        executionReason = shouldExecute ? `Stop loss ${order.stopLoss} triggered` : '';
        break;

      case OrderType.TAKE_PROFIT:
        shouldExecute = this.checkTakeProfitOrder(order, currentPrice);
        executionReason = shouldExecute ? `Take profit ${order.takeProfit} reached` : '';
        break;

      case OrderType.TRAILING_STOP:
        shouldExecute = this.checkTrailingStopOrder(order, currentPrice);
        executionReason = shouldExecute ? `Trailing stop triggered` : '';
        break;

      case OrderType.MARKET:
        // Market orders should execute immediately, not monitored
        logger.warn(`⚠️  Market order ${order.id} should not be in monitoring queue`);
        break;
    }

    if (shouldExecute) {
      logger.info(`✅ Order ${order.id} ready to execute: ${executionReason}`);
      await this.executeOrder(order, currentPrice, executionReason);
    }
  }

  /**
   * Check LIMIT order conditions
   * BUY: Execute when price drops to or below limit price
   * SELL: Execute when price rises to or above limit price
   */
  private checkLimitOrder(order: any, currentPrice: number): boolean {
    if (!order.price) return false;

    if (order.side === TradeSide.BUY) {
      return currentPrice <= order.price;
    } else {
      return currentPrice >= order.price;
    }
  }

  /**
   * Check STOP_LOSS order conditions
   * BUY: Execute when price rises to stop loss (stop loss on short)
   * SELL: Execute when price drops to stop loss (stop loss on long)
   */
  private checkStopLossOrder(order: any, currentPrice: number): boolean {
    if (!order.stopLoss) return false;

    if (order.side === TradeSide.BUY) {
      return currentPrice >= order.stopLoss;
    } else {
      return currentPrice <= order.stopLoss;
    }
  }

  /**
   * Check TAKE_PROFIT order conditions
   * BUY: Execute when price drops to take profit (taking profit on short)
   * SELL: Execute when price rises to take profit (taking profit on long)
   */
  private checkTakeProfitOrder(order: any, currentPrice: number): boolean {
    if (!order.takeProfit) return false;

    if (order.side === TradeSide.BUY) {
      return currentPrice <= order.takeProfit;
    } else {
      return currentPrice >= order.takeProfit;
    }
  }

  /**
   * Check TRAILING_STOP order conditions
   * Tracks the highest price (for long) or lowest price (for short)
   * and executes when price moves against position by trailing amount
   */
  private checkTrailingStopOrder(order: any, currentPrice: number): boolean {
    if (!order.trailingStop) return false;

    const orderId = order.id;
    const trailingPercent = order.trailingStop;

    if (order.side === TradeSide.SELL) {
      // Trailing stop for SELL (long position)
      // Track highest price and trigger if price drops by trailing %
      const currentHigh = this.trailingStopHighs.get(orderId) || order.price || currentPrice;

      if (currentPrice > currentHigh) {
        this.trailingStopHighs.set(orderId, currentPrice);
        return false;
      }

      const dropPercent = ((currentHigh - currentPrice) / currentHigh) * 100;
      return dropPercent >= trailingPercent;

    } else {
      // Trailing stop for BUY (short position)
      // Track lowest price and trigger if price rises by trailing %
      const currentLow = this.trailingStopHighs.get(orderId) || order.price || currentPrice;

      if (currentPrice < currentLow) {
        this.trailingStopHighs.set(orderId, currentPrice);
        return false;
      }

      const risePercent = ((currentPrice - currentLow) / currentLow) * 100;
      return risePercent >= trailingPercent;
    }
  }

  /**
   * Execute an order that has met its conditions
   */
  private async executeOrder(order: any, executionPrice: number, reason: string): Promise<void> {
    try {
      logger.info(`🚀 Executing order ${order.id}`);
      logger.info(`  - Type: ${order.type}`);
      logger.info(`  - Side: ${order.side}`);
      logger.info(`  - Amount: ${order.remainingAmount}`);
      logger.info(`  - Price: ${executionPrice}`);
      logger.info(`  - Reason: ${reason}`);

      // TODO: Integrate with actual trade execution service
      // For now, we'll just update the database

      const executedAmount = order.remainingAmount;
      const filledAmount = order.filledAmount + executedAmount;

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.FILLED,
          filledAmount: filledAmount,
          remainingAmount: 0,
          executedAt: new Date(),
        },
      });

      // Create corresponding trade record
      await prisma.trade.create({
        data: {
          userId: order.userId,
          marketId: order.marketId,
          marketQuestion: order.marketQuestion,
          tokenId: order.tokenId,
          outcome: order.outcome,
          side: order.side,
          type: order.type === OrderType.MARKET ? 'MARKET' : 'LIMIT',
          amount: executedAmount,
          price: executionPrice,
          filledAmount: executedAmount,
          avgFillPrice: executionPrice,
          fee: executedAmount * executionPrice * 0.002, // 0.2% fee
          status: 'SETTLED',
          executedAt: new Date(),
        },
      });

      // Clean up trailing stop tracking
      this.trailingStopHighs.delete(order.id);

      // Emit order executed event
      this.emit('orderExecuted', {
        orderId: order.id,
        userId: order.userId,
        type: order.type,
        side: order.side,
        amount: executedAmount,
        price: executionPrice,
        reason,
      });

      // Track metrics
      metricsService.trackOrderExecution(order.type, order.side);

      // Send WebSocket notification
      webSocketManager.sendOrderExecutedNotification({
        orderId: order.id,
        userId: order.userId,
        type: order.type,
        side: order.side,
        amount: executedAmount,
        price: executionPrice,
        reason,
      });

      logger.info(`✅ Order ${order.id} executed successfully`);

    } catch (error) {
      logger.error(`❌ Failed to execute order ${order.id}:`, error);

      this.emit('orderExecutionFailed', {
        orderId: order.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Manually cancel an order
   */
  async cancelOrder(orderId: string, userId: string): Promise<boolean> {
    try {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId: userId,
          status: {
            in: [OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED],
          },
        },
      });

      if (!order) {
        throw new Error('Order not found or cannot be cancelled');
      }

      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });

      // Clean up trailing stop tracking
      this.trailingStopHighs.delete(orderId);

      // Track metrics
      metricsService.trackOrderCancellation(order.type);

      logger.info(`❌ Order ${orderId} cancelled by user ${userId}`);

      this.emit('orderCancelled', {
        orderId,
        userId,
      });

      return true;

    } catch (error) {
      logger.error(`Failed to cancel order ${orderId}:`, error);
      return false;
    }
  }

  /**
   * Get order statistics
   */
  async getOrderStats(userId?: string): Promise<any> {
    const where = userId ? { userId } : {};

    const [totalOrders, openOrders, filledOrders, cancelledOrders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.count({ where: { ...where, status: OrderStatus.OPEN } }),
      prisma.order.count({ where: { ...where, status: OrderStatus.FILLED } }),
      prisma.order.count({ where: { ...where, status: OrderStatus.CANCELLED } }),
    ]);

    return {
      total: totalOrders,
      open: openOrders,
      filled: filledOrders,
      cancelled: cancelledOrders,
    };
  }
}

// Singleton instance
let orderMonitoringService: OrderMonitoringService | null = null;

/**
 * Get order monitoring service instance
 */
export function getOrderMonitoringService(): OrderMonitoringService {
  if (!orderMonitoringService) {
    orderMonitoringService = new OrderMonitoringService();
  }
  return orderMonitoringService;
}

/**
 * Initialize and start order monitoring
 */
export function initializeOrderMonitoring(intervalMs?: number): OrderMonitoringService {
  const service = getOrderMonitoringService();
  service.start(intervalMs);
  return service;
}

export default OrderMonitoringService;
