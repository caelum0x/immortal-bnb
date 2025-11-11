/**
 * Multi-Chain Dashboard Component
 * Side-by-side view of DEX and Polymarket trading stats
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocketContext } from '../src/contexts/WebSocketContext';

interface ChainStats {
  totalTrades: number;
  successfulTrades: number;
  totalVolume: number;
  totalPnL: number;
  winRate: number;
  avgTradeSize: number;
  bestTrade: number;
  worstTrade: number;
}

interface MultiChainDashboardProps {
  apiUrl?: string;
}

export default function MultiChainDashboard({ apiUrl = 'http://localhost:3001' }: MultiChainDashboardProps) {
  const { latestTrade, isConnected } = useWebSocketContext();
  const [dexStats, setDexStats] = useState<ChainStats | null>(null);
  const [polymarketStats, setPolymarketStats] = useState<ChainStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Fetch DEX stats
        const dexResponse = await fetch(`${apiUrl}/api/stats`);
        if (dexResponse.ok) {
          const dexData = await dexResponse.json();
          setDexStats({
            totalTrades: dexData.totalTrades || 0,
            successfulTrades: dexData.successfulTrades || 0,
            totalVolume: dexData.totalVolume || 0,
            totalPnL: dexData.totalPnL || 0,
            winRate: dexData.winRate || 0,
            avgTradeSize: dexData.avgTradeSize || 0,
            bestTrade: dexData.bestTrade || 0,
            worstTrade: dexData.worstTrade || 0,
          });
        }

        // Fetch Polymarket stats
        const polyResponse = await fetch(`${apiUrl}/api/polymarket/stats`);
        if (polyResponse.ok) {
          const polyData = await polyResponse.json();
          setPolymarketStats({
            totalTrades: polyData.totalBets || 0,
            successfulTrades: polyData.winningBets || 0,
            totalVolume: polyData.totalVolume || 0,
            totalPnL: polyData.netProfit || 0,
            winRate: polyData.winRate || 0,
            avgTradeSize: polyData.avgBetSize || 0,
            bestTrade: polyData.biggestWin || 0,
            worstTrade: polyData.biggestLoss || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, [apiUrl]);

  // Calculate combined stats
  const combinedStats = {
    totalTrades: (dexStats?.totalTrades || 0) + (polymarketStats?.totalTrades || 0),
    successfulTrades: (dexStats?.successfulTrades || 0) + (polymarketStats?.successfulTrades || 0),
    totalPnL: (dexStats?.totalPnL || 0) + (polymarketStats?.totalPnL || 0),
    totalVolume: (dexStats?.totalVolume || 0) + (polymarketStats?.totalVolume || 0),
  };

  const formatCurrency = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const StatCard = ({ title, value, subtitle, color = 'blue', icon }: any) => (
    <div className={`bg-${color}-50 dark:bg-${color}-900/20 rounded-lg p-4 border border-${color}-200 dark:border-${color}-800`}>
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className={`text-xs font-medium text-${color}-600 dark:text-${color}-400 uppercase`}>
          {title}
        </span>
      </div>
      <p className={`text-2xl font-bold text-${color}-900 dark:text-${color}-100 mt-2`}>
        {value}
      </p>
      {subtitle && (
        <p className={`text-sm text-${color}-700 dark:text-${color}-300 mt-1`}>
          {subtitle}
        </p>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          📊 Multi-Chain Dashboard
        </h2>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Live Updates
          </span>
        </div>
      </div>

      {/* Combined Overview */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🌐 Combined Portfolio
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg p-4 text-white">
            <p className="text-sm opacity-90">Total P&L</p>
            <p className="text-3xl font-bold mt-2">
              ${formatCurrency(combinedStats.totalPnL)}
            </p>
            <p className="text-sm opacity-90 mt-1">
              {combinedStats.totalPnL >= 0 ? '📈 Profit' : '📉 Loss'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Trades</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {combinedStats.totalTrades}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              {combinedStats.successfulTrades} successful
            </p>
          </div>
          <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Volume</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              ${formatCurrency(combinedStats.totalVolume, 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-400">Win Rate</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {formatPercentage(
                combinedStats.totalTrades > 0
                  ? (combinedStats.successfulTrades / combinedStats.totalTrades) * 100
                  : 0
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DEX Stats */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🔷</span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              DEX Trading (PancakeSwap)
            </h3>
          </div>
          {dexStats ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Trades</span>
                <span className="font-semibold text-gray-900 dark:text-white">{dexStats.totalTrades}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Win Rate</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatPercentage(dexStats.winRate)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Volume</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(dexStats.totalVolume)} BNB
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Net P&L</span>
                <span className={`font-semibold ${
                  dexStats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {dexStats.totalPnL >= 0 ? '+' : ''}{formatCurrency(dexStats.totalPnL)} BNB
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg Trade Size</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(dexStats.avgTradeSize)} BNB
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Best Trade</span>
                <span className="font-semibold text-green-600">
                  +{formatCurrency(dexStats.bestTrade)} BNB
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Worst Trade</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(dexStats.worstTrade)} BNB
                </span>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No DEX trading data available
            </p>
          )}
        </div>

        {/* Polymarket Stats */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🎲</span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Polymarket Prediction Markets
            </h3>
          </div>
          {polymarketStats ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Bets</span>
                <span className="font-semibold text-gray-900 dark:text-white">{polymarketStats.totalTrades}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Win Rate</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatPercentage(polymarketStats.winRate)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Volume</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${formatCurrency(polymarketStats.totalVolume, 0)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Net P&L</span>
                <span className={`font-semibold ${
                  polymarketStats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {polymarketStats.totalPnL >= 0 ? '+' : ''}${formatCurrency(polymarketStats.totalPnL)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg Bet Size</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${formatCurrency(polymarketStats.avgTradeSize)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Biggest Win</span>
                <span className="font-semibold text-green-600">
                  +${formatCurrency(polymarketStats.bestTrade)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Biggest Loss</span>
                <span className="font-semibold text-red-600">
                  -${formatCurrency(Math.abs(polymarketStats.worstTrade))}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No Polymarket trading data available
            </p>
          )}
        </div>
      </div>

      {/* Latest Trade Alert */}
      {latestTrade && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm font-medium text-green-900 dark:text-green-200">
            ⚡ Latest Trade: {latestTrade.platform} - {latestTrade.outcome === 'success' ? '✅ Success' : '❌ Failed'}
            {latestTrade.pnl && ` - P&L: ${latestTrade.pnl >= 0 ? '+' : ''}${formatCurrency(latestTrade.pnl)}`}
          </p>
        </div>
      )}
    </div>
  );
}
