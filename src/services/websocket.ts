/**
 * WebSocket Service using Socket.IO
 * Provides real-time updates to frontend clients
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../utils/logger.js';

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
     * Close WebSocket server
     */
    close(): Promise<void> {
        return new Promise((resolve) => {
            logger.info('🔌 Closing WebSocket service...');
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
