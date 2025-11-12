/**
 * Polymarket Real-Time Data Service
 *
 * Integrates with Polymarket's real-time WebSocket data streaming
 * Based on @polymarket/real-time-data-client
 *
 * Provides live updates for:
 * - Market prices and orderbook
 * - User orders and trades
 * - Trading activity
 * - Crypto/equity prices
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

// Real-time data client types (based on Polymarket documentation)
export interface SubscriptionRequest {
  topic: string;
  type: string;
  filters?: string;
  clob_auth?: {
    key: string;
    secret: string;
    passphrase: string;
  };
}

export interface Message {
  topic: string;
  type: string;
  payload: any;
}

export interface Trade {
  asset_id: string;
  conditionId: string;
  eventSlug: string;
  marketSlug: string;
  outcome: string;
  outcomeIndex: number;
  price: number;
  side: string;
  size: number;
  timestamp: number;
  transactionHash: string;
}

export interface PriceChange {
  a: string; // asset_id
  h: string; // hash
  p: string; // price
  s: string; // side (BUY/SELL)
  si: string; // size
  ba: string; // best_ask
  bb: string; // best_bid
}

export interface AggOrderbook {
  asks: { price: string; size: string }[];
  asset_id: string;
  bids: { price: string; size: string }[];
  hash: string;
  market: string;
  min_order_size: string;
  neg_risk: boolean;
  tick_size: string;
  timestamp: string;
}

export interface LastTradePrice {
  asset_id: string;
  fee_rate_bps: string;
  market: string;
  price: string;
  side: string;
  size: string;
}

export interface ClobOrder {
  asset_id: string;
  created_at: string;
  expiration: string;
  id: string;
  maker_address: string;
  market: string;
  order_type: string;
  original_size: string;
  outcome: string;
  owner: string;
  price: string;
  side: string;
  size_matched: string;
  status: string;
  type: string;
}

export interface ClobTrade {
  asset_id: string;
  fee_rate_bps: string;
  id: string;
  last_update: string;
  maker_address: string;
  maker_orders: any[];
  market: string;
  match_time: string;
  outcome: string;
  owner: string;
  price: string;
  side: string;
  size: string;
  status: string;
  taker_order_id: string;
  transaction_hash: string;
}

export interface CryptoPrice {
  symbol: string;
  timestamp: number;
  value: number;
}

/**
 * Real-Time Data Service using Polymarket WebSocket
 */
export class PolymarketRealtimeService extends EventEmitter {
  private ws: WebSocket | null = null;
  private wsUrl: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 5000;
  private subscriptions: Map<string, SubscriptionRequest> = new Map();
  private connected: boolean = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(wsUrl?: string) {
    super();
    this.wsUrl = wsUrl || 'wss://streaming.polymarket.com/ws/v1';
  }

