import { useEffect, useState } from 'react';
import api, { type StrategyMetrics } from '../services/api';

export default function StrategyEvolution() {
  const [metrics, setMetrics] = useState<StrategyMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEvolving, setIsEvolving] = useState(false);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        setError(null);
        const response = await api.getStrategyMetrics();
        setMetrics(response.metrics);
      } catch (err) {
        console.error('Error fetching strategy metrics:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
    // Refresh every 2 minutes
    const interval = setInterval(fetchMetrics, 120000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerEvolution = async () => {
    try {
      setIsEvolving(true);
      await api.triggerStrategyEvolution();
      
      // Refresh metrics after evolution
      setTimeout(async () => {
        const response = await api.getStrategyMetrics();
        setMetrics(response.metrics);
        setIsEvolving(false);
      }, 3000);
    } catch (err) {
      console.error('Error triggering evolution:', err);
      setError('Failed to trigger strategy evolution');
      setIsEvolving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-red-500 mr-3">⚠️</div>
          <div>
            <h3 className="text-red-800 font-medium">Strategy Engine Error</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">🧬 Strategy Evolution</h3>
        <button
          onClick={handleTriggerEvolution}
          disabled={isEvolving}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            isEvolving 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {isEvolving ? '🧬 Evolving...' : '🚀 Evolve Now'}
        </button>
      </div>

      {metrics ? (
        <>
          {/* Evolution Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {metrics.generation}
              </div>
              <div className="text-sm text-purple-600">Generation</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {metrics.totalStrategies}
              </div>
              <div className="text-sm text-green-600">Active Strategies</div>
            </div>
          </div>

          {/* Fitness Progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Strategy Fitness</span>
              <span className="text-sm text-gray-500">
                {(metrics.avgFitness * 100).toFixed(1)}% avg
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="flex h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-green-500"
                  style={{ width: `${Math.min(metrics.avgFitness * 100, 100)}%` }}
                ></div>
                <div 
                  className="bg-green-600"
                  style={{ width: `${Math.min((metrics.bestFitness - metrics.avgFitness) * 100, 100 - metrics.avgFitness * 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Poor (0%)</span>
              <span>Best: {(metrics.bestFitness * 100).toFixed(1)}%</span>
              <span>Excellent (100%)</span>
            </div>
          </div>

          {/* Evolution History */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">📈 Evolution History</h4>
            {metrics.evolutionHistory && metrics.evolutionHistory.length > 0 ? (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {metrics.evolutionHistory.slice(-5).map((entry: any, index: number) => (
                  <div key={index} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded">
                    <span>Gen {entry.generation || index + 1}</span>
                    <span className="text-green-600">
                      Fitness: {((entry.fitness || 0.5) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 text-sm py-4">
                Evolution history will appear as strategies adapt
              </div>
            )}
          </div>

          {/* Status Indicator */}
          <div className="mt-4 flex items-center text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-green-600">Strategies actively evolving based on market performance</span>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">🧬</div>
          <p className="text-gray-500">Strategy evolution data loading...</p>
        </div>
      )}

      {error && (
        <div className="mt-4 text-center text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
