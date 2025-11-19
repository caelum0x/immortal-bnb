/**
 * Polymarket Real-Time Data Service
 * Complete end-to-end integration with polymarket-realtime submodule
 * Provides real-time market intelligence for trading bot
 */

import { RealTimeDataClient, ConnectionStatus } from '../../polymarket-realtime/src';
import type { Message } from '../../polymarket-realtime/src';
import { logger } from '../utils/logger';
import { getWebSocketService } from '../services/websocket';
import {
    Topics,
    ActivityTypes,
    ClobMarketTypes,
    PriceTypes,
    CryptoSymbols,
    EquitySymbols,
} from './realTimeTypes';
import type {
    Trade,
    CryptoPrice,
    EquityPrice,
    LastTradePrice,
    PriceChanges,
    AggOrderbook,
    Order,
    UserTrade,
} from './realTimeTypes';

export interface RealTimeServiceConfig {
    host?: string;
    autoConnect?: boolean;
    autoReconnect?: boolean;
    enableCryptoPrices?: boolean;
    enableEquityPrices?: boolean;
    enableActivityFeed?: boolean;
    enableClobMarket?: boolean;
    cryptoSymbols?: string[];
    equitySymbols?: string[];
    clobAuth?: {
        key: string;
        secret: string;
        passphrase: string;
    };
}

export interface MarketIntelligence {
    latestTrades: Map<string, Trade>;
    cryptoPrices: Map<string, CryptoPrice>;
    equityPrices: Map<string, EquityPrice>;
    orderbooks: Map<string, AggOrderbook>;
    lastTradePrices: Map<string, LastTradePrice>;
    userOrders: Map<string, Order>;
    userTrades: Map<string, UserTrade>;
}

export class PolymarketRealTimeService {
    private client: RealTimeDataClient;
    private config: RealTimeServiceConfig;
    private isInitialized: boolean = false;
    private marketIntelligence: MarketIntelligence;

