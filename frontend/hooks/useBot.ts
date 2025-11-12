'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/apiClient';
import useWebSocket from '@/lib/useWebSocket';

interface BotState {
  dex: {
    status: 'RUNNING' | 'STOPPED' | 'ERROR';
    lastTrade: number | null;
    balance: number;
    config: {
      maxTradeAmount: number;
      confidenceThreshold: number;
      stopLoss: number;
      maxSlippage: number;
    };
  };
  polymarket: {
    status: 'RUNNING' | 'STOPPED' | 'ERROR';
    lastTrade: number | null;
    config: {
      maxBetAmount: number;
      confidenceThreshold: number;
      maxSlippage: number;
    };
  };
  websocket: {
    connected: number;
    status: string;
  };
}

export function useBot() {
  const [botState, setBotState] = useState<BotState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);

  const { botStatus: wsBotStatus, isConnected: wsConnected } = useWebSocket();

  // Fetch bot status
  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getBotStatus();
      setBotState(data as any);
    } catch (err: any) {
      console.error('Failed to fetch bot status:', err);
      setError(err.message || 'Failed to fetch bot status');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Every 10s
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Update from WebSocket
  useEffect(() => {
    if (wsBotStatus && botState) {
      setBotState((prev) => ({
        ...prev!,
        dex: { ...prev!.dex, status: wsBotStatus.dex.status as any },
        polymarket: { ...prev!.polymarket, status: wsBotStatus.polymarket.status as any },
      }));
    }
  }, [wsBotStatus, botState]);

  // Start bot
  const startBot = useCallback(async (type: 'dex' | 'polymarket' | 'all') => {
    try {
      setStarting(true);
      setError(null);
      const result = await api.startBot(type);

      if (result.success) {
        await fetchStatus();
        return { success: true, message: result.message };
      }

      throw new Error(result.message || 'Failed to start bot');
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to start bot';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setStarting(false);
    }
  }, [fetchStatus]);

  // Stop bot
  const stopBot = useCallback(async (type: 'dex' | 'polymarket' | 'all') => {
    try {
      setStopping(true);
      setError(null);
      const result = await api.stopBot(type);

      if (result.success) {
        await fetchStatus();
        return { success: true, message: result.message };
      }

      throw new Error(result.message || 'Failed to stop bot');
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to stop bot';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setStopping(false);
    }
  }, [fetchStatus]);

  // Check if bot is running
  const isDexRunning = botState?.dex?.status === 'RUNNING';
  const isPolymarketRunning = botState?.polymarket?.status === 'RUNNING';
  const isAnyRunning = isDexRunning || isPolymarketRunning;

  return {
    botState,
    loading,
    error,
    starting,
    stopping,
    isDexRunning,
    isPolymarketRunning,
    isAnyRunning,
    wsConnected,
    startBot,
    stopBot,
    refresh: fetchStatus,
  };
}

export default useBot;
