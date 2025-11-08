/**
 * Memories View Component
 * Displays trading memories stored on BNB Greenfield
 */

'use client';

import { useState, useEffect } from 'react';
import { getMemories, safeApiCall, mockMemories, TradeMemory } from '@/lib/api';
import { format } from 'date-fns';

export default function MemoriesView() {
  const [memories, setMemories] = useState<TradeMemory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'profit' | 'loss' | 'pending'>('all');

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    setIsLoading(true);
    const { data } = await safeApiCall(() => getMemories(50), mockMemories);
    // Sort by timestamp descending (most recent first)
    const sorted = data.sort((a, b) => b.timestamp - a.timestamp);
    setMemories(sorted);
    setIsLoading(false);
  };

  const filteredMemories = memories.filter((memory) => {
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

  if (isLoading) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">🧠 Trading Memories</h2>
            <p className="text-gray-400">
              Immortal memory stored on BNB Greenfield - {memories.length} total
            </p>
          </div>
          <button
            onClick={loadMemories}
            className="btn-secondary"
            disabled={isLoading}
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
          {filteredMemories.map((memory) => (
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
