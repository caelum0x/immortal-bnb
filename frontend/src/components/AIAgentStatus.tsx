import { useEffect, useState } from 'react';
import api, { type AIStatus } from '../services/api';

export default function AIAgentStatus() {
  const [aiStatus, setAIStatus] = useState<AIStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAIStatus() {
      try {
        setLoading(true);
        setError(null);
        const status = await api.getAIStatus();
        setAIStatus(status);
      } catch (err) {
        console.error('Error fetching AI status:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchAIStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAIStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
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
            <h3 className="text-red-800 font-medium">AI Agent Error</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!aiStatus) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-500">No AI agent data available</p>
      </div>
    );
  }

  const { personality, memoryStats, successRate, capabilities } = aiStatus;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">🤖 Immortal AI Agent</h3>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm text-green-600 font-medium">Active</span>
        </div>
      </div>

      {/* Success Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">
            {(successRate * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-blue-600">Success Rate</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {memoryStats.totalMemories}
          </div>
          <div className="text-sm text-green-600">Memories Stored</div>
        </div>
      </div>

      {/* AI Personality */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">AI Personality</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Risk Tolerance</span>
            <div className="flex items-center">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${personality.riskTolerance * 100}%` }}
                ></div>
              </div>
              <span className="ml-2 text-xs text-gray-500">
                {(personality.riskTolerance * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Aggressiveness</span>
            <div className="flex items-center">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${personality.aggressiveness * 100}%` }}
                ></div>
              </div>
              <span className="ml-2 text-xs text-gray-500">
                {(personality.aggressiveness * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Learning Rate</span>
            <div className="flex items-center">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${personality.learningRate * 100}%` }}
                ></div>
              </div>
              <span className="ml-2 text-xs text-gray-500">
                {(personality.learningRate * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Capabilities */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">🧬 AI Capabilities</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className={`flex items-center ${capabilities.decisionMaking ? 'text-green-600' : 'text-gray-400'}`}>
            <span className="mr-1">{capabilities.decisionMaking ? '✅' : '❌'}</span>
            Decision Making
          </div>
          <div className={`flex items-center ${capabilities.memoryLearning ? 'text-green-600' : 'text-gray-400'}`}>
            <span className="mr-1">{capabilities.memoryLearning ? '✅' : '❌'}</span>
            Memory Learning
          </div>
          <div className={`flex items-center ${capabilities.crossChainArbitrage ? 'text-green-600' : 'text-gray-400'}`}>
            <span className="mr-1">{capabilities.crossChainArbitrage ? '✅' : '❌'}</span>
            Cross-Chain Arb
          </div>
          <div className={`flex items-center ${capabilities.strategyEvolution ? 'text-green-600' : 'text-gray-400'}`}>
            <span className="mr-1">{capabilities.strategyEvolution ? '✅' : '❌'}</span>
            Strategy Evolution
          </div>
        </div>
      </div>
    </div>
  );
}
