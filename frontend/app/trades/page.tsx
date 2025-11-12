'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { useWeb3 } from '@/components/providers/Web3Provider'
import TradingHistory from '@/components/dashboard/TradingHistory'
import TradingStats from '@/components/TradingStats'

interface Trade {
  id: string
  timestamp: number
  type: 'BUY' | 'SELL'
  chain: 'BNB' | 'POLYGON'
  platform: string
  tokenIn: string
  tokenOut: string
  amountIn: string
  amountOut: string
  priceImpact: number
  gasUsed: string
  profit?: number
  status: 'SUCCESS' | 'FAILED' | 'PENDING'
}

export default function TradesPage() {
  const { isConnected } = useWeb3()
  const router = useRouter()
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'dex' | 'polymarket'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'profit' | 'volume'>('newest')

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
      return
    }

    // Fetch trades from API
    fetchTrades()

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchTrades, 30000)
    return () => clearInterval(interval)
  }, [isConnected, router, filter, sortBy])

  const fetchTrades = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/trades?limit=100&filter=${filter}&sort=${sortBy}`)
      if (response.ok) {
        const data = await response.json()
        setTrades(data.trades || [])
      }
    } catch (error) {
      console.error('Failed to fetch trades:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return null
  }

  return (
    <main className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Trading History</h1>
          <p className="text-slate-300">Complete history of all executed trades across chains</p>
        </div>

        {/* Trading Stats */}
        <div className="mb-8">
          <TradingStats />
        </div>

        {/* Filters & Controls */}
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
              All Trades
            </button>
            <button
              onClick={() => setFilter('dex')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'dex'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              DEX Only
            </button>
            <button
              onClick={() => setFilter('polymarket')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'polymarket'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Polymarket Only
            </button>
          </div>

          <div className="flex gap-2 items-center">
            <span className="text-slate-400 text-sm">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-purple-500 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="profit">Highest Profit</option>
              <option value="volume">Highest Volume</option>
            </select>
            <button
              onClick={fetchTrades}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Trades Table */}
        <div className="bg-slate-800/50 rounded-lg border border-purple-500/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Chain
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Pair
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    P&L
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                        <span className="ml-3 text-slate-400">Loading trades...</span>
                      </div>
                    </td>
                  </tr>
                ) : trades.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                      No trades found. Start trading to see your history here.
                    </td>
                  </tr>
                ) : (
                  trades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {new Date(trade.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            trade.type === 'BUY'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {trade.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {trade.chain}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {trade.platform}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                        {trade.tokenIn}/{trade.tokenOut}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {parseFloat(trade.amountIn).toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {trade.profit !== undefined && (
                          <span
                            className={
                              trade.profit > 0 ? 'text-green-400 font-semibold' : 'text-red-400'
                            }
                          >
                            {trade.profit > 0 ? '+' : ''}
                            {trade.profit.toFixed(4)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            trade.status === 'SUCCESS'
                              ? 'bg-green-500/20 text-green-400'
                              : trade.status === 'FAILED'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {trade.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alternative View: TradingHistory Component */}
        <div className="mt-8">
          <TradingHistory />
        </div>

        {/* Export Options */}
        <div className="mt-8 flex justify-end gap-4">
          <button className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors">
            📊 Export CSV
          </button>
          <button className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors">
            📄 Generate Report
          </button>
        </div>
      </div>
    </main>
  )
}
