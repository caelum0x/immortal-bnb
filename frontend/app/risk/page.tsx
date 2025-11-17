'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import { useWeb3 } from '@/components/providers/Web3Provider'

interface PositionRisk {
  tokenId: string
  tokenSymbol: string
  currentValue: number
  entryPrice: number
  currentPrice: number
  quantity: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  riskAmount: number
  suggestedStopLoss: number
  riskRewardRatio: number
  positionSizePercent: number
}

interface PortfolioRisk {
  totalValue: number
  totalExposure: number
  totalUnrealizedPnL: number
  portfolioVaR: number
  sharpeRatio: number
  beta: number
  maxDrawdown: number
  concentrationRisk: number
  diversificationScore: number
  positions: PositionRisk[]
}

interface RiskRecommendation {
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  message: string
  action?: string
}

interface PositionSizingResult {
  recommendedSize: number
  recommendedQuantity: number
  maxRisk: number
  stopLossPrice: number
  takeProfitPrice: number
  riskRewardRatio: number
  reasoning: string
}

export default function RiskManagementPage() {
  const { isConnected } = useWeb3()
  const [portfolioRisk, setPortfolioRisk] = useState<PortfolioRisk | null>(null)
  const [recommendations, setRecommendations] = useState<RiskRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Position sizing calculator state
  const [portfolioValue, setPortfolioValue] = useState('')
  const [entryPrice, setEntryPrice] = useState('')
  const [stopLossPrice, setStopLossPrice] = useState('')
  const [riskPercent, setRiskPercent] = useState('2')
  const [sizingResult, setSizingResult] = useState<PositionSizingResult | null>(null)

  useEffect(() => {
    if (!isConnected) {
      setLoading(false)
      return
    }

    fetchRiskData()
    const interval = setInterval(fetchRiskData, 30000) // Refresh every 30s

    return () => clearInterval(interval)
  }, [isConnected])

  const fetchRiskData = async () => {
    try {
      setLoading(true)
      setError(null)

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

      const [riskRes, recsRes] = await Promise.all([
        fetch(`${API_URL}/api/risk/portfolio`),
        fetch(`${API_URL}/api/risk/recommendations`),
      ])

      if (!riskRes.ok || !recsRes.ok) {
        throw new Error('Failed to fetch risk data')
      }

      const riskData = await riskRes.json()
      const recsData = await recsRes.json()

      setPortfolioRisk(riskData)
      setRecommendations(recsData.recommendations || [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const calculatePositionSize = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

      const response = await fetch(`${API_URL}/api/risk/position-size`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioValue: parseFloat(portfolioValue),
          entryPrice: parseFloat(entryPrice),
          stopLossPrice: parseFloat(stopLossPrice),
          riskPercent: parseFloat(riskPercent) / 100,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to calculate position size')
      }

      const result = await response.json()
      setSizingResult(result)
    } catch (err) {
      alert(`Error: ${(err as Error).message}`)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500/20 border-red-500 text-red-400'
      case 'HIGH':
        return 'bg-orange-500/20 border-orange-500 text-orange-400'
      case 'MEDIUM':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
      case 'LOW':
        return 'bg-blue-500/20 border-blue-500 text-blue-400'
      default:
        return 'bg-gray-500/20 border-gray-500 text-gray-400'
    }
  }

  const getRiskLevelColor = (value: number, inverse: boolean = false) => {
    if (inverse) {
      // Higher is better (e.g., diversification score)
      if (value >= 70) return 'text-green-400'
      if (value >= 40) return 'text-yellow-400'
      return 'text-red-400'
    } else {
      // Lower is better (e.g., concentration risk)
      if (value <= 30) return 'text-green-400'
      if (value <= 60) return 'text-yellow-400'
      return 'text-red-400'
    }
  }

  return (
    <main className="min-h-screen bg-slate-900">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Risk Management</h1>
          <p className="text-slate-400">Monitor portfolio risk and get actionable recommendations</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            <p className="text-slate-400 mt-4">Analyzing portfolio risk...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-4 rounded-lg mb-6">
            <p className="font-semibold">Error loading risk data</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Not Connected */}
        {!isConnected && !loading && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🔌</div>
            <h3 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h3>
            <p className="text-slate-400">Connect your wallet to view risk analysis</p>
          </div>
        )}

        {/* Risk Dashboard */}
        {isConnected && !loading && portfolioRisk && (
          <div className="space-y-6">
            {/* Key Risk Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">Total Value</div>
                <div className="text-2xl font-bold text-white">
                  ${portfolioRisk.totalValue.toFixed(2)}
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">Unrealized P&L</div>
                <div className={`text-2xl font-bold ${portfolioRisk.totalUnrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {portfolioRisk.totalUnrealizedPnL >= 0 ? '+' : ''}${portfolioRisk.totalUnrealizedPnL.toFixed(2)}
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">Value at Risk</div>
                <div className="text-2xl font-bold text-red-400">
                  ${portfolioRisk.portfolioVaR.toFixed(2)}
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">Sharpe Ratio</div>
                <div className="text-2xl font-bold text-blue-400">
                  {portfolioRisk.sharpeRatio.toFixed(2)}
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">Max Drawdown</div>
                <div className="text-2xl font-bold text-orange-400">
                  {portfolioRisk.maxDrawdown.toFixed(2)}%
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">Concentration</div>
                <div className={`text-2xl font-bold ${getRiskLevelColor(portfolioRisk.concentrationRisk, false)}`}>
                  {portfolioRisk.concentrationRisk.toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Risk Recommendations */}
            {recommendations.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">⚠️ Risk Alerts</h3>
                <div className="space-y-3">
                  {recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-lg p-4 ${getSeverityColor(rec.severity)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-black/20 rounded text-xs font-semibold">
                              {rec.type.replace('_', ' ')}
                            </span>
                            <span className="text-xs">{rec.severity}</span>
                          </div>
                          <p className="text-sm mb-2">{rec.message}</p>
                          {rec.action && (
                            <p className="text-xs opacity-75">Action: {rec.action}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Position Risks */}
            {portfolioRisk.positions.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg overflow-hidden">
                <div className="p-6 border-b border-slate-700">
                  <h3 className="text-xl font-semibold text-white">Position Risk Analysis</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-900/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">Token</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-400">Value</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-400">P&L %</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-400">Portfolio %</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-400">Stop Loss</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-400">Risk/Reward</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {portfolioRisk.positions.map((pos, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-white">{pos.tokenSymbol}</div>
                          </td>
                          <td className="px-6 py-4 text-right text-white">
                            ${pos.currentValue.toFixed(2)}
                          </td>
                          <td className={`px-6 py-4 text-right font-semibold ${pos.unrealizedPnLPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {pos.unrealizedPnLPercent >= 0 ? '+' : ''}{pos.unrealizedPnLPercent.toFixed(2)}%
                          </td>
                          <td className={`px-6 py-4 text-right ${getRiskLevelColor(pos.positionSizePercent, false)}`}>
                            {pos.positionSizePercent.toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 text-right text-white">
                            ${pos.suggestedStopLoss.toFixed(4)}
                          </td>
                          <td className="px-6 py-4 text-right text-white">
                            {pos.riskRewardRatio.toFixed(2)}:1
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Position Sizing Calculator */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">💡 Position Sizing Calculator</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Portfolio Value ($)
                      </label>
                      <input
                        type="number"
                        value={portfolioValue}
                        onChange={(e) => setPortfolioValue(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        placeholder="10000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Entry Price ($)
                      </label>
                      <input
                        type="number"
                        value={entryPrice}
                        onChange={(e) => setEntryPrice(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        placeholder="100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Stop Loss Price ($)
                      </label>
                      <input
                        type="number"
                        value={stopLossPrice}
                        onChange={(e) => setStopLossPrice(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        placeholder="95"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Risk Per Trade (%)
                      </label>
                      <input
                        type="number"
                        value={riskPercent}
                        onChange={(e) => setRiskPercent(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        placeholder="2"
                        step="0.1"
                      />
                    </div>

                    <button
                      onClick={calculatePositionSize}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Calculate Position Size
                    </button>
                  </div>
                </div>

                <div>
                  {sizingResult && (
                    <div className="bg-slate-900/50 rounded-lg p-6 border border-purple-500/30">
                      <h4 className="text-lg font-semibold text-white mb-4">Recommended Position</h4>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Position Size:</span>
                          <span className="text-xl font-bold text-white">
                            ${sizingResult.recommendedSize.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Quantity:</span>
                          <span className="text-lg font-semibold text-white">
                            {sizingResult.recommendedQuantity.toFixed(4)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Max Risk:</span>
                          <span className="text-lg font-semibold text-red-400">
                            ${sizingResult.maxRisk.toFixed(2)}
                          </span>
                        </div>

                        <div className="border-t border-slate-700 pt-3 mt-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-400">Stop Loss:</span>
                            <span className="text-white">${sizingResult.stopLossPrice.toFixed(4)}</span>
                          </div>

                          <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-400">Take Profit:</span>
                            <span className="text-green-400">${sizingResult.takeProfitPrice.toFixed(4)}</span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Risk/Reward:</span>
                            <span className="text-blue-400">{sizingResult.riskRewardRatio.toFixed(2)}:1</span>
                          </div>
                        </div>

                        <div className="border-t border-slate-700 pt-3 mt-3">
                          <p className="text-sm text-slate-400">{sizingResult.reasoning}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!sizingResult && (
                    <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700 h-full flex items-center justify-center">
                      <p className="text-slate-500 text-center">
                        Enter values and click Calculate to see recommended position size
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
