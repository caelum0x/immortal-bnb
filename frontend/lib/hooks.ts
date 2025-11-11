'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from './api'

// Custom hook for bot status
export function useBotStatus() {
  const [data, setData] = useState({
    status: 'stopped' as 'running' | 'stopped' | 'error' | 'demo',
    message: 'Loading...',
    walletConnected: false,
    aiEnabled: false,
    needsSetup: false,
    isLoading: true,
    error: null as string | null,
  });

  const [isToggling, setIsToggling] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));
      const result = await api.getBotStatus();
      setData(prev => ({ 
        ...prev, 
        ...result, 
        isLoading: false 
      }));
    } catch (error) {
      setData(prev => ({ 
        ...prev, 
        status: 'demo',
        message: 'Backend not configured - Demo Mode',
        needsSetup: true,
        isLoading: false, 
        error: (error as Error).message 
      }));
    }
  }, []);

  const toggleBot = useCallback(async () => {
    if (isToggling || data.needsSetup) return;
    
    setIsToggling(true);
    try {
      if (data.status === 'running') {
        await api.stopBot();
      } else {
        await api.startBot();
      }
      // Refresh status after toggle
      await fetchStatus();
    } catch (error) {
      setData(prev => ({ 
        ...prev, 
        error: `Failed to toggle bot: ${(error as Error).message}` 
      }));
    } finally {
      setIsToggling(false);
    }
  }, [data.status, isToggling, fetchStatus]);

  useEffect(() => {
    fetchStatus();
    // Poll every 5 seconds
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return {
    ...data,
    isToggling,
    toggleBot,
    refresh: fetchStatus,
  };
}

// Custom hook for wallet info
export function useWalletInfo(address: string | null) {
  const [data, setData] = useState({
    balance: '0.0000',
    usdValue: '0.00',
    network: '',
    isLoading: false,
    error: null as string | null,
  });

  const fetchWalletInfo = useCallback(async () => {
    if (!address) {
      setData({
        balance: '0.0000',
        usdValue: '0.00',
        network: '',
        isLoading: false,
        error: null,
      });
      return;
    }

    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));
      const result = await api.getWalletInfo(address);
      setData({
        ...result,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: (error as Error).message,
      }));
    }
  }, [address]);

  useEffect(() => {
    fetchWalletInfo();
    
    if (address) {
      // Poll every 10 seconds for balance updates
      const interval = setInterval(fetchWalletInfo, 10000);
      return () => clearInterval(interval);
    }
  }, [fetchWalletInfo, address]);

  return {
    ...data,
    refresh: fetchWalletInfo,
  };
}

// Custom hook for trading history
export function useTradingHistory(limit = 20) {
  const [data, setData] = useState({
    trades: [] as any[],
    total: 0,
    isLoading: true,
    error: null as string | null,
  });

  const fetchHistory = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));
      const result = await api.getTradingHistory(limit);
      setData({
        ...result,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: (error as Error).message,
      }));
    }
  }, [limit]);

  useEffect(() => {
    fetchHistory();
    // Poll every 15 seconds for new trades
    const interval = setInterval(fetchHistory, 15000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  return {
    ...data,
    refresh: fetchHistory,
  };
}

// Custom hook for performance data
export function usePerformanceData() {
  const [data, setData] = useState({
    totalProfit: '0.00',
    profitChange: '0.00',
    totalTrades: 0,
    successRate: 0,
    chartData: [] as { time: string; value: number }[],
    stats: {
      todayProfit: '0.00',
      todayTrades: 0,
      todayWinRate: 0,
    },
    isLoading: true,
    error: null as string | null,
    needsConfiguration: false,
  });

  const fetchPerformance = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));
      const result = await api.getPerformanceData();
      
      // Transform backend data to frontend format
      const transformedData = {
        totalProfit: result.totalProfit || '0.00',
        profitChange: '0.00', // Calculate from historical data if available
        totalTrades: result.totalTrades || 0,
        successRate: result.successRate || 0,
        chartData: [], // Mock data for now
        stats: {
          todayProfit: '0.00',
          todayTrades: result.totalTrades || 0,
          todayWinRate: result.successRate || 0,
        },
        isLoading: false,
        error: null,
        needsConfiguration: result.needsConfiguration || false,
      };
      
      setData(transformedData);
    } catch (error) {
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: (error as Error).message,
        needsConfiguration: true,
      }));
    }
  }, []);

  useEffect(() => {
    fetchPerformance();
    // Poll every 30 seconds for performance updates
    const interval = setInterval(fetchPerformance, 30000);
    return () => clearInterval(interval);
  }, [fetchPerformance]);

  return {
    ...data,
    refresh: fetchPerformance,
  };
}

// Custom hook for dashboard stats
export function useDashboardStats() {
  const [data, setData] = useState({
    totalProfit: '0.00',
    profitChange: '0.00',
    totalTrades: 0,
    successRate: 0,
    activePositions: 0,
    daysProfitable: 0,
    aiStatus: {
      isLearning: false,
      confidence: 0,
      memoryCount: 0,
      lastUpdate: '',
    },
    isLoading: true,
    error: null as string | null,
  });

  const fetchStats = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));
      const result = await api.getDashboardStats();
      setData(prev => ({
        ...prev,
        ...result,
        profitChange: result.profitChange || '0.00',
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: (error as Error).message,
      }));
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Poll every 20 seconds for stats updates
    const interval = setInterval(fetchStats, 20000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return {
    ...data,
    refresh: fetchStats,
  };
}

// Generic hook for any API endpoint
export function useApiData<T>(
  fetchFunction: () => Promise<T>,
  dependencies: any[] = [],
  pollInterval = 0
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction]);

  useEffect(() => {
    fetchData();
    
    if (pollInterval > 0) {
      const interval = setInterval(fetchData, pollInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, pollInterval, ...dependencies]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchData,
  };
}
