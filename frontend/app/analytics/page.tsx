'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import { useWeb3 } from '@/components/providers/Web3Provider'
import { Line, Bar, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface AnalyticsData {
  profitTimeline: { date: string; profit: number }[]
  tradeDistribution: { win: number; loss: number; breakeven: number }
  topTokens: { symbol: string; profit: number; trades: number }[]
  performanceMetrics: {
    totalReturn: number
    sharpeRatio: number
    maxDrawdown: number
    winRate: number
    avgWin: number
    avgLoss: number
    profitFactor: number
  }
}

export default function AnalyticsPage() {
  const { isConnected } = useWeb3()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    if (!isConnected) {
      setLoading(false)
      return
    }

    fetchAnalytics()
  }, [isConnected, timeframe])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_URL}/api/analytics?timeframe=${timeframe}`)

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setAnalytics(data)
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }

  // Chart configurations
  const profitChartData = {
    labels: analytics?.profitTimeline.map(d => d.date) || [],
    datasets: [
      {
        label: 'Cumulative Profit',
        data: analytics?.profitTimeline.map(d => d.profit) || [],
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const tradeDistributionData = {
    labels: ['Wins', 'Losses', 'Break Even'],
    datasets: [
      {
        data: [
          analytics?.tradeDistribution.win || 0,
          analytics?.tradeDistribution.loss || 0,
          analytics?.tradeDistribution.breakeven || 0,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(148, 163, 184, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)',
          'rgb(148, 163, 184)',
        ],
        borderWidth: 2,
      },
    ],
  }

  const topTokensData = {
    labels: analytics?.topTokens.map(t => t.symbol) || [],
    datasets: [
      {
        label: 'Profit ($)',
        data: analytics?.topTokens.map(t => t.profit) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'rgb(203, 213, 225)',
        },
      },
    },
    scales: {
      x: {
        ticks: { color: 'rgb(148, 163, 184)' },
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
      },
      y: {
        ticks: { color: 'rgb(148, 163, 184)' },
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
      },
    },
  }

  return (
    <main className="min-h-screen bg-slate-900">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Performance Analytics</h1>
            <p className="text-slate-400">Deep insights into your trading performance</p>
          </div>

          {/* Timeframe Selector */}
          <div className="flex space-x-2">
            {(['7d', '30d', '90d', 'all'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  timeframe === tf
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {tf === 'all' ? 'All Time' : tf.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            <p className="text-slate-400 mt-4">Loading analytics...</p>
          </div>
        )}

        {/* Not Connected */}
        {!isConnected && !loading && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🔌</div>
            <h3 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h3>
            <p className="text-slate-400">Connect your wallet to view analytics</p>
          </div>
        )}

        {/* Analytics Content */}
        {isConnected && !loading && analytics && (
          <div className="space-y-6">
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                <div className="text-sm text-slate-400 mb-2">Total Return</div>
                <div className={`text-3xl font-bold ${analytics.performanceMetrics.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {analytics.performanceMetrics.totalReturn >= 0 ? '+' : ''}{analytics.performanceMetrics.totalReturn.toFixed(2)}%
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                <div className="text-sm text-slate-400 mb-2">Sharpe Ratio</div>
                <div className="text-3xl font-bold text-purple-400">{analytics.performanceMetrics.sharpeRatio.toFixed(2)}</div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                <div className="text-sm text-slate-400 mb-2">Max Drawdown</div>
                <div className="text-3xl font-bold text-red-400">{analytics.performanceMetrics.maxDrawdown.toFixed(2)}%</div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                <div className="text-sm text-slate-400 mb-2">Win Rate</div>
                <div className="text-3xl font-bold text-blue-400">{analytics.performanceMetrics.winRate.toFixed(1)}%</div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                <div className="text-sm text-slate-400 mb-2">Avg Win</div>
                <div className="text-2xl font-bold text-green-400">${analytics.performanceMetrics.avgWin.toFixed(2)}</div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                <div className="text-sm text-slate-400 mb-2">Avg Loss</div>
                <div className="text-2xl font-bold text-red-400">${analytics.performanceMetrics.avgLoss.toFixed(2)}</div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 md:col-span-2">
                <div className="text-sm text-slate-400 mb-2">Profit Factor</div>
                <div className="text-3xl font-bold text-yellow-400">{analytics.performanceMetrics.profitFactor.toFixed(2)}</div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profit Timeline Chart */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Profit Timeline</h3>
                <div className="h-80">
                  <Line data={profitChartData} options={chartOptions} />
                </div>
              </div>

              {/* Trade Distribution Pie Chart */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Trade Distribution</h3>
                <div className="h-80 flex items-center justify-center">
                  <Pie
                    data={tradeDistributionData}
                    options={{
                      ...chartOptions,
                      scales: undefined,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Top Performing Tokens */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Top Performing Tokens</h3>
              <div className="h-80">
                <Bar data={topTokensData} options={chartOptions} />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
