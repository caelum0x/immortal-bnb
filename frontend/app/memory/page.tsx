'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { useWeb3 } from '@/components/providers/Web3Provider'
import MemoriesView from '@/components/MemoriesView'

interface MemoryEntry {
  id: string
  timestamp: number
  category: string
  content: string
  chain: string
  objectId: string
  bucketName: string
  metadata: {
    tradePair?: string
    profit?: number
    strategy?: string
    [key: string]: any
  }
}

interface MemoryAnalytics {
  total: {
    trades: number
    winRate: number
    profitFactor: number
    volume: number
  }
  dex: {
    trades: number
    winRate: number
    volume: number
  }
  polymarket: {
    trades: number
    winRate: number
    volume: number
  }
  learnings: {
    topStrategies: string[]
    bestTimeframes: string[]
    optimalTokens: string[]
  }
}

export default function MemoryPage() {
  const { isConnected } = useWeb3()
  const router = useRouter()
  const [memories, setMemories] = useState<MemoryEntry[]>([])
  const [analytics, setAnalytics] = useState<MemoryAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
      return
    }

    fetchMemoryData()
  }, [isConnected, router])

  const fetchMemoryData = async () => {
    try {
      setLoading(true)

      const [memoriesRes, analyticsRes] = await Promise.all([
        fetch('/api/memory/list'),
        fetch('/api/memory/analytics'),
      ])

      if (memoriesRes.ok) {
        const data = await memoriesRes.json()
        setMemories(data.memories || [])
      }

      if (analyticsRes.ok) {
        const data = await analyticsRes.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to fetch memory data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMemories = memories.filter((memory) => {
    const matchesSearch =
      searchTerm === '' ||
      memory.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memory.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = filterCategory === 'all' || memory.category === filterCategory

    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(memories.map((m) => m.category)))

  if (!isConnected) {
    return null
  }

  return (
    <main className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">💾 Immortal Memory</h1>
          <p className="text-slate-300">
            All trading data permanently stored on BNB Greenfield. Bot learns from every trade.
          </p>
        </div>

        {/* Analytics Overview */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
              <div className="text-slate-400 text-sm mb-2">Total Trades Learned</div>
              <div className="text-3xl font-bold text-purple-400">
                {analytics.total.trades.toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
              <div className="text-slate-400 text-sm mb-2">Overall Win Rate</div>
              <div className="text-3xl font-bold text-green-400">
                {analytics.total.winRate.toFixed(1)}%
              </div>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
              <div className="text-slate-400 text-sm mb-2">Profit Factor</div>
              <div className="text-3xl font-bold text-blue-400">
                {analytics.total.profitFactor.toFixed(2)}x
              </div>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
              <div className="text-slate-400 text-sm mb-2">Total Volume</div>
              <div className="text-3xl font-bold text-yellow-400">
                ${(analytics.total.volume / 1000).toFixed(1)}K
              </div>
            </div>
          </div>
        )}

        {/* AI Learnings */}
        {analytics && (
          <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30 mb-8">
            <h2 className="text-xl font-bold text-white mb-6">🧠 AI Learnings & Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-3">Top Strategies</h3>
                <div className="space-y-2">
                  {analytics.learnings.topStrategies.map((strategy, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/50 px-3 py-2 rounded text-sm text-white"
                    >
                      {strategy}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-3">Best Timeframes</h3>
                <div className="space-y-2">
                  {analytics.learnings.bestTimeframes.map((timeframe, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/50 px-3 py-2 rounded text-sm text-white"
                    >
                      {timeframe}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-3">Optimal Tokens</h3>
                <div className="space-y-2">
                  {analytics.learnings.optimalTokens.map((token, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/50 px-3 py-2 rounded text-sm text-white"
                    >
                      {token}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <input
            type="text"
            placeholder="Search memories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[300px] bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-purple-500 focus:outline-none"
          />

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-purple-500 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            onClick={fetchMemoryData}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Memories List */}
        <div className="bg-slate-800/50 rounded-lg border border-purple-500/30 p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Memory Entries ({filteredMemories.length})
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <span className="ml-3 text-slate-400">Loading memories from Greenfield...</span>
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No memories found. Start trading to build the bot's memory.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMemories.map((memory) => (
                <div
                  key={memory.id}
                  className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 hover:border-purple-500/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded">
                        {memory.category}
                      </span>
                      <span className="text-slate-400 text-xs">
                        {new Date(memory.timestamp).toLocaleString()}
                      </span>
                      <span className="text-slate-400 text-xs">{memory.chain}</span>
                    </div>
                    {memory.metadata.profit !== undefined && (
                      <span
                        className={`text-sm font-semibold ${
                          memory.metadata.profit > 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {memory.metadata.profit > 0 ? '+' : ''}
                        {memory.metadata.profit.toFixed(4)}
                      </span>
                    )}
                  </div>

                  <p className="text-white mb-2">{memory.content}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-slate-400">
                      {memory.metadata.tradePair && (
                        <span>Pair: {memory.metadata.tradePair}</span>
                      )}
                      {memory.metadata.strategy && (
                        <span>Strategy: {memory.metadata.strategy}</span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 font-mono">
                      Greenfield: {memory.objectId.slice(0, 8)}...
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alternative View: MemoriesView Component */}
        <div className="mt-8">
          <MemoriesView />
        </div>

        {/* Greenfield Storage Info */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
          <div className="flex items-start space-x-4">
            <div className="text-3xl">ℹ️</div>
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-2">
                About Greenfield Storage
              </h3>
              <p className="text-slate-300 text-sm mb-2">
                All trading memories are stored permanently on BNB Greenfield, ensuring
                decentralized and immutable storage. The AI uses this data to continuously learn
                and improve trading strategies.
              </p>
              <p className="text-slate-400 text-xs">
                Bucket: {memories[0]?.bucketName || 'immortal-trading-bot'} | Chain:{' '}
                {memories[0]?.chain || 'BNB Greenfield'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
