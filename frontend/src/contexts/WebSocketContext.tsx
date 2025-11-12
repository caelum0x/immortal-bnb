/**
 * WebSocket Context Provider
 * Provides WebSocket connection to entire application
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import useWebSocket, { UseWebSocketReturn, WebSocketEvent } from '../hooks/useWebSocket';

interface WebSocketContextValue extends UseWebSocketReturn {
  events: WebSocketEvent[];
  addEvent: (event: WebSocketEvent) => void;
  clearEvents: () => void;
  latestTrade: any | null;
  latestOpportunity: any | null;
  botStatus: Record<string, any>;
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
  url?: string;
  maxEvents?: number;
}

export function WebSocketProvider({
  children,
  url,
  maxEvents = 100,
}: WebSocketProviderProps) {
  const ws = useWebSocket({ url, autoConnect: true });
  const [events, setEvents] = useState<WebSocketEvent[]>([]);
  const [latestTrade, setLatestTrade] = useState<any | null>(null);
  const [latestOpportunity, setLatestOpportunity] = useState<any | null>(null);
  const [botStatus, setBotStatus] = useState<Record<string, any>>({});

  // Add event to history
  const addEvent = (event: WebSocketEvent) => {
    setEvents((prev) => {
      const newEvents = [event, ...prev];
      return newEvents.slice(0, maxEvents);
    });
  };

  // Clear event history
  const clearEvents = () => {
    setEvents([]);
  };

  // Subscribe to all events
  useEffect(() => {
    if (!ws.isConnected) return;

    // Subscribe to all channels
    ws.subscribe(['pancakeswap', 'polymarket', 'cross-chain', 'dex', 'unified']);

    // Trade events
    const handleTrade = (data: any) => {
      console.log('📊 Trade event:', data);
      setLatestTrade(data);
      addEvent(data);
    };

    // Bot status events
    const handleBotStatus = (data: any) => {
      console.log('🤖 Bot status event:', data);
      setBotStatus((prev) => ({
        ...prev,
        [data.platform]: data,
      }));
      addEvent(data);
    };

    // Opportunity events
    const handleOpportunity = (data: any) => {
      console.log('💡 Opportunity event:', data);
      setLatestOpportunity(data);
      addEvent(data);
    };

    // Memory events
    const handleMemory = (data: any) => {
      console.log('💾 Memory event:', data);
      addEvent(data);
    };

    // Balance events
    const handleBalance = (data: any) => {
      console.log('💰 Balance event:', data);
      addEvent(data);
    };

    // Register event handlers
    ws.on('trade', handleTrade);
    ws.on('bot-status', handleBotStatus);
    ws.on('opportunity', handleOpportunity);
    ws.on('memory', handleMemory);
    ws.on('balance', handleBalance);

    // Cleanup
    return () => {
      ws.off('trade', handleTrade);
      ws.off('bot-status', handleBotStatus);
      ws.off('opportunity', handleOpportunity);
      ws.off('memory', handleMemory);
      ws.off('balance', handleBalance);
    };
  }, [ws.isConnected, ws]);

  const value: WebSocketContextValue = {
    ...ws,
    events,
    addEvent,
    clearEvents,
    latestTrade,
    latestOpportunity,
    botStatus,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

/**
 * Hook to access WebSocket context
 */
export function useWebSocketContext(): WebSocketContextValue {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
}

export default WebSocketContext;
