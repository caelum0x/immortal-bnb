/**
 * Trading Interface Component
 * Manual trade execution interface with token search, order preview, and transaction confirmation
 */

'use client'

import { useState, useEffect } from 'react'
import { useWeb3 } from '@/components/providers/Web3Provider'

interface TokenSearchResult {
  address: string
  symbol: string
  name: string
  priceUsd: string
  liquidity: number
  volume24h: number
}

interface TradePreview {
  inputAmount: number
  outputAmount: number
  priceImpact: number
  minimumReceived: number
  slippage: number
  gasFee: number
}

export default function TradingInterface() {
  const { isConnected, address } = useWeb3()

  // State
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')
  const [tokenAddress, setTokenAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [slippage, setSlippage] = useState(2) // 2% default
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<TokenSearchResult[]>([])
  const [selectedToken, setSelectedToken] = useState<TokenSearchResult | null>(null)
  const [preview, setPreview] = useState<TradePreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  // Search tokens
  const searchToken = async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([])
      return
    }

    try {
      setSearching(true)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_URL}/api/search-tokens?q=${encodeURIComponent(query)}`)

      if (!response.ok) {
        throw new Error('Failed to search tokens')
      }

      const data = await response.json()
      setSearchResults(data.tokens || [])
    } catch (err) {
      console.error('Search error:', err)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  // Select token
  const selectToken = (token: TokenSearchResult) => {
    setSelectedToken(token)
    setTokenAddress(token.address)
    setSearchResults([])
    setError(null)
  }

  // Get trade preview
  const getPreview = async () => {
    if (!selectedToken || !amount || parseFloat(amount) <= 0) {
      setPreview(null)
      return
    }

    try {
      setLoading(true)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_URL}/api/trade-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenAddress: selectedToken.address,
          action: tradeType,
          amountBNB: parseFloat(amount),
          slippagePercent: slippage,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get preview')
      }

      const data = await response.json()
      setPreview(data.preview)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
      setPreview(null)
    } finally {
      setLoading(false)
    }
  }

  // Execute trade
  const executeTrade = async () => {
    if (!selectedToken || !amount || !preview) {
      return
    }

    try {
      setConfirming(true)
      setError(null)
      setTxHash(null)

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_URL}/api/execute-trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenAddress: selectedToken.address,
          action: tradeType,
          amountBNB: parseFloat(amount),
          slippagePercent: slippage,
          userAddress: address,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Trade execution failed')
      }

      const data = await response.json()
      setTxHash(data.txHash)

      // Reset form
      setTimeout(() => {
        setAmount('')
        setPreview(null)
        setSelectedToken(null)
        setTokenAddress('')
        setTxHash(null)
      }, 5000)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setConfirming(false)
    }
  }

  // Update preview when amount or slippage changes
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (selectedToken && amount) {
        getPreview()
      }
    }, 500)

    return () => clearTimeout(debounce)
  }, [amount, slippage, selectedToken, tradeType])

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Manual Trading</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setTradeType('buy')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              tradeType === 'buy'
                ? 'bg-green-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setTradeType('sell')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              tradeType === 'sell'
                ? 'bg-red-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            Sell
          </button>
        </div>
      </div>

      {/* Not Connected Warning */}
      {!isConnected && (
        <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 p-4 rounded-lg mb-6">
          <p className="font-semibold">⚠️ Wallet Not Connected</p>
          <p className="text-sm">Please connect your wallet to execute trades</p>
        </div>
      )}

      {/* Token Search */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-400 mb-2">
          Search Token
        </label>
        <div className="relative">
          <input
            type="text"
            value={selectedToken ? selectedToken.symbol : tokenAddress}
            onChange={(e) => {
              setTokenAddress(e.target.value)
              searchToken(e.target.value)
            }}
            placeholder="Enter token symbol or address..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
              {searchResults.map((token) => (
                <button
                  key={token.address}
                  onClick={() => selectToken(token)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors border-b border-slate-800 last:border-b-0"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-white">{token.symbol}</div>
                      <div className="text-xs text-slate-400">{token.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white">${token.priceUsd}</div>
                      <div className="text-xs text-slate-400">
                        Vol: ${(token.volume24h / 1000000).toFixed(2)}M
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {searching && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          )}
        </div>

        {/* Selected Token Info */}
        {selectedToken && (
          <div className="mt-3 p-4 bg-slate-900/50 rounded-lg border border-purple-500/30">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold text-white">{selectedToken.symbol}</div>
                <div className="text-sm text-slate-400">{selectedToken.name}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-white">${selectedToken.priceUsd}</div>
                <div className="text-xs text-slate-400">
                  Liq: ${(selectedToken.liquidity / 1000000).toFixed(2)}M
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Amount Input */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-400 mb-2">
          Amount (BNB)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          step="0.01"
          min="0"
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Slippage Settings */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-400 mb-2">
          Slippage Tolerance
        </label>
        <div className="flex space-x-2">
          {[1, 2, 5].map((value) => (
            <button
              key={value}
              onClick={() => setSlippage(value)}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                slippage === value
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {value}%
            </button>
          ))}
          <input
            type="number"
            value={slippage}
            onChange={(e) => setSlippage(parseFloat(e.target.value) || 0)}
            className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-center focus:outline-none focus:border-purple-500"
            step="0.1"
            min="0"
            max="50"
          />
        </div>
      </div>

      {/* Trade Preview */}
      {preview && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg">
          <h3 className="text-sm font-semibold text-white mb-3">Trade Preview</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">You Pay:</span>
              <span className="text-white font-semibold">{preview.inputAmount.toFixed(4)} BNB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">You Receive:</span>
              <span className="text-white font-semibold">~{preview.outputAmount.toFixed(4)} {selectedToken?.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Minimum Received:</span>
              <span className="text-white">{preview.minimumReceived.toFixed(4)} {selectedToken?.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Price Impact:</span>
              <span className={`font-semibold ${preview.priceImpact > 5 ? 'text-red-400' : preview.priceImpact > 2 ? 'text-yellow-400' : 'text-green-400'}`}>
                {preview.priceImpact.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Gas Fee:</span>
              <span className="text-white">~{preview.gasFee.toFixed(4)} BNB</span>
            </div>
          </div>

          {/* Price Impact Warning */}
          {preview.priceImpact > 5 && (
            <div className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-xs font-semibold">
                ⚠️ High price impact! Consider reducing your trade size.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm font-semibold">❌ {error}</p>
        </div>
      )}

      {/* Success Message */}
      {txHash && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
          <p className="text-green-400 text-sm font-semibold mb-2">✅ Trade Executed Successfully!</p>
          <a
            href={`https://bscscan.com/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 text-xs hover:underline"
          >
            View on BscScan →
          </a>
        </div>
      )}

      {/* Execute Button */}
      <button
        onClick={executeTrade}
        disabled={!isConnected || !selectedToken || !amount || !preview || confirming || loading}
        className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
          tradeType === 'buy'
            ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
            : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
        } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {confirming ? (
          <span className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
            Confirming...
          </span>
        ) : loading ? (
          'Loading Preview...'
        ) : !isConnected ? (
          'Connect Wallet'
        ) : !selectedToken ? (
          'Select Token'
        ) : !amount ? (
          'Enter Amount'
        ) : (
          `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${selectedToken.symbol}`
        )}
      </button>

      {/* Disclaimer */}
      <div className="mt-4 p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
        <p className="text-xs text-slate-400">
          ⚠️ Trading cryptocurrencies involves risk. Always do your own research and never invest more than you can afford to lose.
        </p>
      </div>
    </div>
  )
}
