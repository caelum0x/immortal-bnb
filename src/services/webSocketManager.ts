/**
 * WebSocket Manager
 * Real-time notifications for trades, opportunities, and Telegram messages
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';

export interface NotificationPayload {
  type: 'trade' | 'opportunity' | 'telegram' | 'ai-decision' | 'crosschain' | 'error';
  title: string;
  message: string;
  data?: any;
  timestamp: number;
  priority?: 'low' | 'medium' | 'high';
}

export interface TelegramNotification extends NotificationPayload {
  type: 'telegram';
  data: {
    messageId: string;
    status: 'sent' | 'failed';
    chatId: string;
  };
}

export interface TradeNotification extends NotificationPayload {
  type: 'trade';
  data: {
    tradeId: string;
    action: 'BUY' | 'SELL';
    token: string;
    amount: number;
    price: number;
    profitLoss?: number;
  };
}

export interface OpportunityNotification extends NotificationPayload {
  type: 'opportunity';
  data: {
    opportunityId: string;
    source: 'dex' | 'polymarket' | 'crosschain';
    profitPercent: number;
    confidence: number;
  };
}

/**
 * WebSocket Manager for Real-Time Notifications
 */
export class WebSocketManager extends EventEmitter {
  private io: SocketIOServer | null = null;
  private connectedClients: Map<string, Socket> = new Map();
  private notificationHistory: NotificationPayload[] = [];
  private readonly MAX_HISTORY = 100;

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      },
      path: '/ws',
    });

    this.io.on('connection', (socket: Socket) => {
      const clientId = socket.id;
      this.connectedClients.set(clientId, socket);

      logger.info(`🔌 WebSocket client connected: ${clientId} (Total: ${this.connectedClients.size})`);

      // Send recent notifications to new client
      socket.emit('history', this.notificationHistory.slice(-20));

      // Handle disconnection
      socket.on('disconnect', () => {
        this.connectedClients.delete(clientId);
        logger.info(`🔌 WebSocket client disconnected: ${clientId} (Total: ${this.connectedClients.size})`);
      });

      // Handle client acknowledgments
      socket.on('notification-ack', (notificationId: string) => {
        logger.debug(`✅ Client acknowledged notification: ${notificationId}`);
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });
    });

    logger.info('✅ WebSocket server initialized');
  }

  /**
   * Send notification to all connected clients
   */
  sendNotification(notification: NotificationPayload): void {
    if (!this.io) {
      logger.warn('WebSocket server not initialized');
      return;
    }

    // Add timestamp if not present
    if (!notification.timestamp) {
      notification.timestamp = Date.now();
    }

    // Add to history
    this.notificationHistory.push(notification);
    if (this.notificationHistory.length > this.MAX_HISTORY) {
      this.notificationHistory.shift();
    }

    // Broadcast to all clients
    this.io.emit('notification', notification);

    logger.info(
      `📡 Notification sent: ${notification.type} - ${notification.title} (${this.connectedClients.size} clients)`
    );

    // Emit event for other services
    this.emit('notification-sent', notification);
  }

  /**
   * Send trade notification
   */
  sendTradeNotification(trade: {
    tradeId: string;
    action: 'BUY' | 'SELL';
    token: string;
    amount: number;
    price: number;
    profitLoss?: number;
  }): void {
    const notification: TradeNotification = {
      type: 'trade',
      title: `Trade Executed: ${trade.action} ${trade.token}`,
      message: `${trade.action} ${trade.amount.toFixed(4)} ${trade.token} @ $${trade.price.toFixed(4)}`,
      data: trade,
      timestamp: Date.now(),
      priority: 'high',
    };

    this.sendNotification(notification);
  }

  /**
   * Send opportunity notification
   */
  sendOpportunityNotification(opportunity: {
    opportunityId: string;
    source: 'dex' | 'polymarket' | 'crosschain';
    description: string;
    profitPercent: number;
    confidence: number;
  }): void {
    const notification: OpportunityNotification = {
      type: 'opportunity',
      title: `New Opportunity: ${opportunity.source}`,
      message: `${opportunity.description} - ${opportunity.profitPercent.toFixed(2)}% profit`,
      data: opportunity,
      timestamp: Date.now(),
      priority: opportunity.profitPercent > 5 ? 'high' : 'medium',
    };

    this.sendNotification(notification);
  }

  /**
   * Send Telegram notification
   */
  sendTelegramNotification(telegram: {
    messageId: string;
    message: string;
    status: 'sent' | 'failed';
    chatId: string;
  }): void {
    const notification: TelegramNotification = {
      type: 'telegram',
      title: telegram.status === 'sent' ? 'Telegram Message Sent' : 'Telegram Message Failed',
      message: telegram.message,
      data: telegram,
      timestamp: Date.now(),
      priority: telegram.status === 'failed' ? 'high' : 'low',
    };

    this.sendNotification(notification);
  }

  /**
   * Send AI decision notification
   */
  sendAIDecisionNotification(decision: {
    token: string;
    action: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    reasoning: string;
  }): void {
    const notification: NotificationPayload = {
      type: 'ai-decision',
      title: `AI Decision: ${decision.action} ${decision.token}`,
      message: `${decision.reasoning} (${(decision.confidence * 100).toFixed(1)}% confident)`,
      data: decision,
      timestamp: Date.now(),
      priority: decision.action === 'HOLD' ? 'low' : 'medium',
    };

    this.sendNotification(notification);
  }

  /**
   * Send cross-chain notification
   */
  sendCrossChainNotification(arbitrage: {
    tokenSymbol: string;
    sourceChain: string;
    targetChain: string;
    profitPercent: number;
    netProfit: number;
  }): void {
    const notification: NotificationPayload = {
      type: 'crosschain',
      title: `Cross-Chain Arbitrage: ${arbitrage.tokenSymbol}`,
      message: `${arbitrage.sourceChain} → ${arbitrage.targetChain}: +${arbitrage.profitPercent.toFixed(2)}% ($${arbitrage.netProfit.toFixed(2)})`,
      data: arbitrage,
      timestamp: Date.now(),
      priority: arbitrage.profitPercent > 2 ? 'high' : 'medium',
    };

    this.sendNotification(notification);
  }

  /**
   * Send error notification
   */
  sendErrorNotification(error: {
    title: string;
    message: string;
    code?: string;
    details?: any;
  }): void {
    const notification: NotificationPayload = {
      type: 'error',
      title: error.title,
      message: error.message,
      data: {
        code: error.code,
        details: error.details,
      },
      timestamp: Date.now(),
      priority: 'high',
    };

    this.sendNotification(notification);
  }

  /**
   * Send notification to specific client
   */
  sendToClient(clientId: string, notification: NotificationPayload): void {
    const socket = this.connectedClients.get(clientId);
    if (socket) {
      socket.emit('notification', notification);
      logger.info(`📡 Notification sent to client ${clientId}: ${notification.type}`);
    } else {
      logger.warn(`Client ${clientId} not found`);
    }
  }

  /**
   * Broadcast custom event to all clients
   */
  broadcast(event: string, data: any): void {
    if (!this.io) {
      logger.warn('WebSocket server not initialized');
      return;
    }

    this.io.emit(event, data);
    logger.info(`📡 Broadcast event: ${event} (${this.connectedClients.size} clients)`);
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get notification history
   */
  getNotificationHistory(limit: number = 50): NotificationPayload[] {
    return this.notificationHistory.slice(-limit);
  }

  /**
   * Clear notification history
   */
  clearHistory(): void {
    this.notificationHistory = [];
    logger.info('🗑️ Notification history cleared');
  }

  /**
   * Shutdown WebSocket server
   */
  shutdown(): void {
    if (this.io) {
      this.io.close();
      this.connectedClients.clear();
      logger.info('🛑 WebSocket server shut down');
    }
  }
}

// Singleton instance
export const webSocketManager = new WebSocketManager();

export default webSocketManager;
