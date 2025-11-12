'use client';

import { useState, useEffect } from 'react';
import { X, Brain, TrendingUp, TrendingDown, AlertCircle, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { useAccount, useWalletClient } from 'wagmi';

interface AIDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  marketQuestion: string;
  marketId?: string;
  outcomes: string[];
  currentPrices?: Record<string, number>;
}

interface MarketAnalysis {
  market_question: string;
  analysis: string;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  predicted_outcome: string;
  confidence: number;
  reasoning: string;
  sources: Array<{
    title: string;
    url: string;
    domain: string;
    snippet: string;
  }>;
  sentiment_score: number;
}

export default function AIDecisionModal({
  isOpen,
  onClose,
  marketQuestion,
  marketId,
  outcomes,
  currentPrices,
}: AIDecisionModalProps) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executingTrade, setExecutingTrade] = useState(false);
  const [tradeComplete, setTradeComplete] = useState(false);

  useEffect(() => {
    if (isOpen && !analysis) {
      analyzeMarket();
    }
  }, [isOpen]);

  const analyzeMarket = async () => {
    setLoading(true);
    setError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const AGENTS_URL = process.env.NEXT_PUBLIC_AGENTS_URL || 'http://localhost:8000';

      const response = await fetch(`${AGENTS_URL}/api/polymarket/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          market_question: marketQuestion,
          market_id: marketId,
          outcomes: outcomes,
          current_prices: currentPrices,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze market');
      }

      const data: MarketAnalysis = await response.json();
      setAnalysis(data);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze market');
    } finally {
      setLoading(false);
    }
  };

  const executeTrade = async () => {
    if (!analysis || !isConnected || !walletClient) {
      setError('Please connect your wallet first');
      return;
    }

    setExecutingTrade(true);
    setError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      // Determine trade parameters based on recommendation
      const side = analysis.recommendation === 'BUY' ? 'BUY' : 'SELL';
      const outcome = analysis.predicted_outcome;

      // Call backend to execute trade
      const response = await fetch(`${API_URL}/api/polymarket/market-${side.toLowerCase()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketId: marketId,
          outcome: outcome,
          amount: 10, // Default $10 trade
          userAddress: address,
        }),
      });

      if (!response.ok) {
        throw new Error('Trade execution failed');
      }

      const result = await response.json();
      console.log('Trade executed:', result);

      setTradeComplete(true);

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setTradeComplete(false);
        setAnalysis(null);
      }, 2000);
    } catch (err) {
      console.error('Trade execution error:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute trade');
    } finally {
      setExecutingTrade(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state
    setTimeout(() => {
      setAnalysis(null);
      setError(null);
      setTradeComplete(false);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Brain className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Market Analysis</h2>
              <p className="text-sm text-gray-400 mt-1">Powered by RAG + Web Search</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Market Question */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-1">Market Question</p>
            <p className="text-white font-medium">{marketQuestion}</p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
              <div className="text-center">
                <p className="text-white font-medium">Analyzing market...</p>
                <p className="text-sm text-gray-400 mt-1">
                  Searching web • Running sentiment analysis • Generating prediction
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">Analysis Failed</p>
                <p className="text-sm text-red-300 mt-1">{error}</p>
                <button
                  onClick={analyzeMarket}
                  className="mt-3 text-sm text-red-400 hover:text-red-300 underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Success State */}
          {tradeComplete && (
            <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-400 font-medium">Trade Executed Successfully!</p>
                <p className="text-sm text-green-300 mt-1">Your position has been opened.</p>
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {analysis && !loading && (
            <>
              {/* Prediction & Recommendation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Predicted Outcome */}
                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    {analysis.recommendation === 'BUY' ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : analysis.recommendation === 'SELL' ? (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                    )}
                    <span className="text-sm text-gray-400">Predicted Outcome</span>
                  </div>
                  <p className="text-2xl font-bold text-white mb-2">{analysis.predicted_outcome}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Confidence</span>
                    <span className="text-lg font-semibold text-purple-400">
                      {(analysis.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-2 bg-gray-800/50 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-400 h-full transition-all duration-500"
                      style={{ width: `${analysis.confidence * 100}%` }}
                    />
                  </div>
                </div>

                {/* Recommendation */}
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Brain className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-gray-400">AI Recommendation</span>
                  </div>
                  <p
                    className={`text-3xl font-bold mb-2 ${
                      analysis.recommendation === 'BUY'
                        ? 'text-green-400'
                        : analysis.recommendation === 'SELL'
                        ? 'text-red-400'
                        : 'text-yellow-400'
                    }`}
                  >
                    {analysis.recommendation}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Sentiment</span>
                    <span
                      className={`text-lg font-semibold ${
                        analysis.sentiment_score > 0.3
                          ? 'text-green-400'
                          : analysis.sentiment_score < -0.3
                          ? 'text-red-400'
                          : 'text-gray-400'
                      }`}
                    >
                      {analysis.sentiment_score > 0 ? '+' : ''}
                      {(analysis.sentiment_score * 100).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Analysis Summary */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Analysis Summary</h3>
                <p className="text-white leading-relaxed">{analysis.analysis}</p>
              </div>

              {/* Detailed Reasoning */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Reasoning</h3>
                <div className="text-white leading-relaxed whitespace-pre-line">
                  {analysis.reasoning}
                </div>
              </div>

              {/* Sources */}
              {analysis.sources && analysis.sources.length > 0 && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">
                    Sources ({analysis.sources.length})
                  </h3>
                  <div className="space-y-3">
                    {analysis.sources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-gray-700/50 hover:bg-gray-700 transition-colors rounded-lg p-3 group"
                      >
                        <div className="flex items-start justify-between space-x-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-purple-400 group-hover:text-purple-300">
                                {source.domain}
                              </span>
                              <ExternalLink className="w-3 h-3 text-gray-500" />
                            </div>
                            <p className="text-sm text-white font-medium mb-1 line-clamp-1">
                              {source.title}
                            </p>
                            <p className="text-xs text-gray-400 line-clamp-2">{source.snippet}</p>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Prices */}
              {currentPrices && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">Current Market Prices</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(currentPrices).map(([outcome, price]) => (
                      <div key={outcome} className="bg-gray-700/50 rounded-lg p-3">
                        <p className="text-sm text-gray-400 mb-1">{outcome}</p>
                        <p className="text-lg font-semibold text-white">{(price * 100).toFixed(1)}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {analysis && !loading && !tradeComplete && (
          <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 p-6 flex items-center justify-between">
            <div className="text-sm">
              <p className="text-gray-400">
                {!isConnected ? (
                  <span className="text-yellow-400">⚠️ Connect wallet to execute trade</span>
                ) : (
                  <span>AI recommends: <span className="font-semibold text-white">{analysis.recommendation}</span></span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeTrade}
                disabled={!isConnected || executingTrade || analysis.recommendation === 'HOLD'}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  analysis.recommendation === 'BUY'
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : analysis.recommendation === 'SELL'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                } disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
              >
                {executingTrade ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <span>Approve Trade</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
