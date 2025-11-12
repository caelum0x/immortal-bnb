'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/apiClient';
import useWebSocket from '@/lib/useWebSocket';

interface Portfolio {
  dex: {
    balance: number;
    pnl: number;
    currency: string;
  };
  polymarket: {
    balance: number;
    pnl: number;
    currency: string;
  };
  total: {
    dex_bnb: number;
    polymarket_usd: number;
    combined_pnl: number;
  };
}

export function usePortfolio(autoRefreshInterval = 30000) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { lastTrade, isConnected } = useWebSocket();

  // Fetch portfolio
  const fetchPortfolio = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getPortfolio();
      setPortfolio(data);
      return data;
    } catch (err: any) {
      console.error('Failed to fetch portfolio:', err);
      setError(err.message || 'Failed to load portfolio');
      return null;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Auto-refresh
  useEffect(() => {
    fetchPortfolio();
    if (autoRefreshInterval > 0) {
      const interval = setInterval(fetchPortfolio, autoRefreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchPortfolio, autoRefreshInterval]);

  // Refresh on new trade
  useEffect(() => {
    if (lastTrade) {
      fetchPortfolio();
    }
  }, [lastTrade, fetchPortfolio]);

  // Manual refresh
  const refresh = useCallback(async () => {
    setRefreshing(true);
    return fetchPortfolio();
  }, [fetchPortfolio]);

  // Calculate metrics
  const totalPnL = portfolio?.total?.combined_pnl || 0;
  const isProfitable = totalPnL > 0;
  const totalBalance = (portfolio?.dex?.balance || 0) + (portfolio?.polymarket?.balance || 0);

  // Calculate PnL percentage
  const pnlPercentage = totalBalance > 0 ? (totalPnL / totalBalance) * 100 : 0;

  return {
    portfolio,
    loading,
    error,
    refreshing,
    isConnected,
    refresh,
    // Calculated values
    totalPnL,
    isProfitable,
    totalBalance,
    pnlPercentage,
    // Individual balances
    dexBalance: portfolio?.dex?.balance || 0,
    polymarketBalance: portfolio?.polymarket?.balance || 0,
    // Individual PnLs
    dexPnL: portfolio?.dex?.pnl || 0,
    polymarketPnL: portfolio?.polymarket?.pnl || 0,
  };
}

export default usePortfolio;
