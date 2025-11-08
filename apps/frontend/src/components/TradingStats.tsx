/**
 * Production Trading Stats Component
 * Real-time display of trading performance - NO MOCKS
 */

'use client';

import { getTradingStats, TradingStats as StatsType } from '@/lib/api';
import { usePolling } from '@/hooks/usePolling';

export default function TradingStats() {
  const { data: stats, error, loading } = usePolling<StatsType>(
    () => getTradingStats(),
    { interval: 30000 } // Refresh every 30 seconds
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 bg-red-900/20 border border-red-500">
        <div className="flex items-center">
          <span className="text-2xl mr-3">❌</span>
          <div>
            <p className="font-semibold text-red-500">Failed to Load Stats</p>
            <p className="text-sm text-gray-300">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="card p-6 text-center">
        <div className="text-4xl mb-2">📊</div>
        <p className="text-gray-400">No trading data available</p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Trades',
      value: stats.totalTrades,
      icon: '📊',
      color: 'text-blue-500',
    },
    {
      label: 'Win Rate',
      value: `${stats.winRate.toFixed(1)}%`,
      icon: '🎯',
      color: stats.winRate >= 60 ? 'text-green-500' : 'text-yellow-500',
      subtext: `${stats.wins}W / ${stats.losses}L`,
    },
    {
      label: 'Total P&L',
      value: `${stats.totalPL >= 0 ? '+' : ''}${stats.totalPL.toFixed(4)} BNB`,
      icon: stats.totalPL >= 0 ? '📈' : '📉',
      color: stats.totalPL >= 0 ? 'text-green-500' : 'text-red-500',
    },
    {
      label: 'Avg P&L',
      value: `${stats.avgPL >= 0 ? '+' : ''}${stats.avgPL.toFixed(4)} BNB`,
      icon: '💰',
      color: stats.avgPL >= 0 ? 'text-green-500' : 'text-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <div key={index} className="card p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">{stat.label}</p>
            <span className="text-2xl">{stat.icon}</span>
          </div>
          <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          {stat.subtext && (
            <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
          )}
        </div>
      ))}
    </div>
  );
}
