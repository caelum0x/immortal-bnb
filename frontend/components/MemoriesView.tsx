/**
 * Production Memories View Component
 * Displays trading memories from BNB Greenfield - NO MOCKS
 */

'use client';

import { useState } from 'react';
import { getMemories, TradeMemory } from '@/lib/api';
import { usePolling } from '@/hooks/usePolling';
import { format } from 'date-fns';

export default function MemoriesView() {
  const [filter, setFilter] = useState<'all' | 'profit' | 'loss' | 'pending'>('all');

  const { data: memories, error, loading, refetch } = usePolling<TradeMemory[]>(
    () => getMemories(50),
    { interval: 60000 } // Refresh every minute
  );

  // Ensure memories is always an array
  const safeMemories = Array.isArray(memories) ? memories : [];
  
  const filteredMemories = safeMemories
    .filter((memory: TradeMemory) => memory && typeof memory === 'object') // Filter out invalid entries
    .sort((a: TradeMemory, b: TradeMemory) => (b?.timestamp || 0) - (a?.timestamp || 0))
    .filter((memory: TradeMemory) => {
      if (filter === 'all') return true;
      return memory.outcome === filter;
    });

  const getOutcomeBadge = (outcome: TradeMemory['outcome']) => {
    switch (outcome) {
      case 'profit':
        return <span className="badge-success">✓ Profit</span>;
      case 'loss':
        return <span className="badge-error">✗ Loss</span>;
      case 'pending':
        return <span className="badge-warning">⏳ Pending</span>;
      default:
        return <span className="badge-info">{outcome}</span>;
    }
  };

  const getActionBadge = (action: 'buy' | 'sell') => {
    return action === 'buy' ? (
      <span className="badge-success">📈 BUY</span>
    ) : (
      <span className="badge-error">📉 SELL</span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="card p-6">
          <h2 className="text-2xl font-bold mb-2">🧠 Trading Memories</h2>
          <p className="text-gray-400">Immortal memory stored on BNB Greenfield</p>
        </div>
        <div className="card p-6 bg-red-900/20 border border-red-500">
          <div className="flex items-center">
            <span className="text-2xl mr-3">❌</span>
            <div>
              <p className="font-semibold text-red-500">Failed to Load Memories</p>
              <p className="text-sm text-gray-300">{error.message}</p>
              <button onClick={refetch} className="btn-secondary mt-3 text-sm">
                🔄 Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">🧠 Trading Memories</h2>
            <p className="text-gray-400">
              Immortal memory stored on BNB Greenfield - {safeMemories.length} total
            </p>
          </div>
          <button
            onClick={refetch}
            className="btn-secondary"
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mt-4">
          {(['all', 'profit', 'loss', 'pending'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === f
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Memories List */}
      {filteredMemories.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">💭</div>
          <h3 className="text-xl font-bold mb-2">No Memories Yet</h3>
          <p className="text-gray-400">
            Start trading to create immortal memories on BNB Greenfield
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMemories.map((memory: TradeMemory) => (
            <div key={memory.id} className="card-hover p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-xl font-bold">{memory.tokenSymbol}</h3>
                    {getActionBadge(memory.action)}
                    {getOutcomeBadge(memory.outcome)}
                  </div>
                  <p className="text-sm text-gray-400">
                    {format(new Date(memory.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Amount</p>
                  <p className="text-lg font-bold">{memory.amount} BNB</p>
                  {memory.profitLoss !== undefined && (
                    <p
                      className={`text-sm font-semibold ${
                        memory.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {memory.profitLoss >= 0 ? '+' : ''}
                      {memory.profitLoss.toFixed(4)} BNB
                    </p>
                  )}
                </div>
              </div>

              {/* AI Reasoning */}
              <div className="mb-4 p-4 bg-gray-700/50 rounded-lg">
                <p className="text-sm font-semibold text-yellow-500 mb-1">🤖 AI Reasoning:</p>
                <p className="text-sm text-gray-300">{memory.aiReasoning}</p>
              </div>

              {/* Market Conditions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Entry Price</p>
                  <p className="font-semibold">${memory.entryPrice.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-gray-400">24h Volume</p>
                  <p className="font-semibold">
                    ${(memory.marketConditions.volume24h / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Liquidity</p>
                  <p className="font-semibold">
                    ${(memory.marketConditions.liquidity / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Buy/Sell Pressure</p>
                  <p className="font-semibold">
                    {memory.marketConditions.buySellPressure.toFixed(3)}
                  </p>
                </div>
              </div>

              {/* Token Address */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-400">Token Address:</p>
                <p className="text-xs font-mono text-gray-300 break-all">
                  {memory.tokenAddress}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
