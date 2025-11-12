/**
 * Polymarket Real-Time Data Service
 * Integrates polymarket-realtime submodule with the application
 * Provides real-time market data, trades, orders, and price feeds
 */

import { RealTimeDataClient, Message, ConnectionStatus } from '../../polymarket-realtime/src';
import { logger } from '../utils/logger';
import { getWebSocketService } from '../services/websocket';

export interface RealTimeServiceConfig {
    host?: string;
    autoConnect?: boolean;
    autoReconnect?: boolean;
    defaultSubscriptions?: Array<{
        topic: string;
        type: string;
        filters?: string;
    }>;
}

export class PolymarketRealTimeService {
    private client: RealTimeDataClient;
    private config: RealTimeServiceConfig;
    private isInitialized: boolean = false;

    constructor(config?: RealTimeServiceConfig) {
        this.config = {
            host: config?.host || process.env.POLYMARKET_WS_URL || 'wss://ws-subscriptions-clob.polymarket.com',
            autoConnect: config?.autoConnect !== false,
            autoReconnect: config?.autoReconnect !== false,
            defaultSubscriptions: config?.defaultSubscriptions || [
                { topic: 'activity', type: 'trades' },
                { topic: 'crypto_prices', type: 'update', filters: '{"symbol":"BTCUSDT"}' },
                { topic: 'equity_prices', type: 'update', filters: '{"symbol":"TSLA"}' },
            ],
        };

        logger.info('📡 Initializing Polymarket Real-Time Service');
        logger.info(`   - Host: ${this.config.host}`);
        logger.info(`   - Auto-reconnect: ${this.config.autoReconnect}`);

        // Initialize client with callbacks
        this.client = new RealTimeDataClient({
            host: this.config.host,
            autoReconnect: this.config.autoReconnect,
            onConnect: this.handleConnect.bind(this),
            onMessage: this.handleMessage.bind(this),
            onStatusChange: this.handleStatusChange.bind(this),
        });

        if (this.config.autoConnect) {
            this.connect();
        }
    }

    /**
     * Handle connection established
     */
    private handleConnect(client: RealTimeDataClient): void {
        this.isInitialized = true;
        logger.info('✅ Connected to Polymarket Real-Time WebSocket');

        // Subscribe to default topics
        if (this.config.defaultSubscriptions && this.config.defaultSubscriptions.length > 0) {
            logger.info(`📡 Subscribing to ${this.config.defaultSubscriptions.length} default topics`);
            client.subscribe({
                subscriptions: this.config.defaultSubscriptions,
            });
        }

        // Broadcast connection event
        const wsService = getWebSocketService();
        if (wsService) {
            wsService.emitBotStatusChange({
                platform: 'polymarket',
                status: 'running',
                message: 'Real-time data feed connected',
            });
        }
    }

    /**
     * Handle incoming messages
     */
    private handleMessage(client: RealTimeDataClient, message: Message): void {
        logger.debug(`📨 Polymarket message: ${message.topic}/${message.type}`);

        // Broadcast to internal WebSocket clients
        this.broadcastToClients(message);

        // Process specific message types
        this.processMessage(message);
    }

    /**
     * Handle connection status changes
     */
    private handleStatusChange(status: ConnectionStatus): void {
        logger.info(`🔄 Polymarket connection status: ${status}`);

        const wsService = getWebSocketService();
        if (wsService) {
            wsService.emitBotStatusChange({
                platform: 'polymarket',
                status: status === ConnectionStatus.CONNECTED ? 'running' : 'stopped',
                message: `Real-time feed ${status.toLowerCase()}`,
            });
        }
    }

