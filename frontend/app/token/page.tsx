'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { useWeb3 } from '@/components/providers/Web3Provider'

interface TokenInfo {
  name: string
  symbol: string
  decimals: number
  totalSupply: string
  liquidityWallet: string
  stakingContract: string
  taxPercentage: number
  burnPercentage: number
  liquidityPercentage: number
  network: string
}

interface TokenBalance {
  address: string
  balance: string
  balanceFormatted: string
}

interface TokenStats {
  totalHolders: number
  circulatingSupply: string
  burnedAmount: string
  stakingContractBalance: string
  liquidityPoolBalance: string
  marketCap?: string
  price?: string
}

export default function TokenPage() {
  const { isConnected, address } = useWeb3()
  const router = useRouter()

  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null)
  const [tokenStats, setTokenStats] = useState<TokenStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [transferAmount, setTransferAmount] = useState('')
  const [transferRecipient, setTransferRecipient] = useState('')
  const [transferLoading, setTransferLoading] = useState(false)
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null)

  // Redirect to landing if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push('/')
    }
  }, [isConnected, router])

  // Fetch token data
  useEffect(() => {
    if (!isConnected) return

    const fetchTokenData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch token info
        const infoRes = await fetch('/api/token/info')
        if (!infoRes.ok) {
          const errorData = await infoRes.json()
          throw new Error(errorData.message || 'Failed to fetch token info')
        }
        const info = await infoRes.json()
        setTokenInfo(info)

        // Fetch user balance
        if (address) {
          const balanceRes = await fetch(`/api/token/balance/${address}`)
          if (balanceRes.ok) {
            const balance = await balanceRes.json()
            setTokenBalance(balance)
          }
        }

        // Fetch token stats
        const statsRes = await fetch('/api/token/stats')
        if (statsRes.ok) {
          const stats = await statsRes.json()
          setTokenStats(stats)
        }

      } catch (err: any) {
        console.error('Failed to fetch token data:', err)
        setError(err.message || 'Failed to load token data')
      } finally {
        setLoading(false)
      }
    }

    fetchTokenData()
  }, [isConnected, address])

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!transferRecipient || !transferAmount) {
      alert('Please enter recipient address and amount')
      return
    }

    try {
      setTransferLoading(true)
      setTransferSuccess(null)

      const res = await fetch('/api/token/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: transferRecipient,
          amount: transferAmount,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Transfer failed')
      }

      const data = await res.json()
      setTransferSuccess(data.txHash)
      setTransferAmount('')
      setTransferRecipient('')

      // Refresh balance
      if (address) {
        const balanceRes = await fetch(`/api/token/balance/${address}`)
        if (balanceRes.ok) {
          const balance = await balanceRes.json()
          setTokenBalance(balance)
        }
      }

    } catch (err: any) {
      alert(err.message || 'Transfer failed')
    } finally {
      setTransferLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Checking wallet connection...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            {tokenInfo?.symbol || 'IMMBOT'} Token Dashboard
          </h1>
          <p className="text-slate-300">
            Manage your {tokenInfo?.name || 'Immortal BNB Token'} holdings and transfers
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">⚠️ {error}</p>
            <p className="text-slate-400 text-sm mt-2">
              Make sure the token contract is configured in your .env file (IMMBOT_TOKEN_CONTRACT)
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading token data...</p>
          </div>
        )}

        {/* Token Dashboard */}
        {!loading && !error && tokenInfo && (
          <div className="space-y-6">
            {/* Token Info Card */}
            <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Token Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Name</p>
                  <p className="text-white font-semibold text-lg">{tokenInfo.name}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Symbol</p>
                  <p className="text-white font-semibold text-lg">{tokenInfo.symbol}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Network</p>
                  <p className="text-white font-semibold text-lg">{tokenInfo.network || 'BNB Chain'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Total Supply</p>
                  <p className="text-white font-semibold text-lg">
                    {parseFloat(tokenInfo.totalSupply).toLocaleString()} {tokenInfo.symbol}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Decimals</p>
                  <p className="text-white font-semibold text-lg">{tokenInfo.decimals}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Tax Percentage</p>
                  <p className="text-white font-semibold text-lg">{tokenInfo.taxPercentage / 100}%</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Burn Percentage</p>
                  <p className="text-white font-semibold text-lg">{tokenInfo.burnPercentage / 100}%</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Liquidity Percentage</p>
                  <p className="text-white font-semibold text-lg">{tokenInfo.liquidityPercentage / 100}%</p>
                </div>
              </div>

              {/* Contract Addresses */}
              <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Staking Contract</p>
                    <p className="text-purple-400 font-mono text-sm break-all">
                      {tokenInfo.stakingContract}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Liquidity Wallet</p>
                    <p className="text-purple-400 font-mono text-sm break-all">
                      {tokenInfo.liquidityWallet}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Your Balance Card */}
            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/50 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Your Balance</h2>
              {tokenBalance ? (
                <div className="space-y-4">
                  <div className="flex items-baseline space-x-3">
                    <p className="text-5xl font-bold text-white">
                      {parseFloat(tokenBalance.balanceFormatted).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-2xl text-purple-400 font-semibold">{tokenInfo.symbol}</p>
                  </div>
                  <p className="text-slate-400">
                    Wallet: {tokenBalance.address.slice(0, 6)}...{tokenBalance.address.slice(-4)}
                  </p>
                </div>
              ) : (
                <p className="text-slate-400">Loading balance...</p>
              )}
            </div>

            {/* Token Statistics */}
            {tokenStats && (
              <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Token Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <p className="text-slate-400 text-sm mb-2">Total Holders</p>
                    <p className="text-2xl font-bold text-white">{tokenStats.totalHolders.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <p className="text-slate-400 text-sm mb-2">Circulating Supply</p>
                    <p className="text-2xl font-bold text-white">
                      {parseFloat(tokenStats.circulatingSupply).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <p className="text-slate-400 text-sm mb-2">Burned Tokens</p>
                    <p className="text-2xl font-bold text-red-400">
                      {parseFloat(tokenStats.burnedAmount).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <p className="text-slate-400 text-sm mb-2">Staking Contract Balance</p>
                    <p className="text-2xl font-bold text-green-400">
                      {parseFloat(tokenStats.stakingContractBalance).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <p className="text-slate-400 text-sm mb-2">Liquidity Pool Balance</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {parseFloat(tokenStats.liquidityPoolBalance).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                  {tokenStats.price && (
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm mb-2">Price</p>
                      <p className="text-2xl font-bold text-yellow-400">${tokenStats.price}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Transfer Form */}
            <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Transfer Tokens</h2>

              {transferSuccess && (
                <div className="bg-green-900/20 border border-green-500 rounded-lg p-4 mb-6">
                  <p className="text-green-400 mb-2">✅ Transfer successful!</p>
                  <p className="text-slate-400 text-sm font-mono break-all">
                    Transaction: {transferSuccess}
                  </p>
                </div>
              )}

              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label htmlFor="recipient" className="block text-white font-medium mb-2">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    id="recipient"
                    value={transferRecipient}
                    onChange={(e) => setTransferRecipient(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                    disabled={transferLoading}
                  />
                </div>

                <div>
                  <label htmlFor="amount" className="block text-white font-medium mb-2">
                    Amount ({tokenInfo.symbol})
                  </label>
                  <input
                    type="number"
                    id="amount"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="0.0"
                    step="0.01"
                    min="0"
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                    disabled={transferLoading}
                  />
                  {tokenBalance && (
                    <p className="text-slate-400 text-sm mt-2">
                      Available: {parseFloat(tokenBalance.balanceFormatted).toLocaleString()} {tokenInfo.symbol}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={transferLoading || !transferRecipient || !transferAmount}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {transferLoading ? 'Transferring...' : 'Transfer Tokens'}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-700">
                <p className="text-slate-400 text-sm">
                  ⚠️ <strong>Note:</strong> A {tokenInfo.taxPercentage / 100}% tax will be applied to this transfer.
                  {tokenInfo.burnPercentage > 0 && ` ${tokenInfo.burnPercentage / 100}% will be burned.`}
                  {tokenInfo.liquidityPercentage > 0 && ` ${tokenInfo.liquidityPercentage / 100}% will go to liquidity.`}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => router.push('/staking')}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105"
              >
                🔒 Stake {tokenInfo.symbol} Tokens
              </button>
              <button
                onClick={() => window.open(`https://bscscan.com/token/${tokenInfo.stakingContract}`, '_blank')}
                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105"
              >
                📊 View on BSCScan
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
