/**
 * WebSocket Service using Socket.IO
 * Provides real-time updates to frontend clients
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../utils/logger.js';
import { polymarketRealtimeService } from '../polymarket/realtimeDataService.js';

export interface TradeExecutedEvent {
    type: 'trade';
    platform: 'pancakeswap' | 'polymarket';
    chain: 'bnb' | 'opbnb' | 'polygon';
    tradeId: string;
    token?: string;
    market?: string;
    amount: number;
    price?: number;
    outcome: 'success' | 'fail';
    pnl?: number;
    timestamp: number;
}

export interface BotStatusEvent {
    type: 'bot-status';
    platform: 'dex' | 'polymarket' | 'unified';
    status: 'running' | 'stopped' | 'error';
    message?: string;
    timestamp: number;
}

export interface OpportunityFoundEvent {
    type: 'opportunity';
    platform: 'pancakeswap' | 'polymarket' | 'cross-chain';
    description: string;
    confidence: number;
    potentialProfit?: number;
    timestamp: number;
}

export interface MemoryUpdatedEvent {
    type: 'memory';
    action: 'created' | 'updated' | 'synced';
    memoryId: string;
    platform: 'pancakeswap' | 'polymarket';
    timestamp: number;
}

export interface BalanceChangeEvent {
    type: 'balance';
    chain: 'bnb' | 'opbnb' | 'polygon';
    token: string;
    oldBalance: number;
    newBalance: number;
    change: number;
    timestamp: number;
}

export type WebSocketEvent =
    | TradeExecutedEvent
    | BotStatusEvent
    | OpportunityFoundEvent
    | MemoryUpdatedEvent
    | BalanceChangeEvent;

export class WebSocketService {
    private io: SocketIOServer;
    private connectedClients: Map<string, Socket> = new Map();
    private polymarketIntegrated: boolean = false;

    constructor(httpServer: HTTPServer) {
        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: [
                    'http://localhost:3000',
                    'http://localhost:3001',
                    'http://localhost:5173',
                    process.env.FRONTEND_URL || '',
                ].filter(Boolean),
                methods: ['GET', 'POST'],
                credentials: true,
            },
            transports: ['websocket', 'polling'],
        });

        this.setupEventHandlers();
        this.setupPolymarketIntegration();
        logger.info('🔌 WebSocket service initialized');
    }

    /**
     * Setup Socket.IO event handlers
     */
    private setupEventHandlers(): void {
        this.io.on('connection', (socket: Socket) => {
            const clientId = socket.id;
            this.connectedClients.set(clientId, socket);

            logger.info(`✅ Client connected: ${clientId} (Total: ${this.connectedClients.size})`);

            // Send welcome message
            socket.emit('connected', {
                clientId,
                timestamp: Date.now(),
                message: 'Connected to Immortal AI Trading Bot',
            });

            // Handle client disconnection
            socket.on('disconnect', (reason) => {
                this.connectedClients.delete(clientId);
                logger.info(`❌ Client disconnected: ${clientId} (Reason: ${reason}) (Total: ${this.connectedClients.size})`);
            });

            // Handle subscription requests
            socket.on('subscribe', (channels: string[]) => {
                channels.forEach((channel) => {
                    socket.join(channel);
                    logger.info(`📡 Client ${clientId} subscribed to ${channel}`);
                });
                socket.emit('subscribed', { channels, timestamp: Date.now() });
            });

            // Handle unsubscription requests
            socket.on('unsubscribe', (channels: string[]) => {
                channels.forEach((channel) => {
                    socket.leave(channel);
                    logger.info(`🔇 Client ${clientId} unsubscribed from ${channel}`);
                });
                socket.emit('unsubscribed', { channels, timestamp: Date.now() });
            });

            // Handle ping for connection health check
            socket.on('ping', () => {
                socket.emit('pong', { timestamp: Date.now() });
            });

            // Handle client errors
            socket.on('error', (error) => {
                logger.error(`⚠️  Socket error for client ${clientId}: ${error}`);
            });
        });
    }

    /**
     * Broadcast event to all connected clients
     */
    broadcast(event: WebSocketEvent): void {
        const eventType = event.type;
        logger.info(`📡 Broadcasting ${eventType} event to all clients`);
        this.io.emit(eventType, event);
    }

    /**
     * Send event to specific channel subscribers
     */
    broadcastToChannel(channel: string, event: WebSocketEvent): void {
        logger.info(`📡 Broadcasting ${event.type} to channel: ${channel}`);
        this.io.to(channel).emit(event.type, event);
    }

    /**
     * Send event to specific client
     */
    sendToClient(clientId: string, event: WebSocketEvent): void {
        const socket = this.connectedClients.get(clientId);
        if (socket) {
            logger.info(`📡 Sending ${event.type} to client ${clientId}`);
            socket.emit(event.type, event);
        } else {
            logger.warn(`⚠️  Client ${clientId} not found`);
        }
    }

    /**
     * Emit trade executed event
     */
    emitTradeExecuted(trade: Omit<TradeExecutedEvent, 'type' | 'timestamp'>): void {
        const event: TradeExecutedEvent = {
            type: 'trade',
            timestamp: Date.now(),
            ...trade,
        };
        this.broadcast(event);
        this.broadcastToChannel(trade.platform, event);
    }

    /**
     * Emit bot status change event
     */
    emitBotStatusChange(status: Omit<BotStatusEvent, 'type' | 'timestamp'>): void {
        const event: BotStatusEvent = {
            type: 'bot-status',
            timestamp: Date.now(),
            ...status,
        };
        this.broadcast(event);
        this.broadcastToChannel(status.platform, event);
    }

    /**
     * Emit opportunity found event
     */
    emitOpportunityFound(opportunity: Omit<OpportunityFoundEvent, 'type' | 'timestamp'>): void {
        const event: OpportunityFoundEvent = {
            type: 'opportunity',
            timestamp: Date.now(),
            ...opportunity,
        };
        this.broadcast(event);
        this.broadcastToChannel(opportunity.platform, event);
    }

    /**
     * Emit memory updated event
     */
    emitMemoryUpdated(memory: Omit<MemoryUpdatedEvent, 'type' | 'timestamp'>): void {
        const event: MemoryUpdatedEvent = {
            type: 'memory',
            timestamp: Date.now(),
            ...memory,
        };
        this.broadcast(event);
    }

    /**
     * Emit balance change event
     */
    emitBalanceChange(balance: Omit<BalanceChangeEvent, 'type' | 'timestamp'>): void {
        const event: BalanceChangeEvent = {
            type: 'balance',
            timestamp: Date.now(),
            ...balance,
        };
        this.broadcast(event);
        this.broadcastToChannel(balance.chain, event);
    }

    /**
     * Broadcast full bot status update
     */
    broadcastBotStatus(status: any): void {
        logger.info('📡 Broadcasting bot status update');
        this.io.emit('bot_status_update', status);
    }

    /**
     * Get number of connected clients
     */
    getConnectedClientsCount(): number {
        return this.connectedClients.size;
    }

    /**
     * Get list of connected client IDs
     */
    getConnectedClientIds(): string[] {
        return Array.from(this.connectedClients.keys());
    }

    /**
     * Setup Polymarket real-time data integration
     */
    private setupPolymarketIntegration(): void {
        if (this.polymarketIntegrated) return;

        try {
            // Subscribe to Polymarket real-time events
            polymarketRealtimeService.on('connected', () => {
                logger.info('✅ Polymarket real-time service connected');
                this.broadcastPolymarketStatus('connected');
            });

            polymarketRealtimeService.on('disconnected', () => {
                logger.warn('⚠️  Polymarket real-time service disconnected');
                this.broadcastPolymarketStatus('disconnected');
            });

            // Market price changes
            polymarketRealtimeService.on('clob_market:price_change', (data: any) => {
                this.io.emit('polymarket_price_change', {
                    type: 'price_change',
                    data,
                    timestamp: Date.now(),
                });
            });

            // Orderbook updates
            polymarketRealtimeService.on('clob_market:agg_orderbook', (data: any) => {
                this.io.emit('polymarket_orderbook', {
                    type: 'orderbook',
                    data,
                    timestamp: Date.now(),
                });
            });

            // Last trade prices
            polymarketRealtimeService.on('clob_market:last_trade_price', (data: any) => {
                this.io.emit('polymarket_last_trade', {
                    type: 'last_trade',
                    data,
                    timestamp: Date.now(),
                });
            });

            // User orders
            polymarketRealtimeService.on('clob_user:order', (data: any) => {
                this.io.emit('polymarket_user_order', {
                    type: 'user_order',
                    data,
                    timestamp: Date.now(),
                });
            });

            // User trades
            polymarketRealtimeService.on('clob_user:trade', (data: any) => {
                this.io.emit('polymarket_user_trade', {
                    type: 'user_trade',
                    data,
                    timestamp: Date.now(),
                });
            });

            // Trading activity
            polymarketRealtimeService.on('activity:trades', (data: any) => {
                this.io.emit('polymarket_trade_activity', {
                    type: 'trade_activity',
                    data,
                    timestamp: Date.now(),
                });
            });

            // Crypto prices
            polymarketRealtimeService.on('crypto_prices:update', (data: any) => {
                this.io.emit('crypto_price_update', {
                    type: 'crypto_price',
                    data,
                    timestamp: Date.now(),
                });
            });

            // Equity prices
            polymarketRealtimeService.on('equity_prices:update', (data: any) => {
                this.io.emit('equity_price_update', {
                    type: 'equity_price',
                    data,
                    timestamp: Date.now(),
                });
            });

            // Market created/resolved
            polymarketRealtimeService.on('clob_market:market_created', (data: any) => {
                this.io.emit('polymarket_market_created', {
                    type: 'market_created',
                    data,
                    timestamp: Date.now(),
                });
            });

            polymarketRealtimeService.on('clob_market:market_resolved', (data: any) => {
                this.io.emit('polymarket_market_resolved', {
                    type: 'market_resolved',
                    data,
                    timestamp: Date.now(),
                });
            });

            this.polymarketIntegrated = true;
            logger.info('✅ Polymarket real-time integration setup complete');
        } catch (error) {
            logger.error('Error setting up Polymarket integration:', error);
        }
    }

    /**
     * Broadcast Polymarket connection status
     */
    private broadcastPolymarketStatus(status: 'connected' | 'disconnected'): void {
        this.io.emit('polymarket_status', {
            status,
            timestamp: Date.now(),
        });
    }

    /**
     * Start Polymarket real-time data stream
     */
    startPolymarketStream(options?: {
        tokenIds?: string[];
        marketSlugs?: string[];
        cryptoSymbols?: string[];
        equitySymbols?: string[];
    }): void {
        if (!polymarketRealtimeService.isConnected()) {
            polymarketRealtimeService.connect();
        }

        // Subscribe to requested data streams
        if (options?.tokenIds && options.tokenIds.length > 0) {
            polymarketRealtimeService.subscribeToMarketPrices(options.tokenIds);
            polymarketRealtimeService.subscribeToOrderbook(options.tokenIds);
            polymarketRealtimeService.subscribeToLastTrades(options.tokenIds);
        }

        if (options?.marketSlugs && options.marketSlugs.length > 0) {
            options.marketSlugs.forEach((slug) => {
                polymarketRealtimeService.subscribeToTradingActivity(slug);
            });
        }

        if (options?.cryptoSymbols && options.cryptoSymbols.length > 0) {
            options.cryptoSymbols.forEach((symbol) => {
                polymarketRealtimeService.subscribeToCryptoPrice(symbol);
            });
        }

        if (options?.equitySymbols && options.equitySymbols.length > 0) {
            options.equitySymbols.forEach((symbol) => {
                polymarketRealtimeService.subscribeToEquityPrice(symbol);
            });
        }

        logger.info('📡 Polymarket real-time data stream started');
    }

    /**
     * Stop Polymarket real-time data stream
     */
    stopPolymarketStream(): void {
        polymarketRealtimeService.disconnect();
        logger.info('🔌 Polymarket real-time data stream stopped');
    }

    /**
     * Close WebSocket server
     */
    close(): Promise<void> {
        return new Promise((resolve) => {
            logger.info('🔌 Closing WebSocket service...');
            this.stopPolymarketStream();
            this.io.close(() => {
                logger.info('✅ WebSocket service closed');
                resolve();
            });
        });
    }
}

// Singleton instance
let wsService: WebSocketService | null = null;

export function initializeWebSocketService(httpServer: HTTPServer): WebSocketService {
    if (!wsService) {
        wsService = new WebSocketService(httpServer);
    }
    return wsService;
}

export function getWebSocketService(): WebSocketService | null {
    return wsService;
}

export default WebSocketService;
