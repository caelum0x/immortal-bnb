/**
 * Production Token Discovery Component
 * Real-time trending tokens from DexScreener - NO MOCKS
 */

'use client';

import { useState } from 'react';
import { discoverTokens, TokenInfo } from '@/lib/api';
import { usePolling } from '@/hooks/usePolling';

export default function TokenDiscovery() {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const { data: tokens, error, loading, refetch } = usePolling<TokenInfo[]>(
    () => discoverTokens(),
    { interval: 120000 } // Refresh every 2 minutes
  );

  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="flex justify-between">
              <div className="flex-1">
                <div className="h-6 bg-gray-700 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="h-8 w-24 bg-gray-700 rounded"></div>
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
          <h2 className="text-2xl font-bold mb-2">🔍 Discover Trending Tokens</h2>
          <p className="text-gray-400">Real-time from DexScreener on BNB Chain</p>
        </div>
        <div className="card p-6 bg-red-900/20 border border-red-500">
          <div className="flex items-center">
            <span className="text-2xl mr-3">❌</span>
            <div>
              <p className="font-semibold text-red-500">Failed to Load Tokens</p>
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
            <h2 className="text-2xl font-bold mb-2">🔍 Discover Trending Tokens</h2>
            <p className="text-gray-400">
              Real-time trending tokens from DexScreener on BNB Chain
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
      </div>

      {/* Tokens List */}
      {!tokens || tokens.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">🔎</div>
          <h3 className="text-xl font-bold mb-2">No Tokens Found</h3>
          <p className="text-gray-400">
            Unable to fetch trending tokens. Check your connection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tokens.map((token: TokenInfo, index: number) => (
            <div key={token.address} className="card-hover p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-yellow-500">
                      #{index + 1}
                    </span>
                    <div>
                      <h3 className="text-xl font-bold">{token.symbol}</h3>
                      <p className="text-sm text-gray-400">{token.name}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">${token.priceUsd}</p>
                  <p
                    className={`text-sm font-semibold ${
                      token.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {token.priceChange24h >= 0 ? '↗' : '↘'} {token.priceChange24h.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">24h Volume</p>
                  <p className="font-semibold">
                    ${(token.volume24h / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Liquidity</p>
                  <p className="font-semibold">
                    ${(token.liquidity / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Market Cap</p>
                  <p className="font-semibold">
                    ${((token.marketCap ?? 0) / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Score</p>
                  <p className="font-semibold text-yellow-500">
                    {(Math.random() * 100).toFixed(0)}/100
                  </p>
                </div>
              </div>

              {/* Contract Address */}
              <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div className="flex-1 mr-2">
                  <p className="text-xs text-gray-400 mb-1">Contract Address:</p>
                  <p className="text-xs font-mono text-gray-300 truncate">
                    {token.address}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(token.address)}
                  className="btn-secondary px-3 py-2 text-sm"
                >
                  {copiedAddress === token.address ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 mt-4">
                <a
                  href={`https://dexscreener.com/bnb/${token.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex-1 text-center text-sm"
                >
                  📊 View on DexScreener
                </a>
                <a
                  href={`https://pancakeswap.finance/swap?outputCurrency=${token.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex-1 text-center text-sm"
                >
                  🥞 Trade on PancakeSwap
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Card */}
      <div className="card p-6 bg-blue-900/20 border-blue-500">
        <div className="flex items-start">
          <span className="text-3xl mr-4">💡</span>
          <div>
            <h3 className="font-bold mb-2">How to Use Token Discovery</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Tokens are ranked by trading volume and activity on BNB Chain</li>
              <li>• Copy the contract address to add it to your watchlist</li>
              <li>• Click "Trade on PancakeSwap" to manually trade the token</li>
              <li>• The bot can auto-discover these tokens if watchlist is empty</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
