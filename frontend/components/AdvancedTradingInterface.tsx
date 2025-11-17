'use client'

import { useState, useEffect } from 'react'
import { useWeb3 } from './providers/Web3Provider'

export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'TRAILING_STOP'
export type TradeSide = 'BUY' | 'SELL'
export type OrderStatus = 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'EXPIRED'

interface Order {
  id: string
  marketId: string
  marketQuestion: string
  tokenId: string
  outcome: string
  side: TradeSide
  type: OrderType
  amount: number
  price: number | null
  filledAmount: number
  remainingAmount: number
  stopLoss: number | null
  takeProfit: number | null
  trailingStop: number | null
  status: OrderStatus
  createdAt: string
  executedAt: string | null
  cancelledAt: string | null
}

interface AdvancedTradingInterfaceProps {
  marketId: string
  marketQuestion: string
  tokenId: string
  outcome?: string
  currentPrice: number
}

export default function AdvancedTradingInterface({
  marketId,
  marketQuestion,
  tokenId,
  outcome = '',
  currentPrice,
}: AdvancedTradingInterfaceProps) {
  const { isConnected, address } = useWeb3()

  // Order form state
  const [orderType, setOrderType] = useState<OrderType>('MARKET')
  const [tradeSide, setTradeSide] = useState<TradeSide>('BUY')
  const [amount, setAmount] = useState('')
  const [limitPrice, setLimitPrice] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [takeProfit, setTakeProfit] = useState('')
  const [trailingStop, setTrailingStop] = useState('')

  // Orders state
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'create' | 'open' | 'history'>('create')

  // Success/error messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch user orders
  useEffect(() => {
    if (!isConnected || !address) return
    fetchOrders()
  }, [isConnected, address, activeTab])

  const fetchOrders = async () => {
    if (!address) return

    try {
      setLoadingOrders(true)
      const params = new URLSearchParams({
        userId: address,
        ...(activeTab === 'open' && { status: 'OPEN' }),
      })

      const res = await fetch(`/api/orders?${params}`)
      if (!res.ok) throw new Error('Failed to fetch orders')

      const data = await res.json()
      setOrders(data.orders)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!address) {
      setErrorMessage('Please connect your wallet')
      return
    }

    if (!amount) {
      setErrorMessage('Please enter an amount')
      return
    }

    try {
      setSubmitting(true)
      setErrorMessage(null)
      setSuccessMessage(null)

      const orderData: any = {
        userId: address,
        marketId,
        marketQuestion,
        tokenId,
        outcome,
        side: tradeSide,
        type: orderType,
        amount: parseFloat(amount),
      }

      // Add price fields based on order type
      if (orderType === 'LIMIT' && limitPrice) {
        orderData.price = parseFloat(limitPrice)
      }
      if (orderType === 'STOP_LOSS' && stopLoss) {
        orderData.stopLoss = parseFloat(stopLoss)
      }
      if (orderType === 'TAKE_PROFIT' && takeProfit) {
        orderData.takeProfit = parseFloat(takeProfit)
      }
      if (orderType === 'TRAILING_STOP' && trailingStop) {
        orderData.trailingStop = parseFloat(trailingStop)
      }

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create order')
      }

      const data = await res.json()
      setSuccessMessage(`Order created successfully! ID: ${data.order.id.slice(0, 8)}...`)

      // Reset form
      setAmount('')
      setLimitPrice('')
      setStopLoss('')
      setTakeProfit('')
      setTrailingStop('')

      // Refresh orders
      setTimeout(() => fetchOrders(), 1000)

    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to create order')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!address || !confirm('Are you sure you want to cancel this order?')) return

    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: address }),
      })

      if (!res.ok) throw new Error('Failed to cancel order')

      setSuccessMessage('Order cancelled successfully!')
      fetchOrders()

    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to cancel order')
    }
  }

  const getOrderTypeColor = (type: OrderType): string => {
    const colors = {
      MARKET: 'text-purple-400',
      LIMIT: 'text-blue-400',
      STOP_LOSS: 'text-red-400',
      TAKE_PROFIT: 'text-green-400',
      TRAILING_STOP: 'text-yellow-400',
    }
    return colors[type] || 'text-slate-400'
  }

  const getStatusColor = (status: OrderStatus): string => {
    const colors = {
      OPEN: 'bg-blue-900/30 text-blue-400',
      PARTIALLY_FILLED: 'bg-yellow-900/30 text-yellow-400',
      FILLED: 'bg-green-900/30 text-green-400',
      CANCELLED: 'bg-red-900/30 text-red-400',
      EXPIRED: 'bg-slate-900/30 text-slate-400',
    }
    return colors[status] || 'bg-slate-900/30 text-slate-400'
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-slate-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === 'create'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Order
          </button>
          <button
            onClick={() => setActiveTab('open')}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === 'open'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Open Orders
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Order History
          </button>
        </nav>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
          <p className="text-green-400">✅ {successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400">⚠️ {errorMessage}</p>
        </div>
      )}

      {/* Create Order Tab */}
      {activeTab === 'create' && (
        <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-white mb-6">Create New Order</h3>

          {/* Current Price Display */}
          <div className="mb-6 p-4 bg-slate-900/50 rounded-lg">
            <p className="text-slate-400 text-sm mb-1">Current Market Price</p>
            <p className="text-3xl font-bold text-white">${currentPrice.toFixed(4)}</p>
          </div>

          <form onSubmit={handleSubmitOrder} className="space-y-6">
            {/* Buy/Sell Toggle */}
            <div>
              <label className="block text-white font-medium mb-2">Order Side</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTradeSide('BUY')}
                  className={`px-6 py-3 rounded-lg font-bold transition-all ${
                    tradeSide === 'BUY'
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Buy
                </button>
                <button
                  type="button"
                  onClick={() => setTradeSide('SELL')}
                  className={`px-6 py-3 rounded-lg font-bold transition-all ${
                    tradeSide === 'SELL'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Sell
                </button>
              </div>
            </div>

            {/* Order Type Selection */}
            <div>
              <label htmlFor="orderType" className="block text-white font-medium mb-2">
                Order Type
              </label>
              <select
                id="orderType"
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as OrderType)}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="MARKET">Market - Execute immediately at current price</option>
                <option value="LIMIT">Limit - Execute at specific price or better</option>
                <option value="STOP_LOSS">Stop Loss - Exit position at stop price</option>
                <option value="TAKE_PROFIT">Take Profit - Lock in profits at target price</option>
                <option value="TRAILING_STOP">Trailing Stop - Dynamic stop loss</option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-white font-medium mb-2">
                Amount
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                step="0.01"
                min="0"
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                required
              />
            </div>

            {/* Conditional Fields Based on Order Type */}
            {orderType === 'LIMIT' && (
              <div>
                <label htmlFor="limitPrice" className="block text-white font-medium mb-2">
                  Limit Price
                </label>
                <input
                  type="number"
                  id="limitPrice"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  placeholder={`Current: $${currentPrice.toFixed(4)}`}
                  step="0.0001"
                  min="0"
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
              </div>
            )}

            {orderType === 'STOP_LOSS' && (
              <div>
                <label htmlFor="stopLoss" className="block text-white font-medium mb-2">
                  Stop Loss Price
                </label>
                <input
                  type="number"
                  id="stopLoss"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  placeholder={`Below: $${currentPrice.toFixed(4)}`}
                  step="0.0001"
                  min="0"
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
                <p className="text-slate-400 text-sm mt-2">
                  {tradeSide === 'SELL'
                    ? 'Sell when price drops to this level'
                    : 'Buy when price rises to this level'}
                </p>
              </div>
            )}

            {orderType === 'TAKE_PROFIT' && (
              <div>
                <label htmlFor="takeProfit" className="block text-white font-medium mb-2">
                  Take Profit Price
                </label>
                <input
                  type="number"
                  id="takeProfit"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  placeholder={`Above: $${currentPrice.toFixed(4)}`}
                  step="0.0001"
                  min="0"
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
                <p className="text-slate-400 text-sm mt-2">
                  {tradeSide === 'SELL'
                    ? 'Sell when price rises to this level'
                    : 'Buy when price drops to this level'}
                </p>
              </div>
            )}

            {orderType === 'TRAILING_STOP' && (
              <div>
                <label htmlFor="trailingStop" className="block text-white font-medium mb-2">
                  Trailing Stop Percentage (%)
                </label>
                <input
                  type="number"
                  id="trailingStop"
                  value={trailingStop}
                  onChange={(e) => setTrailingStop(e.target.value)}
                  placeholder="e.g., 5 for 5%"
                  step="0.1"
                  min="0.1"
                  max="100"
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
                <p className="text-slate-400 text-sm mt-2">
                  Dynamic stop that trails the market by this percentage
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !amount}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {submitting ? 'Creating Order...' : `Create ${tradeSide} Order`}
            </button>
          </form>
        </div>
      )}

      {/* Open Orders & History Tabs */}
      {(activeTab === 'open' || activeTab === 'history') && (
        <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-white mb-6">
            {activeTab === 'open' ? 'Open Orders' : 'Order History'}
          </h3>

          {loadingOrders ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-slate-300">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg mb-2">No {activeTab} orders</p>
              <p className="text-slate-500">
                {activeTab === 'open' ? 'Create an order to get started' : 'You haven\'t placed any orders yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-slate-400 font-medium py-3 px-4">Type</th>
                    <th className="text-left text-slate-400 font-medium py-3 px-4">Side</th>
                    <th className="text-left text-slate-400 font-medium py-3 px-4">Amount</th>
                    <th className="text-left text-slate-400 font-medium py-3 px-4">Price</th>
                    <th className="text-left text-slate-400 font-medium py-3 px-4">Filled</th>
                    <th className="text-left text-slate-400 font-medium py-3 px-4">Status</th>
                    <th className="text-left text-slate-400 font-medium py-3 px-4">Created</th>
                    {activeTab === 'open' && (
                      <th className="text-left text-slate-400 font-medium py-3 px-4">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                      <td className="py-4 px-4">
                        <span className={`font-semibold ${getOrderTypeColor(order.type)}`}>
                          {order.type}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={order.side === 'BUY' ? 'text-green-400' : 'text-red-400'}>
                          {order.side}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-white">{order.amount.toFixed(2)}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-white">
                          {order.price ? `$${order.price.toFixed(4)}` : 'Market'}
                        </p>
                        {order.stopLoss && (
                          <p className="text-red-400 text-sm">SL: ${order.stopLoss.toFixed(4)}</p>
                        )}
                        {order.takeProfit && (
                          <p className="text-green-400 text-sm">TP: ${order.takeProfit.toFixed(4)}</p>
                        )}
                        {order.trailingStop && (
                          <p className="text-yellow-400 text-sm">Trail: {order.trailingStop}%</p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-white">
                          {order.filledAmount.toFixed(2)} / {order.amount.toFixed(2)}
                        </p>
                        <p className="text-slate-500 text-sm">
                          {((order.filledAmount / order.amount) * 100).toFixed(1)}%
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-slate-300 text-sm">{formatDate(order.createdAt)}</p>
                      </td>
                      {activeTab === 'open' && (
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
