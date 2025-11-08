import { useEffect, useState } from 'react';
import api, { type CrossChainOpportunity } from '../services/api';

export default function CrossChainOpportunities() {
  const [opportunities, setOpportunities] = useState<CrossChainOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOpportunities() {
      try {
        setLoading(true);
        setError(null);
        const response = await api.getCrossChainOpportunities();
        setOpportunities(response.opportunities);
      } catch (err) {
        console.error('Error fetching cross-chain opportunities:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchOpportunities();
    // Refresh every 60 seconds (cross-chain opportunities change slower)
    const interval = setInterval(fetchOpportunities, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3">
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-red-500 mr-3">⚠️</div>
          <div>
            <h3 className="text-red-800 font-medium">Cross-Chain Error</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const topOpportunities = opportunities.slice(0, 5); // Show top 5

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">🌐 Cross-Chain Arbitrage</h3>
        <div className="text-sm text-gray-500">
          {opportunities.length} opportunities found
        </div>
      </div>

      {topOpportunities.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">🔍</div>
          <p className="text-gray-500">No arbitrage opportunities found</p>
          <p className="text-sm text-gray-400">The AI is continuously scanning for cross-chain price differences</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topOpportunities.map((opportunity) => (
            <div 
              key={opportunity.id} 
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <span className="font-medium text-gray-900">
                    {opportunity.tokenSymbol}
                  </span>
                  <div className="ml-2 flex items-center text-sm text-gray-500">
                    <span>{opportunity.sourceChain}</span>
                    <span className="mx-1">→</span>
                    <span>{opportunity.targetChain}</span>
                  </div>
                </div>
                <div className={`text-sm font-medium px-2 py-1 rounded ${
                  opportunity.profitPotential > 5 
                    ? 'bg-green-100 text-green-800'
                    : opportunity.profitPotential > 2
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  +{opportunity.profitPotential.toFixed(2)}%
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
                <div>
                  <span className="font-medium">Source Price:</span>
                  <div>${opportunity.sourcePrice.toFixed(6)}</div>
                </div>
                <div>
                  <span className="font-medium">Target Price:</span>
                  <div>${opportunity.targetPrice.toFixed(6)}</div>
                </div>
                <div>
                  <span className="font-medium">Risk Level:</span>
                  <div className={`inline-flex px-1 rounded text-xs ${
                    opportunity.riskLevel === 'LOW' 
                      ? 'bg-green-100 text-green-700'
                      : opportunity.riskLevel === 'MEDIUM'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {opportunity.riskLevel}
                  </div>
                </div>
              </div>

              <div className="mt-2 flex justify-between items-center text-xs">
                <span className="text-gray-500">
                  Confidence: {(opportunity.confidence * 100).toFixed(0)}%
                </span>
                <span className="text-gray-500">
                  Est. Time: {Math.round(opportunity.executionTime / 60)}min
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
