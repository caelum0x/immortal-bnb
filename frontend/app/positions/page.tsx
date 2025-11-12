'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import { useWeb3 } from '@/components/providers/Web3Provider'

interface Position {
  id: string
  tokenSymbol: string
  tokenAddress: string
  entryPrice: number
  currentPrice: number
  amount: number
  value: number
  pnl: number
  pnlPercent: number
  entryTime: number
  status: 'active' | 'pending' | 'closed'
}

export default function PositionsPage() {
  const { isConnected } = useWeb3()
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isConnected) {
      setLoading(false)
      return
    }

    fetchPositions()
    const interval = setInterval(fetchPositions, 30000) // Refresh every 30s

    return () => clearInterval(interval)
  }, [isConnected])

  const fetchPositions = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_URL}/api/positions`)

      if (!response.ok) {
        throw new Error('Failed to fetch positions')
      }

      const data = await response.json()
      setPositions(data.positions || [])
      setError(null)
    } catch (err) {
      setError((err as Error).message)
      setPositions([])
    } finally {
      setLoading(false)
    }
  }

  const closePosition = async (positionId: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_URL}/api/positions/${positionId}/close`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to close position')
      }

      // Refresh positions
      await fetchPositions()
    } catch (err) {
      alert(`Error: ${(err as Error).message}`)
    }
  }

  const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0)
  const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0)
  const totalPnLPercent = totalValue > 0 ? (totalPnL / (totalValue - totalPnL)) * 100 : 0

  return (
    <main className="min-h-screen bg-slate-900">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Active Positions</h1>
          <p className="text-slate-400">Monitor and manage your current trading positions</p>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
            <div className="text-sm text-slate-400 mb-2">Total Positions</div>
            <div className="text-3xl font-bold text-white">{positions.length}</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
            <div className="text-sm text-slate-400 mb-2">Portfolio Value</div>
            <div className="text-3xl font-bold text-white">${totalValue.toFixed(2)}</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
            <div className="text-sm text-slate-400 mb-2">Total P&L</div>
            <div className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
            <div className="text-sm text-slate-400 mb-2">Total P&L %</div>
            <div className={`text-3xl font-bold ${totalPnLPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            <p className="text-slate-400 mt-4">Loading positions...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <p className="font-semibold">Error loading positions</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Not Connected */}
        {!isConnected && !loading && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🔌</div>
            <h3 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h3>
            <p className="text-slate-400">Connect your wallet to view your positions</p>
          </div>
        )}

        {/* Empty State */}
        {isConnected && !loading && positions.length === 0 && !error && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-white mb-2">No Active Positions</h3>
            <p className="text-slate-400 mb-6">You don't have any active positions yet</p>
            <a
              href="/discovery"
              className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
            >
              Discover Tokens
            </a>
          </div>
        )}

        {/* Positions Table */}
        {isConnected && !loading && positions.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">Token</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-400">Entry Price</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-400">Current Price</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-400">Amount</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-400">Value</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-400">P&L</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-400">P&L %</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-400">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {positions.map((position) => (
                    <tr key={position.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-white">{position.tokenSymbol}</div>
                          <div className="text-xs text-slate-400 font-mono">
                            {position.tokenAddress.slice(0, 6)}...{position.tokenAddress.slice(-4)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-white">${position.entryPrice.toFixed(4)}</td>
                      <td className="px-6 py-4 text-right text-white">${position.currentPrice.toFixed(4)}</td>
                      <td className="px-6 py-4 text-right text-white">{position.amount.toFixed(4)}</td>
                      <td className="px-6 py-4 text-right text-white">${position.value.toFixed(2)}</td>
                      <td className={`px-6 py-4 text-right font-semibold ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                      </td>
                      <td className={`px-6 py-4 text-right font-semibold ${position.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          position.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          position.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {position.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => closePosition(position.id)}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                        >
                          Close
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