    constructor(config?: RealTimeServiceConfig) {
        this.config = {
            host: config?.host || process.env.POLYMARKET_WS_URL || 'wss://ws-subscriptions-clob.polymarket.com',
            autoConnect: config?.autoConnect !== false,
            autoReconnect: config?.autoReconnect !== false,
            enableCryptoPrices: config?.enableCryptoPrices !== false,
            enableEquityPrices: config?.enableEquityPrices !== false,
            enableActivityFeed: config?.enableActivityFeed !== false,
            enableClobMarket: config?.enableClobMarket !== false,
            cryptoSymbols: config?.cryptoSymbols || [
                CryptoSymbols.BTCUSDT,
                CryptoSymbols.ETHUSDT,
                CryptoSymbols.SOLUSDT,
            ],
            equitySymbols: config?.equitySymbols || [
                EquitySymbols.TSLA,
                EquitySymbols.AAPL,
                EquitySymbols.NVDA,
            ],
            clobAuth: config?.clobAuth,
        };

        // Initialize market intelligence storage
        this.marketIntelligence = {
            latestTrades: new Map(),
            cryptoPrices: new Map(),
            equityPrices: new Map(),
            orderbooks: new Map(),
            lastTradePrices: new Map(),
            userOrders: new Map(),
            userTrades: new Map(),
        };

        logger.info('📡 Initializing Polymarket Real-Time Service');
        logger.info(`   - Host: ${this.config.host}`);
        logger.info(`   - Auto-reconnect: ${this.config.autoReconnect}`);
        logger.info(`   - Crypto prices: ${this.config.enableCryptoPrices}`);
        logger.info(`   - Equity prices: ${this.config.enableEquityPrices}`);
        logger.info(`   - Activity feed: ${this.config.enableActivityFeed}`);

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

        // Build default subscriptions
        const subscriptions: any[] = [];

        // Activity feed (trades and orders matched)
        if (this.config.enableActivityFeed) {
            subscriptions.push({
                topic: Topics.ACTIVITY,
                type: ActivityTypes.TRADES,
            });
            subscriptions.push({
                topic: Topics.ACTIVITY,
                type: ActivityTypes.ORDERS_MATCHED,
            });
        }

        // Crypto price feeds
        if (this.config.enableCryptoPrices && this.config.cryptoSymbols) {
            this.config.cryptoSymbols.forEach(symbol => {
                subscriptions.push({
                    topic: Topics.CRYPTO_PRICES,
                    type: PriceTypes.UPDATE,
                    filters: JSON.stringify({ symbol }),
                });
            });
        }

        // Equity price feeds
        if (this.config.enableEquityPrices && this.config.equitySymbols) {
            this.config.equitySymbols.forEach(symbol => {
                subscriptions.push({
                    topic: Topics.EQUITY_PRICES,
                    type: PriceTypes.UPDATE,
                    filters: JSON.stringify({ symbol }),
                });
            });
        }

        // User-specific subscriptions (requires CLOB auth)
        if (this.config.clobAuth) {
            subscriptions.push({
                topic: Topics.CLOB_USER,
                type: '*', // Subscribe to all user events
                clob_auth: this.config.clobAuth,
            });
        }

        // Subscribe to all configured topics
        if (subscriptions.length > 0) {
            logger.info(`📡 Subscribing to ${subscriptions.length} topics`);
            client.subscribe({ subscriptions });
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
        logger.debug(`📨 Polymarket: ${message.topic}/${message.type}`);

        // Store in market intelligence
        this.updateMarketIntelligence(message);

        // Broadcast to internal WebSocket clients
        this.broadcastToClients(message);

        // Process specific message types
        this.processMessage(message);
    }

    /**
     * Handle connection status changes
     */
    private handleStatusChange(status: ConnectionStatus): void {
        logger.info(`🔄 Polymarket connection: ${status}`);

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
     * Update market intelligence storage
     */
    private updateMarketIntelligence(message: Message): void {
        try {
            switch (message.topic) {
                case Topics.ACTIVITY:
                    if (message.type === ActivityTypes.TRADES || message.type === ActivityTypes.ORDERS_MATCHED) {
                        const trade = message.payload as Trade;
                        this.marketIntelligence.latestTrades.set(trade.conditionId, trade);
                    }
                    break;

                case Topics.CRYPTO_PRICES:
                case Topics.CRYPTO_PRICES_CHAINLINK:
                    if (message.type === PriceTypes.UPDATE) {
                        const cryptoPrice = message.payload as CryptoPrice;
                        this.marketIntelligence.cryptoPrices.set(cryptoPrice.symbol, cryptoPrice);
                    }
                    break;

                case Topics.EQUITY_PRICES:
                    if (message.type === PriceTypes.UPDATE) {
                        const equityPrice = message.payload as EquityPrice;
                        this.marketIntelligence.equityPrices.set(equityPrice.symbol, equityPrice);
                    }
                    break;

                case Topics.CLOB_MARKET:
                    const payload = message.payload as any;
                    if (message.type === ClobMarketTypes.AGG_ORDERBOOK) {
                        const orderbook = payload as AggOrderbook;
                        this.marketIntelligence.orderbooks.set(orderbook.market, orderbook);
                    } else if (message.type === ClobMarketTypes.LAST_TRADE_PRICE) {
                        const lastTrade = payload as LastTradePrice;
                        this.marketIntelligence.lastTradePrices.set(lastTrade.market, lastTrade);
                    }
                    break;

                case Topics.CLOB_USER:
                    if (message.type === 'order') {
                        const order = message.payload as Order;
                        this.marketIntelligence.userOrders.set(order.id, order);
                    } else if (message.type === 'trade') {
                        const trade = message.payload as UserTrade;
                        this.marketIntelligence.userTrades.set(trade.id, trade);
                    }
                    break;
            }
        } catch (error) {
            logger.error('Error updating market intelligence:', error);
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
                case Topics.ACTIVITY:
                    if (message.type === ActivityTypes.TRADES || message.type === ActivityTypes.ORDERS_MATCHED) {
                        const trade = message.payload as Trade;
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

                case Topics.CRYPTO_PRICES:
                case Topics.CRYPTO_PRICES_CHAINLINK:
                case Topics.EQUITY_PRICES:
                    if (message.type === PriceTypes.UPDATE) {
                        const priceData = message.payload as CryptoPrice | EquityPrice;
                        wsService.broadcast({
                            type: 'price-update',
                            token: priceData.symbol,
                            price: priceData.value,
                            change24h: 0,
                            volume24h: 0,
                            timestamp: priceData.timestamp,
                        });
                    }
                    break;

                case Topics.CLOB_MARKET:
                    const payload = message.payload as any;
                    if (message.type === ClobMarketTypes.LAST_TRADE_PRICE) {
                        const lastTrade = payload as LastTradePrice;
                        wsService.broadcast({
                            type: 'price-update',
                            token: lastTrade.asset_id,
                            price: parseFloat(lastTrade.price),
                            change24h: 0,
                            timestamp: message.timestamp,
                        });
                    } else if (message.type === ClobMarketTypes.PRICE_CHANGE) {
                        const priceChanges = payload as PriceChanges;
                        if (priceChanges.pc && priceChanges.pc.length > 0 && priceChanges.pc[0]) {
                            wsService.broadcast({
                                type: 'price-update',
                                token: priceChanges.m,
                                price: parseFloat(priceChanges.pc[0].p),
                                change24h: 0,
                                timestamp: message.timestamp,
                            });
                        }
                    }
                    break;

                case Topics.CLOB_USER:
                    // User-specific order and trade updates
                    wsService.emitCustomEvent('polymarket-user-event', {
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
        wsService.emitCustomEvent('polymarket-event', {
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
     * Get market intelligence data
     */
    getMarketIntelligence(): MarketIntelligence {
        return this.marketIntelligence;
    }

    /**
     * Get latest trade for a market
     */
    getLatestTrade(conditionId: string): Trade | undefined {
        return this.marketIntelligence.latestTrades.get(conditionId);
    }

    /**
     * Get crypto price
     */
    getCryptoPrice(symbol: string): CryptoPrice | undefined {
        return this.marketIntelligence.cryptoPrices.get(symbol);
    }

    /**
     * Get equity price
     */
    getEquityPrice(symbol: string): EquityPrice | undefined {
        return this.marketIntelligence.equityPrices.get(symbol);
    }

    /**
     * Get orderbook for a market
     */
    getOrderbook(market: string): AggOrderbook | undefined {
        return this.marketIntelligence.orderbooks.get(market);
    }

    /**
     * Get all crypto prices
     */
    getAllCryptoPrices(): Map<string, CryptoPrice> {
        return this.marketIntelligence.cryptoPrices;
    }

    /**
     * Get all equity prices
     */
    getAllEquityPrices(): Map<string, EquityPrice> {
        return this.marketIntelligence.equityPrices;
    }

    /**
     * Get user orders
     */
    getUserOrders(): Map<string, Order> {
        return this.marketIntelligence.userOrders;
    }

    /**
     * Get user trades
     */
    getUserTrades(): Map<string, UserTrade> {
        return this.marketIntelligence.userTrades;
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

/**
 * Initialize real-time service with default configuration
 * Called automatically when the server starts
 */
export function initializeRealTimeService(): PolymarketRealTimeService {
    logger.info('🚀 Initializing Polymarket Real-Time Service...');

    const service = getPolymarketRealTimeService({
        autoConnect: true,
        autoReconnect: true,
        enableCryptoPrices: true,
        enableEquityPrices: true,
        enableActivityFeed: true,
        enableClobMarket: true,
    });

    logger.info('✅ Polymarket Real-Time Service initialized and connected');
    return service;
}
