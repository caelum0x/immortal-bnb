'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import { useWeb3 } from '@/components/providers/Web3Provider'
import { useRouter } from 'next/navigation'

interface AgentMetrics {
  totalDecisions: number
  successfulDecisions: number
  failedDecisions: number
  averageConfidence: number
  learningRate: number
  memoryCount: number
  lastUpdate: string
}

interface Decision {
  id: string
  timestamp: number
  tokenSymbol: string
  action: 'buy' | 'sell' | 'hold'
  confidence: number
  reasoning: string
  marketConditions: {
    price: number
    volume24h: number
    priceChange24h: number
    sentiment: string
  }
  outcome?: 'profit' | 'loss' | 'pending'
  profitLoss?: number
}

interface DynamicThresholds {
  minProfitability: number
  optimalConfidence: number
  maxRiskLevel: string
  suggestedTradeAmount: number
  computedAt: number
}

export default function AIAgentPage() {
  const { isConnected } = useWeb3()
  const router = useRouter()
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null)
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [thresholds, setThresholds] = useState<DynamicThresholds | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'decisions' | 'thresholds'>('overview')

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
      return
    }

    fetchAIData()
    const interval = setInterval(fetchAIData, 30000)
    return () => clearInterval(interval)
  }, [isConnected, router])

  const fetchAIData = async () => {
    try {
      setLoading(true)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

      const [metricsRes, decisionsRes, thresholdsRes] = await Promise.all([
        fetch(`${API_URL}/api/ai/metrics`),
        fetch(`${API_URL}/api/ai/decisions?limit=20`),
        fetch(`${API_URL}/api/ai/thresholds`),
      ])

      if (metricsRes.ok) {
        const data = await metricsRes.json()
        setMetrics(data.metrics)
      }

      if (decisionsRes.ok) {
        const data = await decisionsRes.json()
        setDecisions(data.decisions || [])
      }

      if (thresholdsRes.ok) {
        const data = await thresholdsRes.json()
        setThresholds(data.thresholds)
      }
    } catch (error) {
      console.error('Failed to fetch AI data:', error)
    } finally {
      setLoading(false)
    }
  }

  const recomputeThresholds = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_URL}/api/ai/thresholds/recompute`, {
        method: 'POST',
      })

      if (response.ok) {
        alert('Thresholds recomputed successfully!')
        fetchAIData()
      }
    } catch (error) {
      console.error('Failed to recompute thresholds:', error)
      alert('Failed to recompute thresholds')
    }
  }

  return (
    <main className="min-h-screen bg-slate-900">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🤖 AI Agent Monitoring</h1>
          <p className="text-slate-400">
            Real-time monitoring of the Immortal AI trading agent with Greenfield memory
          </p>
        </div>

        {/* Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-purple-500/30 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">Total Decisions</div>
              <div className="text-2xl font-bold text-white">{metrics.totalDecisions}</div>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-500/30 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">Successful</div>
              <div className="text-2xl font-bold text-green-400">{metrics.successfulDecisions}</div>
            </div>

            <div className="bg-gradient-to-br from-red-500/20 to-rose-500/20 backdrop-blur-sm border border-red-500/30 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">Failed</div>
              <div className="text-2xl font-bold text-red-400">{metrics.failedDecisions}</div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-500/30 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">Avg Confidence</div>
              <div className="text-2xl font-bold text-blue-400">
                {(metrics.averageConfidence * 100).toFixed(0)}%
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">Learning Rate</div>
              <div className="text-2xl font-bold text-amber-400">
                {(metrics.learningRate * 100).toFixed(1)}%
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm border border-indigo-500/30 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-1">Memory Count</div>
              <div className="text-2xl font-bold text-indigo-400">{metrics.memoryCount}</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-slate-700">
          <nav className="flex space-x-8">
            <button
              onClick={() => setTab('overview')}
              className={`pb-4 px-2 font-medium transition-colors ${
                tab === 'overview'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setTab('decisions')}
              className={`pb-4 px-2 font-medium transition-colors ${
                tab === 'decisions'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Recent Decisions
            </button>
            <button
              onClick={() => setTab('thresholds')}
              className={`pb-4 px-2 font-medium transition-colors ${
                tab === 'thresholds'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dynamic Thresholds
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {tab === 'overview' && metrics && (
          <div className="space-y-6">
            {/* Success Rate Chart */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Performance Overview</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-slate-400 mb-2">Success Rate</div>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block text-green-400">
                          {metrics.totalDecisions > 0
                            ? ((metrics.successfulDecisions / metrics.totalDecisions) * 100).toFixed(1)
                            : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-slate-700">
                      <div
                        style={{
                          width: `${
                            metrics.totalDecisions > 0
                              ? (metrics.successfulDecisions / metrics.totalDecisions) * 100
                              : 0
                          }%`,
                        }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-slate-400 mb-2">Learning Progress</div>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block text-amber-400">
                          {(metrics.learningRate * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-slate-700">
                      <div
                        style={{ width: `${metrics.learningRate * 100}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Last Update */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Last Memory Update</div>
                  <div className="text-lg font-semibold text-white">{metrics.lastUpdate}</div>
                </div>
                <button
                  onClick={fetchAIData}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'decisions' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : decisions.length === 0 ? (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">🤔</div>
                <h3 className="text-2xl font-bold text-white mb-2">No Decisions Yet</h3>
                <p className="text-slate-400">The AI agent hasn't made any trading decisions yet</p>
              </div>
            ) : (
              decisions.map((decision) => (
                <div
                  key={decision.id}
                  className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{decision.tokenSymbol}</h3>
                      <p className="text-sm text-slate-400">
                        {new Date(decision.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`px-4 py-1 rounded-full text-sm font-bold ${
                          decision.action === 'buy'
                            ? 'bg-green-500/20 text-green-400'
                            : decision.action === 'sell'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        {decision.action.toUpperCase()}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        Confidence: {(decision.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                    <div className="text-sm text-slate-400 mb-2">AI Reasoning:</div>
                    <p className="text-white">{decision.reasoning}</p>
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-slate-400 text-xs">Price</div>
                      <div className="text-white font-semibold">
                        ${decision.marketConditions.price.toFixed(4)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs">24h Change</div>
                      <div
                        className={`font-semibold ${
                          decision.marketConditions.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {decision.marketConditions.priceChange24h >= 0 ? '+' : ''}
                        {decision.marketConditions.priceChange24h.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs">Volume</div>
                      <div className="text-white font-semibold">
                        ${(decision.marketConditions.volume24h / 1000).toFixed(0)}K
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs">Outcome</div>
                      {decision.outcome ? (
                        <div
                          className={`font-semibold ${
                            decision.outcome === 'profit' ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {decision.profitLoss ? `$${decision.profitLoss.toFixed(2)}` : decision.outcome}
                        </div>
                      ) : (
                        <div className="text-yellow-400 font-semibold">Pending</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'thresholds' && thresholds && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Dynamic Thresholds</h3>
                  <p className="text-sm text-slate-400">
                    Computed from {metrics?.memoryCount || 0} historical trades on Greenfield
                  </p>
                </div>
                <button
                  onClick={recomputeThresholds}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Recompute Thresholds
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-6">
                  <div className="text-sm text-slate-400 mb-2">Minimum Profitability</div>
                  <div className="text-4xl font-bold text-green-400 mb-2">
                    {(thresholds.minProfitability * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-slate-400">
                    Trades below this threshold are rejected
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg p-6">
                  <div className="text-sm text-slate-400 mb-2">Optimal Confidence</div>
                  <div className="text-4xl font-bold text-blue-400 mb-2">
                    {(thresholds.optimalConfidence * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-slate-400">
                    Target confidence level for trades
                  </p>
                </div>

                <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-lg p-6">
                  <div className="text-sm text-slate-400 mb-2">Max Risk Level</div>
                  <div className="text-4xl font-bold text-amber-400 mb-2">
                    {thresholds.maxRiskLevel}
                  </div>
                  <p className="text-xs text-slate-400">
                    Maximum acceptable risk per trade
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-6">
                  <div className="text-sm text-slate-400 mb-2">Suggested Trade Amount</div>
                  <div className="text-4xl font-bold text-purple-400 mb-2">
                    {thresholds.suggestedTradeAmount.toFixed(3)} BNB
                  </div>
                  <p className="text-xs text-slate-400">
                    Optimal position size based on performance
                  </p>
                </div>
              </div>

              <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-slate-300">
                  <strong className="text-blue-400">ℹ️ Note:</strong> These thresholds are automatically
                  computed from your trading history stored on BNB Greenfield. The AI agent learns from each
                  trade and adjusts its decision-making parameters dynamically.
                </p>
              </div>

              <div className="mt-4 text-xs text-slate-500 text-center">
                Last computed: {new Date(thresholds.computedAt).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
