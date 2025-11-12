/**
 * WebSocket Hook for Real-Time Updates
 * Connects to backend Socket.IO server for live trading data
 */

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'

export interface TradeUpdate {
  id: string
  timestamp: number
  type: 'BUY' | 'SELL'
  chain: 'BNB' | 'POLYGON'
  tokenIn: string
  tokenOut: string
  amountIn: string
  amountOut: string
  profit?: number
  status: 'SUCCESS' | 'FAILED' | 'PENDING'
}

export interface BotStatusUpdate {
  dex: {
    status: 'RUNNING' | 'STOPPED' | 'ERROR'
    lastTrade?: number
  }
  polymarket: {
    status: 'RUNNING' | 'STOPPED' | 'ERROR'
    lastTrade?: number
  }
}

export interface PriceUpdate {
  tokenAddress: string
  symbol: string
  price: number
  priceChange24h: number
}

export interface OpportunityUpdate {
  type: 'arbitrage' | 'flash_loan' | 'cross_chain'
  expectedProfit: number
  confidence: number
  details: any
}

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastTrade, setLastTrade] = useState<TradeUpdate | null>(null)
  const [botStatus, setBotStatus] = useState<BotStatusUpdate | null>(null)
  const [latestPrice, setLatestPrice] = useState<PriceUpdate | null>(null)
  const [newOpportunity, setNewOpportunity] = useState<OpportunityUpdate | null>(null)

  useEffect(() => {
    // Initialize Socket.IO connection
    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket

    // Connection events
    socket.on('connect', () => {
      console.log('✅ WebSocket connected')
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected')
      setIsConnected(false)
    })

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      setIsConnected(false)
    })

    // Trading events
    socket.on('trade_executed', (data: TradeUpdate) => {
      console.log('💱 Trade executed:', data)
      setLastTrade(data)
    })

    socket.on('bot_status_update', (data: BotStatusUpdate) => {
      console.log('🤖 Bot status update:', data)
      setBotStatus(data)
    })

    // Price updates
    socket.on('price_update', (data: PriceUpdate) => {
      setLatestPrice(data)
    })

    // Opportunity alerts
    socket.on('opportunity_found', (data: OpportunityUpdate) => {
      console.log('💰 New opportunity:', data)
      setNewOpportunity(data)
    })

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  // Subscribe to specific token prices
  const subscribeToToken = (tokenAddress: string) => {
    if (socketRef.current) {
      socketRef.current.emit('subscribe_token', { tokenAddress })
    }
  }

  // Unsubscribe from token prices
  const unsubscribeFromToken = (tokenAddress: string) => {
    if (socketRef.current) {
      socketRef.current.emit('unsubscribe_token', { tokenAddress })
    }
  }

  // Request bot status update
  const refreshBotStatus = () => {
    if (socketRef.current) {
      socketRef.current.emit('request_bot_status')
    }
  }

  return {
    isConnected,
    lastTrade,
    botStatus,
    latestPrice,
    newOpportunity,
    subscribeToToken,
    unsubscribeFromToken,
    refreshBotStatus,
  }
}

export default useWebSocket
