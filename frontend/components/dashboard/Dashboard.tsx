'use client'

import { useDashboardStats } from '@/lib/hooks'

export default function Dashboard() {
  const {
    totalProfit,
    profitChange,
    totalTrades,
    successRate,
    activePositions,
    daysProfitable,
    aiStatus,
    isLoading,
    error,
  } = useDashboardStats()

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Dashboard</h2>
        <div className="text-xs text-slate-400">Last 30 days</div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-3 rounded-lg mb-4 text-sm">
          Failed to load dashboard stats: {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="h-4 bg-slate-700 rounded w-1/3 mb-2"></div>
            <div className="h-8 bg-slate-700 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-slate-700 rounded w-1/4"></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-900/50 rounded-lg p-3">
                <div className="h-6 bg-slate-700 rounded mb-2"></div>
                <div className="h-3 bg-slate-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Total Profit */}
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Total Profit</div>
                <div className="text-2xl font-bold text-green-400">${totalProfit}</div>
              </div>
              <div className="text-right">
                <div className={`text-sm ${
                  profitChange?.startsWith('+') ? 'text-green-400' : 
                  profitChange?.startsWith('-') ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {profitChange || '0'}%
                </div>
                <div className="text-xs text-slate-400">This month</div>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/50 rounded-lg p-3">
              <div className="text-lg font-semibold text-white">{totalTrades}</div>
              <div className="text-xs text-slate-400">Total Trades</div>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-3">
              <div className="text-lg font-semibold text-blue-400">{successRate}%</div>
              <div className="text-xs text-slate-400">Success Rate</div>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-3">
              <div className="text-lg font-semibold text-purple-400">{activePositions}</div>
              <div className="text-xs text-slate-400">Active Positions</div>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-3">
              <div className="text-lg font-semibold text-yellow-400">{daysProfitable}</div>
              <div className="text-xs text-slate-400">Profitable Days</div>
            </div>
          </div>

          {/* AI Status */}
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className={`w-3 h-3 rounded-full ${
                aiStatus.isLearning ? 'bg-purple-500 animate-pulse' : 'bg-slate-500'
              }`}></div>
              <span className="text-sm font-medium text-white">AI Learning Status</span>
              <div className="ml-auto text-xs text-purple-400">
                Confidence: {aiStatus.confidence}%
              </div>
            </div>
            <div className="text-xs text-slate-300 leading-relaxed">
              {aiStatus.isLearning ? (
                `The AI has processed ${aiStatus.memoryCount} memories and is actively learning from market patterns. Current confidence level: ${aiStatus.confidence > 70 ? 'High' : aiStatus.confidence > 40 ? 'Medium' : 'Low'}.`
              ) : (
                'AI learning is currently paused. Memory evolution will resume when bot is active.'
              )}
            </div>
            {aiStatus.lastUpdate && (
              <div className="text-xs text-slate-500 mt-2">
                Last updated: {new Date(aiStatus.lastUpdate).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
