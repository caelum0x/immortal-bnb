'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/apiClient';
import useWebSocket from '@/lib/useWebSocket';

interface Trade {
  id: string;
  timestamp: number;
  type: 'BUY' | 'SELL';
  chain: 'BNB' | 'POLYGON';
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  profit?: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  profitLoss?: number;
  outcome?: string;
}

interface TradeFilters {
  limit?: number;
  offset?: number;
  filter?: 'all' | 'dex' | 'polymarket';
  sort?: 'newest' | 'profit' | 'volume';
}

export function useTrades(initialFilters?: TradeFilters) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TradeFilters>(
    initialFilters || { limit: 20, offset: 0, filter: 'all', sort: 'newest' }
  );
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const { lastTrade, isConnected } = useWebSocket();

  // Fetch trades
  const fetchTrades = useCallback(async (append = false) => {
    try {
      setError(null);
      if (!append) setLoading(true);

      const data = await api.getTradeHistory(filters);

      if (append) {
        setTrades((prev) => [...prev, ...data.trades]);
      } else {
        setTrades(data.trades);
      }

      setTotal(data.total);
      setHasMore(data.trades.length === filters.limit);

      return data;
    } catch (err: any) {
      console.error('Failed to fetch trades:', err);
      setError(err.message || 'Failed to load trades');
      return null;
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Auto-refresh
  useEffect(() => {
    fetchTrades();
  }, [filters, fetchTrades]);

  // Add new trade from WebSocket
  useEffect(() => {
    if (lastTrade && filters.filter === 'all') {
      // Add to beginning of list
      setTrades((prev) => {
        // Avoid duplicates
        if (prev.some((t) => t.id === lastTrade.id)) {
          return prev;
        }
        return [lastTrade as any, ...prev].slice(0, filters.limit || 20);
      });
      setTotal((prev) => prev + 1);
    }
  }, [lastTrade, filters]);

  // Update filter
  const updateFilters = useCallback((newFilters: Partial<TradeFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, offset: 0 }));
  }, []);

  // Load more
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;

    setFilters((prev) => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 20),
    }));

    return fetchTrades(true);
  }, [hasMore, loading, fetchTrades]);

  // Refresh
  const refresh = useCallback(async () => {
    setFilters((prev) => ({ ...prev, offset: 0 }));
    return fetchTrades(false);
  }, [fetchTrades]);

  // Calculate statistics
  const stats = {
    totalTrades: trades.length,
    profitableTrades: trades.filter((t) => (t.profitLoss || 0) > 0).length,
    failedTrades: trades.filter((t) => t.status === 'FAILED').length,
    pendingTrades: trades.filter((t) => t.status === 'PENDING').length,
    totalProfit: trades.reduce((sum, t) => sum + (t.profitLoss || 0), 0),
    avgProfit:
      trades.length > 0
        ? trades.reduce((sum, t) => sum + (t.profitLoss || 0), 0) / trades.length
        : 0,
  };

  return {
    trades,
    loading,
    error,
    filters,
    hasMore,
    total,
    isConnected,
    updateFilters,
    loadMore,
    refresh,
    stats,
  };
}

export default useTrades;
