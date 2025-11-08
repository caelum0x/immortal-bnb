'use client'

import { useTradingHistory } from '@/lib/hooks'

export default function TradingHistory() {
  const { trades, total, isLoading, error, refresh } = useTradingHistory(10)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/20'
      case 'pending': return 'text-yellow-400 bg-yellow-500/20'
      case 'failed': return 'text-red-400 bg-red-500/20'
      default: return 'text-slate-400 bg-slate-500/20'
    }
  }

  const getTypeColor = (type: string) => {
    return type === 'buy' ? 'text-blue-400' : 'text-orange-400'
  }

  const getPnlColor = (pnl?: string) => {
    if (!pnl) return 'text-slate-400'
    return pnl.startsWith('+') ? 'text-green-400' : 'text-red-400'
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Trading History</h2>
        <div className="flex items-center space-x-2">
          {total > 0 && (
            <span className="text-sm text-slate-400">
              Showing {trades.length} of {total}
            </span>
          )}
          <button 
            onClick={refresh}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-3 rounded-lg mb-4 text-sm">
          Failed to load trading history: {error}
          <button
            onClick={refresh}
            className="ml-2 underline hover:no-underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="h-4 bg-slate-700 rounded w-20"></div>
                  <div className="h-4 bg-slate-700 rounded w-12"></div>
                  <div className="h-4 bg-slate-700 rounded w-16"></div>
                </div>
                <div className="h-4 bg-slate-700 rounded w-16"></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="h-3 bg-slate-700 rounded w-32"></div>
                <div className="h-3 bg-slate-700 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-900/70 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="font-semibold text-white">{trade.pair}</span>
                  <span className={`text-sm font-medium capitalize ${getTypeColor(trade.type)}`}>
                    {trade.type}
                  </span>
                  <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(trade.status)}`}>
                    {trade.status}
                  </div>
                </div>
                {trade.pnl && (
                  <div className={`text-sm font-medium ${getPnlColor(trade.pnl)}`}>
                    {trade.pnl}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="text-slate-400">
                  {trade.amount} BNB @ {trade.price}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-slate-500 text-xs">
                    {new Date(trade.timestamp).toLocaleString()}
                  </div>
                  {trade.txHash && (
                    <button
                      onClick={() => window.open(`https://bscscan.com/tx/${trade.txHash}`, '_blank')}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      View Tx
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && trades.length === 0 && (
        <div className="text-center py-8">
          <div className="text-slate-400 mb-2">No trades yet</div>
          <div className="text-sm text-slate-500">
            Start the bot to see trading history
          </div>
        </div>
      )}

      {/* View All Button */}
      {trades.length > 0 && total > trades.length && (
        <div className="mt-4 text-center">
          <button className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
            View All {total} Trades
          </button>
        </div>
      )}
    </div>
  )
}
