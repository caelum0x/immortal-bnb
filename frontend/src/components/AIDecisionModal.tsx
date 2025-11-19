import { useState, useEffect } from 'react';

interface AIDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  marketId?: string;
  marketTitle?: string;
}

interface MarketIntelligence {
  market_data: any;
  ai_analysis: string;
  news: any[];
  web_search: any[];
  related_markets: any[];
  forecast: string | null;
}

interface AIDecision {
  market_id: string;
  market: any;
  recommendation: 'BUY' | 'SELL' | 'SKIP';
  confidence: number;
  reasoning: string;
  forecast: string | null;
  risk_assessment: 'LOW' | 'MEDIUM' | 'HIGH';
  suggested_amount: number | null;
}

export default function AIDecisionModal({ isOpen, onClose, marketId, marketTitle }: AIDecisionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intelligence, setIntelligence] = useState<MarketIntelligence | null>(null);
  const [decision, setDecision] = useState<AIDecision | null>(null);
  const [amount, setAmount] = useState<number>(100);
  const [useRAG, setUseRAG] = useState(true);
  const [includeForecast, setIncludeForecast] = useState(true);
  const [includeNews, setIncludeNews] = useState(true);
  const [includeSearch, setIncludeSearch] = useState(true);
  const [activeTab, setActiveTab] = useState<'decision' | 'intelligence'>('decision');

  useEffect(() => {
    if (isOpen && marketId) {
      fetchData();
    }
  }, [isOpen, marketId]);

  const fetchData = async () => {
    if (!marketId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch both decision and intelligence in parallel
      const [decisionResponse, intelligenceResponse] = await Promise.all([
        fetch('/api/ai/decision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            market_id: marketId,
            amount,
            use_rag: useRAG,
            include_forecast: includeForecast,
          }),
        }),
        fetch('/api/ai/market-intelligence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            market_id: marketId,
            event_title: marketTitle,
            include_news: includeNews,
            include_search: includeSearch,
            depth: 'standard',
          }),
        }),
      ]);

      if (!decisionResponse.ok) throw new Error('Failed to fetch AI decision');
      if (!intelligenceResponse.ok) throw new Error('Failed to fetch market intelligence');

      const decisionData = await decisionResponse.json();
      const intelligenceData = await intelligenceResponse.json();

      setDecision(decisionData.decision);
      setIntelligence(intelligenceData.intelligence);
    } catch (err) {
      console.error('Error fetching AI data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY': return 'text-green-600 bg-green-100 border-green-300';
      case 'SELL': return 'text-red-600 bg-red-100 border-red-300';
      case 'SKIP': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-600 bg-green-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'HIGH': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🤖 AI Market Analysis</h2>
            {marketTitle && <p className="text-sm text-gray-600 mt-1">{marketTitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-gray-200">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('decision')}
              className={`pb-2 px-1 font-medium border-b-2 transition-colors ${
                activeTab === 'decision'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🎯 AI Decision
            </button>
            <button
              onClick={() => setActiveTab('intelligence')}
              className={`pb-2 px-1 font-medium border-b-2 transition-colors ${
                activeTab === 'intelligence'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🧠 Market Intelligence
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Analyzing market with AI...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <span className="text-red-500 text-xl mr-3">⚠️</span>
                <div>
                  <h3 className="text-red-800 font-medium">Error</h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && activeTab === 'decision' && decision && (
            <div className="space-y-6">
              {/* Recommendation Card */}
              <div className={`border-2 rounded-lg p-6 ${getRecommendationColor(decision.recommendation)}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl font-bold">{decision.recommendation}</span>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(decision.risk_assessment)}`}>
                      {decision.risk_assessment} RISK
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{(decision.confidence * 100).toFixed(0)}%</div>
                    <div className="text-sm opacity-75">Confidence</div>
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="w-full bg-white bg-opacity-30 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      decision.confidence > 0.7 ? 'bg-green-500' :
                      decision.confidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${decision.confidence * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Suggested Amount */}
              {decision.suggested_amount !== null && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Suggested Amount</h4>
                      <p className="text-sm text-gray-600 mt-1">Based on risk assessment and confidence</p>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      ${decision.suggested_amount.toFixed(2)} USDC
                    </div>
                  </div>
                </div>
              )}

              {/* AI Reasoning */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">💭</span>
                  AI Reasoning
                </h3>
                <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                  {decision.reasoning}
                </div>
              </div>

              {/* Forecast */}
              {decision.forecast && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">🔮</span>
                    Probability Forecast
                  </h3>
                  <div className="text-gray-700 text-sm leading-relaxed">
                    {decision.forecast}
                  </div>
                </div>
              )}

              {/* Market Details */}
              {decision.market && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Market Details</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><strong>Question:</strong> {decision.market.question}</div>
                    {decision.market.outcomes && (
                      <div><strong>Outcomes:</strong> {decision.market.outcomes.join(', ')}</div>
                    )}
                    {decision.market.outcome_prices && (
                      <div><strong>Prices:</strong> {decision.market.outcome_prices.join(', ')}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && !error && activeTab === 'intelligence' && intelligence && (
            <div className="space-y-6">
              {/* AI Analysis */}
              {intelligence.ai_analysis && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">🧠</span>
                    AI Analysis
                  </h3>
                  <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {intelligence.ai_analysis}
                  </div>
                </div>
              )}

              {/* News Articles */}
              {intelligence.news && intelligence.news.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">📰</span>
                    Related News ({intelligence.news.length})
                  </h3>
                  <div className="space-y-3">
                    {intelligence.news.slice(0, 5).map((article: any, index: number) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 text-sm mb-1">{article.title}</h4>
                        <p className="text-gray-600 text-xs mb-2">{article.description}</p>
                        {article.url && (
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs"
                          >
                            Read more →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Web Search Results */}
              {intelligence.web_search && intelligence.web_search.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">🔍</span>
                    Web Research ({intelligence.web_search.length})
                  </h3>
                  <div className="space-y-3">
                    {intelligence.web_search.slice(0, 5).map((result: any, index: number) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 text-sm mb-1">{result.title}</h4>
                        <p className="text-gray-600 text-xs mb-2">{result.snippet}</p>
                        {result.url && (
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs"
                          >
                            Visit source →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Markets */}
              {intelligence.related_markets && intelligence.related_markets.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">🔗</span>
                    Related Markets (RAG-Enhanced)
                  </h3>
                  <div className="space-y-3">
                    {intelligence.related_markets.map((market: any, index: number) => (
                      <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-gray-700 text-sm mb-2">{market.content}</p>
                            {market.metadata && (
                              <div className="text-xs text-gray-500">
                                {market.metadata.question && (
                                  <div><strong>Question:</strong> {market.metadata.question}</div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="ml-4 text-right">
                            <div className="text-xs text-purple-600 font-medium">
                              {(market.similarity * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-gray-500">similarity</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Powered by AI agents with RAG, news analysis, and web search
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => fetchData()}
                disabled={loading}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? 'Analyzing...' : '🔄 Refresh Analysis'}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
