'use client'

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { usePerformanceData } from '@/lib/hooks'

export default function PerformanceChart() {
  const [timeframe, setTimeframe] = useState('24h')
  const { 
    totalProfit, 
    profitChange, 
    chartData, 
    stats,
    isLoading, 
    error 
  } = usePerformanceData(timeframe)

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Performance</h2>
        <div className="flex space-x-2">
          {['24h', '7d', '30d'].map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                timeframe === period
                  ? 'bg-purple-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-3 rounded-lg mb-4 text-sm">
          Failed to load performance data: {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/3"></div>
          <div className="h-4 bg-slate-700 rounded w-1/4"></div>
          <div className="h-64 bg-slate-700 rounded"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="h-6 bg-slate-700 rounded mb-1"></div>
              <div className="h-3 bg-slate-700 rounded"></div>
            </div>
            <div className="text-center">
              <div className="h-6 bg-slate-700 rounded mb-1"></div>
              <div className="h-3 bg-slate-700 rounded"></div>
            </div>
            <div className="text-center">
              <div className="h-6 bg-slate-700 rounded mb-1"></div>
              <div className="h-3 bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <div className="text-2xl font-bold text-white mb-1">${totalProfit}</div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${
                profitChange.startsWith('+') ? 'text-green-400' : 
                profitChange.startsWith('-') ? 'text-red-400' : 'text-slate-400'
              }`}>
                {profitChange}%
              </span>
              <span className="text-slate-400 text-sm">vs last {timeframe}</span>
            </div>
          </div>

          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#9CA3AF" 
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9CA3AF" 
                    fontSize={12}
                    domain={['dataMin - 50', 'dataMax + 50']}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#F8FAFC'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center">
                  <div className="text-lg mb-2">No performance data</div>
                  <div className="text-sm">Start trading to see performance chart</div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-700">
            <div className="text-center">
              <div className={`text-lg font-semibold ${
                stats.todayProfit.startsWith('+') ? 'text-green-400' : 
                stats.todayProfit.startsWith('-') ? 'text-red-400' : 'text-slate-400'
              }`}>
                {stats.todayProfit}
              </div>
              <div className="text-xs text-slate-400">Today</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-400">{stats.todayTrades}</div>
              <div className="text-xs text-slate-400">Trades</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-400">{stats.todayWinRate}%</div>
              <div className="text-xs text-slate-400">Win Rate</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
