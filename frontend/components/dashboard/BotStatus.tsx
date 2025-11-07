'use client'

import { useBotStatus } from '@/lib/hooks'

export default function BotStatus() {
  const {
    status,
    lastAction,
    totalTrades,
    successRate,
    isLoading,
    error,
    isToggling,
    toggleBot,
  } = useBotStatus();

  const getStatusColor = () => {
    switch (status) {
      case 'running': return 'text-green-400'
      case 'stopped': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      default: return 'text-slate-400'
    }
  }

  const getStatusBg = () => {
    switch (status) {
      case 'running': return 'bg-green-500/20 border-green-500/30'
      case 'stopped': return 'bg-yellow-500/20 border-yellow-500/30'
      case 'error': return 'bg-red-500/20 border-red-500/30'
      default: return 'bg-slate-500/20 border-slate-500/30'
    }
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Bot Status</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBg()} ${getStatusColor()}`}>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${status === 'running' ? 'bg-green-500 animate-pulse' : status === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
            <span className="capitalize">{status}</span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-4 mb-6">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
            <div className="h-6 bg-slate-700 rounded w-1/2"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4 animate-pulse">
              <div className="h-8 bg-slate-700 rounded mb-2"></div>
              <div className="h-4 bg-slate-700 rounded"></div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 animate-pulse">
              <div className="h-8 bg-slate-700 rounded mb-2"></div>
              <div className="h-4 bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Main Status Display */}
          <div className="space-y-4 mb-6">
            <div>
              <div className="text-sm text-slate-400 mb-1">Current Action</div>
              <div className="text-white font-medium">{lastAction}</div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{totalTrades}</div>
                <div className="text-sm text-slate-400">Total Trades</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">{successRate}%</div>
                <div className="text-sm text-slate-400">Success Rate</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Control Button */}
      <div className="space-y-4">
        <button
          onClick={toggleBot}
          disabled={isToggling || isLoading}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
            status === 'running' 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isToggling ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{status === 'running' ? 'Stopping...' : 'Starting...'}</span>
            </div>
          ) : (
            status === 'running' ? 'Stop Bot' : 'Start Bot'
          )}
        </button>

        {status === 'running' && (
          <div className="text-xs text-slate-400 text-center">
            Bot is actively monitoring the market and will execute trades when opportunities are found.
          </div>
        )}
      </div>
    </div>
  )
}
