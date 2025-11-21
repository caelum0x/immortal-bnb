'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import useWebSocket from '@/lib/useWebSocket';

interface Trade {
  id: string;
  timestamp: number;
  type: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  amountOut: number;
  profitLoss?: number;
  outcome?: string;
}

export default function TradingHistory() {
  const { lastTrade } = useWebSocket();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrades();
  }, []);

  // Add new trade from WebSocket
  useEffect(() => {
    if (lastTrade) {
      setTrades((prev) => [lastTrade as any, ...prev].slice(0, 10));
    }
  }, [lastTrade]);

  const fetchTrades = async () => {
    try {
      const data = await api.getTradingHistory(10);
      // Map backend data to component structure
      const mappedTrades = (data.trades || []).map((trade: any) => ({
        id: trade.id,
        timestamp: trade.timestamp,
        type: trade.action,
        tokenIn: trade.action === 'buy' ? 'BNB' : trade.tokenSymbol,
        tokenOut: trade.action === 'buy' ? trade.tokenSymbol : 'BNB',
        amountIn: trade.amount,
        amountOut: trade.amount * trade.price,
        profitLoss: trade.profitLoss,
        outcome: trade.status,
      }));
      setTrades(mappedTrades);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trades');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl backdrop-blur-xl" />

      <div className="relative bg-slate-800/50 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-xl">📈</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Recent Trades</h2>
              <p className="text-xs text-slate-400">Last 10 transactions</p>
            </div>
          </div>
          <button
            onClick={fetchTrades}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">⚠ {error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-slate-900/50 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : trades.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-slate-400 mb-2">No trades yet</p>
            <p className="text-sm text-slate-500">Trades will appear here once the bot starts trading</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trades.map((trade, index) => (
              <div
                key={trade.id || index}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-700 hover:border-indigo-500/50 rounded-xl p-4 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        trade.outcome === 'profit'
                          ? 'bg-green-500/20 text-green-400'
                          : trade.outcome === 'loss'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {trade.outcome === 'profit' ? '↗' : trade.outcome === 'loss' ? '↘' : '→'}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {trade.tokenIn} → {trade.tokenOut}
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(trade.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {trade.profitLoss !== undefined && (
                      <div className={`text-sm font-bold ${
                        trade.profitLoss > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {trade.profitLoss > 0 ? '+' : ''}{trade.profitLoss.toFixed(4)} BNB
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <span>In:</span>
                      <span className="text-white font-medium">{trade.amountIn.toFixed(4)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Out:</span>
                      <span className="text-white font-medium">{trade.amountOut.toFixed(4)}</span>
                    </div>
                    <div className={`ml-auto px-2 py-1 rounded text-xs font-bold ${
                      trade.outcome === 'profit'
                        ? 'bg-green-500/20 text-green-400'
                        : trade.outcome === 'loss'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {trade.outcome || 'pending'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Button */}
        {trades.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => window.location.href = '/trades'}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all"
            >
              View All Trades →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
