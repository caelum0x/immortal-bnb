/**
 * Polymarket Prediction Markets Dashboard
 * Shows trending markets, AI analysis, positions, and cross-platform opportunities
 */

'use client';

import { useState, useEffect } from 'react';
import {
  getPolymarketMarkets,
  getPolymarketBalance,
  getPolymarketPositions,
  getPolymarketOrders,
  getCrossPlatformOpportunities,
  analyzePolymarketMarket,
  PolymarketMarket,
  PolymarketBalance,
  PolymarketPosition,
  PolymarketOrder,
  CrossPlatformOpportunity,
  AIMarketAnalysis,
} from '@/lib/api';
import { usePolling } from '@/hooks/usePolling';

interface MarketWithAnalysis extends PolymarketMarket {
  analysis?: AIMarketAnalysis;
  analyzing?: boolean;
}

export default function PolymarketDashboard() {
  const [markets, setMarkets] = useState<MarketWithAnalysis[]>([]);
  const [balance, setBalance] = useState<PolymarketBalance | null>(null);
  const [positions, setPositions] = useState<PolymarketPosition[]>([]);
  const [orders, setOrders] = useState<PolymarketOrder[]>([]);
  const [opportunities, setOpportunities] = useState<CrossPlatformOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  // Poll for updates every 30 seconds
  usePolling(async () => {
    await loadAllData();
  }, 30000);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [marketsData, balanceData, positionsData, ordersData, oppsData] = await Promise.all([
        getPolymarketMarkets(10),
        getPolymarketBalance(),
        getPolymarketPositions(),
        getPolymarketOrders(),
        getCrossPlatformOpportunities(),
      ]);

      setMarkets(marketsData.map(m => ({ ...m, analyzing: false })));
      setBalance(balanceData);
      setPositions(positionsData);
      setOrders(ordersData);
      setOpportunities(oppsData);
    } catch (err: any) {
      console.error('Failed to load Polymarket data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const analyzeMarket = async (market: PolymarketMarket) => {
    try {
      // Mark as analyzing
      setMarkets(prev =>
        prev.map(m => (m.id === market.id ? { ...m, analyzing: true } : m))
      );

      const result = await analyzePolymarketMarket(market.id, market.question);

      // Update with analysis
      setMarkets(prev =>
        prev.map(m =>
          m.id === market.id
            ? { ...m, analysis: result.analysis, analyzing: false }
            : m
        )
      );

      setSelectedMarket(market.id);
    } catch (err: any) {
      console.error('Failed to analyze market:', err);
      setMarkets(prev =>
        prev.map(m => (m.id === market.id ? { ...m, analyzing: false } : m))
      );
      setError(err.message || 'Failed to analyze market');
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'STRONG_BUY':
        return 'text-green-400 bg-green-900/30';
      case 'BUY':
        return 'text-green-300 bg-green-900/20';
      case 'HOLD':
        return 'text-yellow-300 bg-yellow-900/20';
      case 'SELL':
        return 'text-red-300 bg-red-900/20';
      case 'STRONG_SELL':
        return 'text-red-400 bg-red-900/30';
      default:
        return 'text-gray-300 bg-gray-900/20';
    }
  };

  const getRiskLevelColor = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'text-green-400';
      case 'MEDIUM':
        return 'text-yellow-400';
      case 'HIGH':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (loading && markets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-4xl mb-4">🔮</div>
          <p className="text-gray-400">Loading Polymarket data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">🔮 Polymarket Prediction Markets</h2>
          <p className="text-gray-400 mt-1">AI-powered market analysis on Polygon</p>
        </div>
        <button
          onClick={loadAllData}
          className="btn-secondary"
          disabled={loading}
        >
          {loading ? '⏳ Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-xl mr-3">❌</span>
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Balance Card */}
      {balance && (
        <div className="card p-6">
          <h3 className="text-xl font-bold mb-4">💰 Wallet Balance</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">MATIC</p>
              <p className="text-2xl font-bold">{balance.matic.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">USDC</p>
              <p className="text-2xl font-bold">${balance.usdc.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Trending Markets with AI Analysis */}
      <div className="card p-6">
        <h3 className="text-xl font-bold mb-4">📈 Trending Markets</h3>
        <div className="space-y-3">
          {markets.map((market) => (
            <div
              key={market.id}
              className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/70 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-1">{market.question}</h4>
                  <div className="flex gap-4 text-sm text-gray-400">
                    {market.volume && (
                      <span>Volume: ${parseFloat(market.volume).toLocaleString()}</span>
                    )}
                    {market.liquidity && (
                      <span>Liquidity: ${parseFloat(market.liquidity).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => analyzeMarket(market)}
                  disabled={market.analyzing}
                  className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
                >
                  {market.analyzing ? '🤖 Analyzing...' : '🧠 AI Analysis'}
                </button>
              </div>

              {/* AI Analysis Results */}
              {market.analysis && selectedMarket === market.id && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-400">Recommendation</p>
                      <p className={`font-bold px-2 py-1 rounded text-sm ${getRecommendationColor(market.analysis.recommendation)}`}>
                        {market.analysis.recommendation}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Confidence</p>
                      <p className="font-bold text-sm">
                        {(market.analysis.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Risk Level</p>
                      <p className={`font-bold text-sm ${getRiskLevelColor(market.analysis.riskLevel)}`}>
                        {market.analysis.riskLevel}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Suggested Price</p>
                      <p className="font-bold text-sm">
                        {(market.analysis.suggestedPrice * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded p-3">
                    <p className="text-sm font-semibold mb-1">💡 AI Reasoning:</p>
                    <p className="text-sm text-gray-300">{market.analysis.reasoning}</p>
                  </div>
                  {market.analysis.suggestedSize > 0 && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-400">Suggested Position: </span>
                      <span className="font-bold">
                        ${market.analysis.suggestedSize.toFixed(2)} USDC
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cross-Platform Opportunities */}
      {opportunities.length > 0 && (
        <div className="card p-6">
          <h3 className="text-xl font-bold mb-4">🌐 Cross-Platform Opportunities</h3>
          <div className="space-y-3">
            {opportunities.slice(0, 5).map((opp, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-4 border border-blue-500/30"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-1 bg-blue-500/20 rounded text-xs font-bold">
                        {opp.type}
                      </span>
                      <span className={`text-sm ${getRiskLevelColor(opp.riskLevel)}`}>
                        {opp.riskLevel} Risk
                      </span>
                    </div>
                    <p className="text-sm mb-1">{opp.description}</p>
                    <p className="text-xs text-gray-400">{opp.action}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Expected Profit</p>
                    <p className="text-xl font-bold text-green-400">
                      +{opp.expectedProfit.toFixed(2)}%
                    </p>
                    <p className="text-xs text-gray-400">
                      {(opp.confidence * 100).toFixed(0)}% confident
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Positions */}
      {positions.length > 0 && (
        <div className="card p-6">
          <h3 className="text-xl font-bold mb-4">📊 Active Positions</h3>
          <div className="space-y-3">
            {positions.map((pos, idx) => (
              <div key={idx} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{pos.marketQuestion}</h4>
                    <p className="text-sm text-gray-400">Outcome: {pos.outcome}</p>
                    <p className="text-sm">
                      Size: {pos.size} @ {(pos.avgPrice * 100).toFixed(1)}%
                    </p>
                  </div>
                  {pos.pnl !== undefined && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">P&L</p>
                      <p className={`text-lg font-bold ${pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open Orders */}
      {orders.length > 0 && (
        <div className="card p-6">
          <h3 className="text-xl font-bold mb-4">📝 Open Orders</h3>
          <div className="space-y-2">
            {orders.map((order) => (
              <div key={order.id} className="bg-gray-800/50 rounded p-3 text-sm">
                <div className="flex justify-between">
                  <div>
                    <span className={order.side === 'BUY' ? 'text-green-400' : 'text-red-400'}>
                      {order.side}
                    </span>
                    {' '}
                    {order.size} @ {(order.price * 100).toFixed(1)}%
                  </div>
                  <div className="text-gray-400">
                    Filled: {order.filled}/{order.size}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty States */}
      {positions.length === 0 && orders.length === 0 && !loading && (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-gray-400">No active positions or orders</p>
          <p className="text-sm text-gray-500 mt-1">
            Analyze markets above to find trading opportunities
          </p>
        </div>
      )}
    </div>
  );
}
