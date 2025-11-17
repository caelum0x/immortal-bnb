'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts'

export type ChartInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

interface TradingViewChartProps {
  tokenId: string
  interval?: ChartInterval
  height?: number
  showVolumeChart?: boolean
}

interface OHLCVData {
  open: number
  high: number
  low: number
  close: number
  volume: number
  timestamp: number
}

export default function TradingViewChart({
  tokenId,
  interval = '1h',
  height = 500,
  showVolumeChart = true,
}: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentInterval, setCurrentInterval] = useState<ChartInterval>(interval)

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { color: '#0f172a' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      crosshair: {
        mode: 1, // Magnet mode
        vertLine: {
          color: '#64748b',
          width: 1,
          style: 2,
          labelBackgroundColor: '#7c3aed',
        },
        horzLine: {
          color: '#64748b',
          width: 1,
          style: 2,
          labelBackgroundColor: '#7c3aed',
        },
      },
      timeScale: {
        borderColor: '#334155',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#334155',
        scaleMargins: {
          top: 0.1,
          bottom: showVolumeChart ? 0.3 : 0.1,
        },
      },
    })

    chartRef.current = chart

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    })

    candlestickSeriesRef.current = candlestickSeries

    // Add volume series if enabled
    if (showVolumeChart) {
      const volumeSeries = chart.addHistogramSeries({
        color: '#64748b',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
        scaleMargins: {
          top: 0.7,
          bottom: 0,
        },
      })

      volumeSeriesRef.current = volumeSeries
    }

    // Handle window resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [height, showVolumeChart])

  // Fetch and update chart data
  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current) return

    const fetchChartData = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          `/api/prices/${tokenId}/ohlcv?interval=${currentInterval}&limit=200`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch chart data')
        }

        const data = await response.json()
        const ohlcv: OHLCVData[] = data.ohlcv

        if (!ohlcv || ohlcv.length === 0) {
          throw new Error('No chart data available')
        }

        // Convert to TradingView format
        const candlestickData: CandlestickData[] = ohlcv.map((candle) => ({
          time: (candle.timestamp / 1000) as Time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }))

        const volumeData = ohlcv.map((candle) => ({
          time: (candle.timestamp / 1000) as Time,
          value: candle.volume,
          color: candle.close >= candle.open ? '#10b98180' : '#ef444480',
        }))

        // Update chart
        candlestickSeriesRef.current?.setData(candlestickData)

        if (volumeSeriesRef.current && showVolumeChart) {
          volumeSeriesRef.current.setData(volumeData)
        }

        // Fit content
        chartRef.current?.timeScale().fitContent()

        setLoading(false)
      } catch (err: any) {
        console.error('Failed to fetch chart data:', err)
        setError(err.message || 'Failed to load chart')
        setLoading(false)
      }
    }

    fetchChartData()

    // Refresh chart data periodically
    const refreshInterval = getRefreshInterval(currentInterval)
    const intervalId = setInterval(fetchChartData, refreshInterval)

    return () => clearInterval(intervalId)
  }, [tokenId, currentInterval, showVolumeChart])

  // Subscribe to real-time price updates via WebSocket
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!candlestickSeriesRef.current) return

    // WebSocket integration for real-time updates (requires socket.io-client)
    // Uncomment when WebSocket server is ready
    // import io from 'socket.io-client'
    // const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
    // socket.on('priceUpdate', (data) => {
    //   if (data.tokenId === tokenId && candlestickSeriesRef.current) {
    //     candlestickSeriesRef.current.update({
    //       time: Math.floor(Date.now() / 1000) as Time,
    //       close: data.price,
    //     })
    //   }
    // })
    // return () => { socket.disconnect() }
  }, [tokenId])

  const getRefreshInterval = (interval: ChartInterval): number => {
    const intervals: Record<ChartInterval, number> = {
      '1m': 60 * 1000, // 1 minute
      '5m': 5 * 60 * 1000, // 5 minutes
      '15m': 15 * 60 * 1000, // 15 minutes
      '1h': 60 * 60 * 1000, // 1 hour
      '4h': 4 * 60 * 60 * 1000, // 4 hours
      '1d': 24 * 60 * 60 * 1000, // 24 hours
    }

    return intervals[interval]
  }

  const handleIntervalChange = (newInterval: ChartInterval) => {
    setCurrentInterval(newInterval)
  }

  const intervalButtons: ChartInterval[] = ['1m', '5m', '15m', '1h', '4h', '1d']

  return (
    <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg overflow-hidden">
      {/* Chart Controls */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white">Price Chart</h3>

        {/* Interval Selector */}
        <div className="flex space-x-2">
          {intervalButtons.map((int) => (
            <button
              key={int}
              onClick={() => handleIntervalChange(int)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                currentInterval === int
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {int}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-slate-300">Loading chart data...</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-10">
            <div className="text-center p-6">
              <p className="text-red-400 mb-2">⚠️ {error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div ref={chartContainerRef} />
      </div>

      {/* Chart Info */}
      <div className="flex items-center justify-between p-4 bg-slate-900/50 border-t border-slate-700">
        <div className="text-sm text-slate-400">
          <span className="font-medium text-white">Interval:</span> {currentInterval}
        </div>
        <div className="text-sm text-slate-400">
          <span className="font-medium text-white">Token:</span> {tokenId.slice(0, 10)}...
        </div>
      </div>
    </div>
  )
}
