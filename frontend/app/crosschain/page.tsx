'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import { useWeb3 } from '@/components/providers/Web3Provider'
import { useRouter } from 'next/navigation'

interface ArbitrageOpportunity {
  id: string
  tokenSymbol: string
  tokenAddress: string
  sourceChain: string
  targetChain: string
  sourceDEX: string
  targetDEX: string
  sourcePrice: number
  targetPrice: number
  priceDifference: number
  profitPercent: number
  estimatedProfit: number
  bridgeFee: number
  gasEstimate: number
  netProfit: number
  liquidity: number
  volume24h: number
  confidence: number
  timestamp: number
}

export default function CrossChainPage() {
  const { isConnected } = useWeb3()
  const router = useRouter()
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'bnb-polygon' | 'polygon-bnb'>('all')
  const [minProfit, setMinProfit] = useState(1.0)

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
      return
    }

    fetchOpportunities()
    const interval = setInterval(fetchOpportunities, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [isConnected, router, filter, minProfit])

  const fetchOpportunities = async () => {
    try {
      setLoading(true)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_URL}/api/crosschain/opportunities?minProfit=${minProfit}&filter=${filter}`)

      if (response.ok) {
        const data = await response.json()
        setOpportunities(data.opportunities || [])
      }
    } catch (error) {
      console.error('Failed to fetch arbitrage opportunities:', error)
    } finally {
      setLoading(false)
    }
  }

  const executeArbitrage = async (opportunityId: string) => {
    if (!confirm('Execute this cross-chain arbitrage trade?')) return

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_URL}/api/crosschain/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId }),
      })

      if (response.ok) {
        alert('Arbitrage trade initiated successfully!')
        fetchOpportunities()
      } else {
        const error = await response.json()
        alert(`Failed to execute: ${error.message}`)
      }
    } catch (error) {
      console.error('Execute arbitrage error:', error)
      alert('Failed to execute arbitrage trade')
    }
  }

  return (
    <main className="min-h-screen bg-slate-900">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🌉 Cross-Chain Arbitrage</h1>
          <p className="text-slate-400">
            Automated cross-chain arbitrage opportunities using Wormhole Bridge
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6">
            <div className="text-sm text-slate-400 mb-2">Active Opportunities</div>
            <div className="text-3xl font-bold text-white">{opportunities.length}</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-green-500/30 rounded-lg p-6">
            <div className="text-sm text-slate-400 mb-2">Best Opportunity</div>
            <div className="text-3xl font-bold text-green-400">
              {opportunities.length > 0
                ? `${Math.max(...opportunities.map(o => o.profitPercent)).toFixed(2)}%`
                : '0%'}
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/30 rounded-lg p-6">
            <div className="text-sm text-slate-400 mb-2">Total Volume</div>
            <div className="text-3xl font-bold text-white">
              ${opportunities.reduce((sum, o) => sum + o.volume24h, 0).toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-amber-500/30 rounded-lg p-6">
            <div className="text-sm text-slate-400 mb-2">Avg Net Profit</div>
            <div className="text-3xl font-bold text-amber-400">
              ${opportunities.length > 0
                ? (opportunities.reduce((sum, o) => sum + o.netProfit, 0) / opportunities.length).toFixed(2)
                : '0.00'}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Routes
            </button>
            <button
              onClick={() => setFilter('bnb-polygon')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'bnb-polygon'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              BNB → Polygon
            </button>
            <button
              onClick={() => setFilter('polygon-bnb')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'polygon-bnb'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Polygon → BNB
            </button>
          </div>

          <div className="flex gap-2 items-center">
            <span className="text-slate-400 text-sm">Min Profit:</span>
            <select
              value={minProfit}
              onChange={(e) => setMinProfit(parseFloat(e.target.value))}
              className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-purple-500 focus:outline-none"
            >
              <option value="0.5">0.5%</option>
              <option value="1.0">1.0%</option>
              <option value="2.0">2.0%</option>
              <option value="5.0">5.0%</option>
            </select>
            <button
              onClick={fetchOpportunities}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Opportunities List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              <p className="text-slate-400 mt-4">Scanning for arbitrage opportunities...</p>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-white mb-2">No Opportunities Found</h3>
              <p className="text-slate-400 mb-6">
                No profitable arbitrage opportunities at the moment. Try lowering the minimum profit threshold.
              </p>
            </div>
          ) : (
            opportunities.map((opp) => (
              <div
                key={opp.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6 hover:border-purple-500/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{opp.tokenSymbol}</h3>
                    <p className="text-sm text-slate-400 font-mono">
                      {opp.tokenAddress.slice(0, 6)}...{opp.tokenAddress.slice(-4)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-400">
                      +{opp.profitPercent.toFixed(2)}%
                    </div>
                    <div className="text-sm text-slate-400">
                      ${opp.netProfit.toFixed(2)} profit
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Source */}
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-xs text-slate-400 mb-2">Source</div>
                    <div className="text-white font-semibold">{opp.sourceChain}</div>
                    <div className="text-sm text-blue-400">{opp.sourceDEX}</div>
                    <div className="text-lg font-bold text-white mt-2">
                      ${opp.sourcePrice.toFixed(4)}
                    </div>
                  </div>

                  {/* Target */}
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-xs text-slate-400 mb-2">Target</div>
                    <div className="text-white font-semibold">{opp.targetChain}</div>
                    <div className="text-sm text-purple-400">{opp.targetDEX}</div>
                    <div className="text-lg font-bold text-white mt-2">
                      ${opp.targetPrice.toFixed(4)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-4 text-sm">
                  <div>
                    <div className="text-slate-400 text-xs">Bridge Fee</div>
                    <div className="text-white font-semibold">${opp.bridgeFee.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs">Gas Est.</div>
                    <div className="text-white font-semibold">${opp.gasEstimate.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs">Liquidity</div>
                    <div className="text-white font-semibold">${(opp.liquidity / 1000).toFixed(0)}K</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs">Confidence</div>
                    <div className="text-green-400 font-semibold">{(opp.confidence * 100).toFixed(0)}%</div>
                  </div>
                </div>

                <button
                  onClick={() => executeArbitrage(opp.id)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-lg font-semibold transition-all"
                >
                  Execute Arbitrage
                </button>
              </div>
            ))
          )}
        </div>

        {/* Info Panel */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-3">ℹ️ How Cross-Chain Arbitrage Works</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• Scans token prices across BNB Chain and Polygon</li>
            <li>• Identifies price differences exceeding minimum profit threshold</li>
            <li>• Calculates bridge fees, gas costs, and slippage</li>
            <li>• Uses Wormhole Bridge for fast cross-chain transfers</li>
            <li>• Executes buy on source chain and sell on target chain</li>
            <li>• Net profit after all fees displayed in real-time</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
