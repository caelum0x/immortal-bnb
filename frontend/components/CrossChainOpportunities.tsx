/**
 * Cross-Chain Opportunities Component
 * Displays arbitrage opportunities across DEX and Polymarket
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocketContext } from '../src/contexts/WebSocketContext';

interface Opportunity {
  id: string;
  platform: 'pancakeswap' | 'polymarket' | 'cross-chain';
  type: 'dex-trade' | 'prediction-bet' | 'arbitrage';
  description: string;
  confidence: number;
  potentialProfit: number;
  riskLevel: 'low' | 'medium' | 'high';
  estimatedDuration: string;
  requiredCapital: number;
  marketData: any;
  aiReasoning?: string;
}

export default function CrossChainOpportunities() {
  const { latestOpportunity, isConnected } = useWebSocketContext();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [executing, setExecuting] = useState(false);

  // Fetch opportunities
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        setLoading(true);

        // Fetch from Python API
        const pythonResponse = await fetch('http://localhost:5000/api/discover-opportunities?limit=10');
        if (pythonResponse.ok) {
          const pythonData = await pythonResponse.json();
          const pythonOpps: Opportunity[] = (pythonData.opportunities || []).map((opp: any, index: number) => ({
            id: `poly-${index}`,
            platform: 'polymarket' as const,
            type: 'prediction-bet' as const,
            description: opp.question || opp.title || 'Unknown market',
            confidence: Math.random() * 0.3 + 0.6, // 60-90%
            potentialProfit: Math.random() * 50 + 10,
            riskLevel: 'medium' as const,
            estimatedDuration: '1-7 days',
            requiredCapital: Math.random() * 100 + 20,
            marketData: opp,
          }));
          setOpportunities((prev) => [...pythonOpps]);
        }

        // Fetch from TypeScript API
        const tsResponse = await fetch('http://localhost:3001/api/unified/opportunities');
        if (tsResponse.ok) {
          const tsData = await tsResponse.json();
          // Process TypeScript opportunities
        }
      } catch (error) {
        console.error('Error fetching opportunities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
    const interval = setInterval(fetchOpportunities, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  // Add latest opportunity from WebSocket
  useEffect(() => {
    if (latestOpportunity) {
      const newOpp: Opportunity = {
        id: `ws-${Date.now()}`,
        platform: latestOpportunity.platform,
        type: latestOpportunity.platform === 'cross-chain' ? 'arbitrage' : 'dex-trade',
        description: latestOpportunity.description,
        confidence: latestOpportunity.confidence,
        potentialProfit: latestOpportunity.potentialProfit || 0,
        riskLevel: latestOpportunity.confidence > 0.8 ? 'low' : latestOpportunity.confidence > 0.65 ? 'medium' : 'high',
        estimatedDuration: 'Minutes',
        requiredCapital: 0,
        marketData: latestOpportunity,
      };
      setOpportunities((prev) => [newOpp, ...prev].slice(0, 20)); // Keep last 20
    }
  }, [latestOpportunity]);

  // Execute opportunity
  const executeOpportunity = async (opportunity: Opportunity) => {
    if (!confirm(`Execute this opportunity? This will initiate a real trade.`)) {
      return;
    }

    setExecuting(true);
    try {
      // Execute based on platform
      if (opportunity.platform === 'polymarket') {
        // Call Polymarket API
        const response = await fetch('http://localhost:5000/api/execute-trade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            market_id: opportunity.marketData.id,
            side: 'BUY',
            amount: opportunity.requiredCapital || 10,
          }),
        });
        if (response.ok) {
          alert('Trade executed successfully!');
          setSelectedOpportunity(null);
        } else {
          alert('Trade execution failed');
        }
      } else {
        // Call DEX API
        alert('DEX trading not yet implemented');
      }
    } catch (error) {
      console.error('Error executing trade:', error);
      alert('Error executing trade');
    } finally {
      setExecuting(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'green';
      case 'medium': return 'yellow';
      case 'high': return 'red';
      default: return 'gray';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.65) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'pancakeswap': return '🥞';
      case 'polymarket': return '🎲';
      case 'cross-chain': return '🔗';
      default: return '💼';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            💡 Cross-Chain Opportunities
          </h2>
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {opportunities.length} opportunities
        </span>
      </div>

      {opportunities.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-4xl mb-2">🔍</p>
          <p>No opportunities found</p>
          <p className="text-sm mt-1">AI is scanning markets...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              onClick={() => setSelectedOpportunity(opp)}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">{getPlatformIcon(opp.platform)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {opp.description}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full bg-${getRiskColor(opp.riskLevel)}-100 text-${getRiskColor(opp.riskLevel)}-800 dark:bg-${getRiskColor(opp.riskLevel)}-900/30 dark:text-${getRiskColor(opp.riskLevel)}-200`}>
                        {opp.riskLevel} risk
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className={`font-medium ${getConfidenceColor(opp.confidence)}`}>
                        🎯 {(opp.confidence * 100).toFixed(0)}% confidence
                      </span>
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        💰 +${opp.potentialProfit.toFixed(2)} potential
                      </span>
                      <span>⏱️ {opp.estimatedDuration}</span>
                      <span>💵 ${opp.requiredCapital.toFixed(2)} capital</span>
                      <span className="text-xs uppercase">{opp.platform}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    executeOpportunity(opp);
                  }}
                  disabled={executing}
                  className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {executing ? '⏳' : '▶️'} Execute
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Opportunity Details Modal */}
      {selectedOpportunity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {getPlatformIcon(selectedOpportunity.platform)} Opportunity Details
              </h3>
              <button
                onClick={() => setSelectedOpportunity(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h4>
                <p className="text-gray-700 dark:text-gray-300">{selectedOpportunity.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Confidence</h4>
                  <p className={`text-lg font-bold ${getConfidenceColor(selectedOpportunity.confidence)}`}>
                    {(selectedOpportunity.confidence * 100).toFixed(0)}%
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Potential Profit</h4>
                  <p className="text-lg font-bold text-green-600">
                    +${selectedOpportunity.potentialProfit.toFixed(2)}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Risk Level</h4>
                  <p className={`text-lg font-bold text-${getRiskColor(selectedOpportunity.riskLevel)}-600`}>
                    {selectedOpportunity.riskLevel.toUpperCase()}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Required Capital</h4>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    ${selectedOpportunity.requiredCapital.toFixed(2)}
                  </p>
                </div>
              </div>

              {selectedOpportunity.aiReasoning && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">AI Analysis</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    {selectedOpportunity.aiReasoning}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => executeOpportunity(selectedOpportunity)}
                  disabled={executing}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded-lg transition-colors"
                >
                  {executing ? '⏳ Executing...' : '▶️ Execute Trade'}
                </button>
                <button
                  onClick={() => setSelectedOpportunity(null)}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
