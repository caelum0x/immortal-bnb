'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/apiClient';
import useWebSocket from '@/lib/useWebSocket';

interface Stats {
  totalTrades: number;
  completedTrades: number;
  pendingTrades: number;
  profitableTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfitLoss: number;
  bestTrade: any;
  worstTrade: any;
}

export default function TradingStats() {
  const { lastTrade } = useWebSocket();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Refresh stats when new trade comes in
  useEffect(() => {
    if (lastTrade) {
      fetchStats();
    }
  }, [lastTrade]);

  const fetchStats = async () => {
    try {
      setError(null);
      // Use correct API client method
      const data = await api.getPerformanceData();

      // Map backend data to component structure
      setStats({
        totalTrades: data.totalTrades,
        completedTrades: data.wins + data.losses,
        pendingTrades: 0,
        profitableTrades: data.wins,
        losingTrades: data.losses,
        winRate: data.winRate,
        totalProfitLoss: data.totalPL,
        bestTrade: null, // TODO: Add to backend
        worstTrade: null, // TODO: Add to backend
      });
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
      setError(err.message || 'Failed to fetch stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading && !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-1/2 mb-3" />
            <div className="h-8 bg-slate-700 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <p className="text-red-400 text-sm">⚠ {error}</p>
          <button
            onClick={handleRefresh}
            className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded text-xs font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No stats available</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg text-sm font-medium transition-colors"
        >
          Load Stats
        </button>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Trades',
      value: stats.totalTrades,
      icon: '📊',
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'from-blue-500/10 to-cyan-500/10',
      border: 'border-blue-500/30',
      textColor: 'text-blue-400',
    },
    {
      label: 'Win Rate',
      value: `${stats.winRate.toFixed(1)}%`,
      subtext: `${stats.profitableTrades}W / ${stats.losingTrades}L`,
      icon: '🎯',
      gradient: stats.winRate >= 60 ? 'from-green-500 to-emerald-500' : 'from-yellow-500 to-orange-500',
      bg: stats.winRate >= 60 ? 'from-green-500/10 to-emerald-500/10' : 'from-yellow-500/10 to-orange-500/10',
      border: stats.winRate >= 60 ? 'border-green-500/30' : 'border-yellow-500/30',
      textColor: stats.winRate >= 60 ? 'text-green-400' : 'text-yellow-400',
    },
    {
      label: 'Total P&L',
      value: `${stats.totalProfitLoss >= 0 ? '+' : ''}${stats.totalProfitLoss.toFixed(4)} BNB`,
      subtext: `≈ $${(stats.totalProfitLoss * 600).toFixed(2)} USD`,
      icon: stats.totalProfitLoss >= 0 ? '📈' : '📉',
      gradient: stats.totalProfitLoss >= 0 ? 'from-green-500 to-emerald-500' : 'from-red-500 to-rose-500',
      bg: stats.totalProfitLoss >= 0 ? 'from-green-500/10 to-emerald-500/10' : 'from-red-500/10 to-rose-500/10',
      border: stats.totalProfitLoss >= 0 ? 'border-green-500/30' : 'border-red-500/30',
      textColor: stats.totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400',
    },
    {
      label: 'Pending Trades',
      value: stats.pendingTrades,
      subtext: `${stats.completedTrades} completed`,
      icon: '⏳',
      gradient: 'from-purple-500 to-pink-500',
      bg: 'from-purple-500/10 to-pink-500/10',
      border: 'border-purple-500/30',
      textColor: 'text-purple-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Trading Analytics</h3>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={`px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium transition-all ${refreshing ? 'opacity-50' : ''}`}
        >
          <span className={refreshing ? 'animate-spin inline-block' : ''}>
            🔄
          </span>
          {refreshing ? ' Refreshing...' : ' Refresh'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="relative group">
            {/* Glow Effect */}
            <div className={`absolute inset-0 bg-gradient-to-r ${stat.bg} rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

            {/* Card */}
            <div className={`relative bg-slate-800/50 backdrop-blur-xl border ${stat.border} rounded-xl p-6 hover:scale-[1.02] transition-transform duration-300`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-400">{stat.label}</span>
                <div className={`w-10 h-10 bg-gradient-to-br ${stat.gradient} rounded-lg flex items-center justify-center shadow-lg`}>
                  <span className="text-xl">{stat.icon}</span>
                </div>
              </div>
              <div className={`text-3xl font-bold ${stat.textColor} mb-1`}>
                {stat.value}
              </div>
              {stat.subtext && (
                <div className="text-xs text-slate-500">{stat.subtext}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Best & Worst Trades */}
      {(stats.bestTrade || stats.worstTrade) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Best Trade */}
          {stats.bestTrade && (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl blur" />
              <div className="relative bg-slate-800/50 backdrop-blur-xl border border-green-500/30 rounded-xl p-5 hover:scale-[1.01] transition-transform duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🏆</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Best Trade</h3>
                    <p className="text-xs text-slate-400">Highest profit</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pair:</span>
                    <span className="text-white font-semibold">{stats.bestTrade.pair || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Profit:</span>
                    <span className="text-green-400 font-bold">
                      +{stats.bestTrade.profitLoss?.toFixed(4)} BNB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date:</span>
                    <span className="text-slate-300 text-xs">
                      {new Date(stats.bestTrade.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Worst Trade */}
          {stats.worstTrade && (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-rose-500/20 rounded-xl blur" />
              <div className="relative bg-slate-800/50 backdrop-blur-xl border border-red-500/30 rounded-xl p-5 hover:scale-[1.01] transition-transform duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg flex items-center justify-center">
                    <span className="text-xl">⚠️</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Worst Trade</h3>
                    <p className="text-xs text-slate-400">Biggest loss</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pair:</span>
                    <span className="text-white font-semibold">{stats.worstTrade.pair || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Loss:</span>
                    <span className="text-red-400 font-bold">
                      {stats.worstTrade.profitLoss?.toFixed(4)} BNB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date:</span>
                    <span className="text-slate-300 text-xs">
                      {new Date(stats.worstTrade.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Performance Summary */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-5">
        <h4 className="text-white font-bold mb-4">Performance Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-400">{stats.totalTrades}</div>
            <div className="text-xs text-slate-500 mt-1">Total Trades</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">{stats.completedTrades}</div>
            <div className="text-xs text-slate-500 mt-1">Completed</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${stats.winRate >= 60 ? 'text-green-400' : 'text-yellow-400'}`}>
              {stats.winRate.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500 mt-1">Win Rate</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${stats.totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.totalProfitLoss >= 0 ? '+' : ''}{stats.totalProfitLoss.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Total P&L (BNB)</div>
          </div>
        </div>
      </div>

      {/* Last Update */}
      <div className="text-center text-xs text-slate-500">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