    /**
     * Process message based on topic/type
     */
    private processMessage(message: Message): void {
        const wsService = getWebSocketService();
        if (!wsService) return;

        try {
            switch (message.topic) {
                case 'activity':
                    if (message.type === 'trades' || message.type === 'orders_matched') {
                        const trade = message.payload as any;
                        wsService.emitTradeExecuted({
                            platform: 'polymarket',
                            chain: 'polygon',
                            tradeId: trade.transactionHash || `${trade.conditionId}_${message.timestamp}`,
                            market: trade.conditionId,
                            amount: trade.size,
                            price: trade.price,
                            outcome: 'success',
                        });
                    }
                    break;

                case 'crypto_prices':
                case 'crypto_prices_chainlink':
                case 'equity_prices':
                    if (message.type === 'update') {
                        const priceData = message.payload as any;
                        wsService.broadcast({
                            type: 'price-update',
                            token: priceData.symbol,
                            price: priceData.value,
                            change24h: 0,
                            volume24h: 0,
                            timestamp: message.timestamp,
                        });
                    }
                    break;

                case 'clob_market':
                    if (message.type === 'last_trade_price') {
                        const lastTrade = message.payload as any;
                        wsService.broadcast({
                            type: 'price-update',
                            token: lastTrade.asset_id,
                            price: parseFloat(lastTrade.price),
                            change24h: 0,
                            timestamp: message.timestamp,
                        });
                    } else if (message.type === 'price_change') {
                        const priceChange = message.payload as any;
                        wsService.broadcast({
                            type: 'price-update',
                            token: priceChange.m, // market
                            price: parseFloat(priceChange.pc?.[0]?.p || 0),
                            change24h: 0,
                            timestamp: message.timestamp,
                        });
                    }
                    break;

                case 'clob_user':
                    // User-specific order and trade updates
                    wsService.io.emit('polymarket-user-event', {
                        type: message.type,
                        payload: message.payload,
                        timestamp: message.timestamp,
                    });
                    break;
            }
        } catch (error) {
            logger.error('Error processing Polymarket message:', error);
        }
    }

    /**
     * Broadcast message to internal WebSocket clients
     */
    private broadcastToClients(message: Message): void {
        const wsService = getWebSocketService();
        if (!wsService) return;

        // Broadcast raw Polymarket message to all clients
        wsService.io.emit('polymarket-event', {
            topic: message.topic,
            type: message.type,
            payload: message.payload,
            timestamp: message.timestamp,
            connection_id: message.connection_id,
        });
    }

    /**
     * Connect to Polymarket WebSocket
     */
    connect(): void {
        if (this.isInitialized) {
            logger.warn('Already connected to Polymarket WebSocket');
            return;
        }

        logger.info('🔌 Connecting to Polymarket WebSocket...');
        this.client.connect();
    }

    /**
     * Disconnect from Polymarket WebSocket
     */
    disconnect(): void {
        logger.info('🔌 Disconnecting from Polymarket WebSocket...');
        this.client.disconnect();
        this.isInitialized = false;
    }

    /**
     * Subscribe to topics
     */
    subscribe(subscriptions: Array<{ topic: string; type: string; filters?: string; clob_auth?: any }>): void {
        logger.info(`📡 Subscribing to ${subscriptions.length} topics:`, subscriptions.map(s => `${s.topic}/${s.type}`).join(', '));
        this.client.subscribe({ subscriptions });
    }

    /**
     * Unsubscribe from topics
     */
    unsubscribe(subscriptions: Array<{ topic: string; type: string; filters?: string }>): void {
        logger.info(`🔇 Unsubscribing from ${subscriptions.length} topics:`, subscriptions.map(s => `${s.topic}/${s.type}`).join(', '));
        this.client.unsubscribe({ subscriptions });
    }

    /**
     * Get connection status
     */
    isConnected(): boolean {
        return this.isInitialized;
    }

    /**
     * Get client instance for advanced operations
     */
    getClient(): RealTimeDataClient {
        return this.client;
    }
}

// Singleton instance
let realTimeServiceInstance: PolymarketRealTimeService | null = null;

export function getPolymarketRealTimeService(config?: RealTimeServiceConfig): PolymarketRealTimeService {
    if (!realTimeServiceInstance) {
        realTimeServiceInstance = new PolymarketRealTimeService(config);
    }
    return realTimeServiceInstance;
}

export function resetPolymarketRealTimeService(): void {
    if (realTimeServiceInstance) {
        realTimeServiceInstance.disconnect();
        realTimeServiceInstance = null;
    }
}
