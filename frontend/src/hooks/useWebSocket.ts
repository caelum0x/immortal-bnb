/**
 * useWebSocket Hook
 * Provides WebSocket connection and event subscription functionality
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface WebSocketEvent {
  type: 'trade' | 'bot-status' | 'opportunity' | 'memory' | 'balance';
  timestamp: number;
  [key: string]: any;
}

export interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

export interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  subscribe: (channels: string[]) => void;
  unsubscribe: (channels: string[]) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
  emit: (event: string, data: any) => void;
  connect: () => void;
  disconnect: () => void;
}

const DEFAULT_OPTIONS: UseWebSocketOptions = {
  url: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001',
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
};

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    if (!opts.autoConnect) return;

    const socket = io(opts.url!, {
      transports: ['websocket', 'polling'],
      reconnection: opts.reconnection,
      reconnectionAttempts: opts.reconnectionAttempts,
      reconnectionDelay: opts.reconnectionDelay,
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      setIsConnected(false);
    });

    socket.on('connected', (data) => {
      console.log('🎉 WebSocket welcome message:', data);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [opts.url, opts.autoConnect, opts.reconnection, opts.reconnectionAttempts, opts.reconnectionDelay]);

  // Subscribe to channels
  const subscribe = useCallback((channels: string[]) => {
    if (socketRef.current) {
      socketRef.current.emit('subscribe', channels);
      console.log('📡 Subscribed to channels:', channels);
    }
  }, []);

  // Unsubscribe from channels
  const unsubscribe = useCallback((channels: string[]) => {
    if (socketRef.current) {
      socketRef.current.emit('unsubscribe', channels);
      console.log('🔇 Unsubscribed from channels:', channels);
    }
  }, []);

  // Add event listener
  const on = useCallback((event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  // Remove event listener
  const off = useCallback((event: string, callback?: (data: any) => void) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback);
      } else {
        socketRef.current.off(event);
      }
    }
  }, []);

  // Emit event
  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  }, [isConnected]);

  // Manual connect
  const connect = useCallback(() => {
    if (socketRef.current && !isConnected) {
      socketRef.current.connect();
    }
  }, [isConnected]);

  // Manual disconnect
  const disconnect = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.disconnect();
    }
  }, [isConnected]);

  return {
    socket: socketRef.current,
    isConnected,
    subscribe,
    unsubscribe,
    on,
    off,
    emit,
    connect,
    disconnect,
  };
}

/**
 * Hook for subscribing to specific WebSocket events
 */
export function useWebSocketEvent<T = any>(
  eventName: string,
  callback: (data: T) => void,
  deps: any[] = []
) {
  const { on, off } = useWebSocket({ autoConnect: true });

  useEffect(() => {
    const handler = (data: T) => {
      callback(data);
    };

    on(eventName, handler);

    return () => {
      off(eventName, handler);
    };
  }, [eventName, on, off, ...deps]);
}

/**
 * Hook for subscribing to trade events
 */
export function useTradeEvents(callback: (data: any) => void) {
  useWebSocketEvent('trade', callback);
}

/**
 * Hook for subscribing to bot status events
 */
export function useBotStatusEvents(callback: (data: any) => void) {
  useWebSocketEvent('bot-status', callback);
}

/**
 * Hook for subscribing to opportunity events
 */
export function useOpportunityEvents(callback: (data: any) => void) {
  useWebSocketEvent('opportunity', callback);
}

/**
 * Hook for subscribing to memory events
 */
export function useMemoryEvents(callback: (data: any) => void) {
  useWebSocketEvent('memory', callback);
}

/**
 * Hook for subscribing to balance events
 */
export function useBalanceEvents(callback: (data: any) => void) {
  useWebSocketEvent('balance', callback);
}

export default useWebSocket;
