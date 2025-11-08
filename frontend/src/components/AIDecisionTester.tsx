import { useState } from 'react';
import api, { type AIDecision } from '../services/api';

export default function AIDecisionTester() {
  const [tokenAddress, setTokenAddress] = useState('');
  const [availableAmount, setAvailableAmount] = useState(1.0);
  const [decision, setDecision] = useState<AIDecision | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTestDecision = async () => {
    if (!tokenAddress.trim()) {
      setError('Please enter a token address');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setDecision(null);

      const response = await api.getAIDecision(tokenAddress.trim(), availableAmount);
      setDecision(response.decision);
    } catch (err) {
      console.error('Error getting AI decision:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY': return 'text-green-600 bg-green-100';
      case 'SELL': return 'text-red-600 bg-red-100';
      case 'HOLD': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HIGH': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🧠 AI Decision Tester</h3>
      
      {/* Input Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Token Contract Address
          </label>
          <input
            type="text"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Available Amount (BNB)
          </label>
          <input
            type="number"
            value={availableAmount}
            onChange={(e) => setAvailableAmount(parseFloat(e.target.value) || 1.0)}
            min="0.01"
            max="10"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <button
          onClick={handleTestDecision}
          disabled={loading || !tokenAddress.trim()}
          className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${
            loading || !tokenAddress.trim()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? '🤖 Analyzing...' : '🔮 Get AI Decision'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Decision Display */}
      {decision && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getActionColor(decision.action)}`}>
                {decision.action}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(decision.riskLevel)}`}>
                {decision.riskLevel} RISK
              </span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                {(decision.confidence * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">Confidence</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm font-medium text-gray-700">Recommended Amount:</span>
              <div className="text-lg font-semibold text-blue-600">
                {decision.amount.toFixed(4)} BNB
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Strategy:</span>
              <div className="text-sm text-gray-600 capitalize">
                {decision.strategy}
              </div>
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700">AI Reasoning:</span>
            <div className="mt-2 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">{decision.reasoning}</p>
            </div>
          </div>

          {/* Confidence Bar */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500">Decision Confidence</span>
              <span className="text-xs text-gray-500">{(decision.confidence * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  decision.confidence > 0.7 ? 'bg-green-500' :
                  decision.confidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${decision.confidence * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          The AI analyzes market data, past memories, and strategy evolution to make decisions
        </p>
      </div>
    </div>
  );
}