  /**
   * Connect to Polymarket WebSocket
   */
  connect(): void {
    if (this.ws && this.connected) {
      logger.warn('WebSocket already connected');
      return;
    }

    try {
      logger.info(`Connecting to Polymarket real-time data: ${this.wsUrl}`);

      // Create WebSocket connection
      if (typeof WebSocket !== 'undefined') {
        this.ws = new WebSocket(this.wsUrl);
      } else {
        // For Node.js environment
        const ws = require('ws');
        this.ws = new ws(this.wsUrl);
      }

      this.setupWebSocketHandlers();
    } catch (error) {
      logger.error('Failed to connect to WebSocket:', error);
      this.handleReconnect();
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      logger.info('✅ Connected to Polymarket real-time data');
      this.connected = true;
      this.reconnectAttempts = 0;

      // Resubscribe to all active subscriptions
      this.resubscribeAll();

      // Start heartbeat
      this.startHeartbeat();

      this.emit('connected');
    };

    this.ws.onmessage = (event: any) => {
      try {
        const message: Message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        logger.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onerror = (error: any) => {
      logger.error('WebSocket error:', error);
      this.emit('error', error);
    };

    this.ws.onclose = () => {
      logger.warn('WebSocket connection closed');
      this.connected = false;
      this.stopHeartbeat();
      this.emit('disconnected');
      this.handleReconnect();
    };
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: Message): void {
    const { topic, type, payload } = message;

    // Emit specific events based on topic and type
    const eventName = `${topic}:${type}`;
    this.emit(eventName, payload);

    // Also emit general message event
    this.emit('message', message);

    // Log for debugging (can be removed in production)
    logger.debug(`📨 ${topic}/${type}:`, payload);
  }

  /**
   * Subscribe to a topic
   */
  subscribe(request: SubscriptionRequest): void {
    const key = `${request.topic}:${request.type}`;

    // Store subscription for reconnection
    this.subscriptions.set(key, request);

    if (!this.connected || !this.ws) {
      logger.warn('WebSocket not connected, subscription queued');
      return;
    }

    try {
      const subscribeMessage = {
        action: 'subscribe',
        subscriptions: [request],
      };

      this.ws.send(JSON.stringify(subscribeMessage));
      logger.info(`📡 Subscribed to ${request.topic}/${request.type}`);
    } catch (error) {
      logger.error('Error subscribing:', error);
    }
  }

  /**
   * Unsubscribe from a topic
   */
  unsubscribe(topic: string, type: string): void {
    const key = `${topic}:${type}`;
    this.subscriptions.delete(key);

    if (!this.connected || !this.ws) {
      return;
    }

    try {
      const unsubscribeMessage = {
        action: 'unsubscribe',
        subscriptions: [{ topic, type }],
      };

      this.ws.send(JSON.stringify(unsubscribeMessage));
      logger.info(`📴 Unsubscribed from ${topic}/${type}`);
    } catch (error) {
      logger.error('Error unsubscribing:', error);
    }
  }

  /**
   * Resubscribe to all active subscriptions
   */
  private resubscribeAll(): void {
    if (this.subscriptions.size === 0) return;

    logger.info(`Resubscribing to ${this.subscriptions.size} subscriptions`);

    this.subscriptions.forEach((request) => {
      this.subscribe(request);
    });
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      this.emit('max_reconnects');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    logger.info(`Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.connected) {
        try {
          this.ws.send(JSON.stringify({ action: 'ping' }));
        } catch (error) {
          logger.error('Heartbeat error:', error);
        }
      }
    }, 30000); // 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connected = false;
    logger.info('Disconnected from Polymarket real-time data');
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get active subscriptions count
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  // Convenience methods for common subscriptions

  /**
   * Subscribe to market price changes
   */
  subscribeToMarketPrices(tokenIds: string[]): void {
    this.subscribe({
      topic: 'clob_market',
      type: 'price_change',
      filters: JSON.stringify(tokenIds),
    });
  }

  /**
   * Subscribe to orderbook updates
   */
  subscribeToOrderbook(tokenIds: string[]): void {
    this.subscribe({
      topic: 'clob_market',
      type: 'agg_orderbook',
      filters: JSON.stringify(tokenIds),
    });
  }

  /**
   * Subscribe to last trade prices
   */
  subscribeToLastTrades(tokenIds: string[]): void {
    this.subscribe({
      topic: 'clob_market',
      type: 'last_trade_price',
      filters: JSON.stringify(tokenIds),
    });
  }

  /**
   * Subscribe to user orders (requires authentication)
   */
  subscribeToUserOrders(auth: { key: string; secret: string; passphrase: string }): void {
    this.subscribe({
      topic: 'clob_user',
      type: 'order',
      clob_auth: auth,
    });
  }

  /**
   * Subscribe to user trades (requires authentication)
   */
  subscribeToUserTrades(auth: { key: string; secret: string; passphrase: string }): void {
    this.subscribe({
      topic: 'clob_user',
      type: 'trade',
      clob_auth: auth,
    });
  }

  /**
   * Subscribe to trading activity for a market
   */
  subscribeToTradingActivity(marketSlug: string): void {
    this.subscribe({
      topic: 'activity',
      type: 'trades',
      filters: JSON.stringify({ market_slug: marketSlug }),
    });
  }

  /**
   * Subscribe to crypto price updates
   */
  subscribeToCryptoPrice(symbol: string): void {
    this.subscribe({
      topic: 'crypto_prices',
      type: 'update',
      filters: JSON.stringify({ symbol }),
    });
  }

  /**
   * Subscribe to equity price updates
   */
  subscribeToEquityPrice(symbol: string): void {
    this.subscribe({
      topic: 'equity_prices',
      type: 'update',
      filters: JSON.stringify({ symbol }),
    });
  }
}

// Singleton instance
export const polymarketRealtimeService = new PolymarketRealtimeService();
