/**
 * Trading Stats Component
 * Displays overview of trading performance
 */

'use client';

import { useState, useEffect } from 'react';
import { getTradingStats, safeApiCall, mockStats, TradingStats as StatsType } from '@/lib/api';

export default function TradingStats() {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    const { data } = await safeApiCall(() => getTradingStats(), mockStats);
    setStats(data);
    setIsLoading(false);
  };

  if (isLoading) {
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

  if (!stats) return null;

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
