'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { useWeb3 } from '@/components/providers/Web3Provider'

interface StakingPool {
  id: number
  duration: number
  multiplier: number
  name: string
  apy: number
}

interface StakePosition {
  amount: string
  stakingTime: number
  unlockTime: number
  lockPeriodId: number
  accumulatedReward: string
  lastRewardTime: number
  isActive: boolean
  rewards: string
  daysRemaining: number
  apy: number
}

interface StakingStats {
  totalStaked: string
  totalRewardsPaid: string
  totalStakers: number
  userTotalStaked: string
  userTotalRewards: string
}

export default function StakingPage() {
  const { isConnected, address } = useWeb3()
  const router = useRouter()

  const [pools, setPools] = useState<StakingPool[]>([])
  const [userStakes, setUserStakes] = useState<StakePosition[]>([])
  const [stats, setStats] = useState<StakingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [stakeModalOpen, setStakeModalOpen] = useState(false)
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null)
  const [stakeAmount, setStakeAmount] = useState('')
  const [stakeLoading, setStakeLoading] = useState(false)

  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Redirect to landing if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push('/')
    }
  }, [isConnected, router])

  // Fetch staking data
  useEffect(() => {
    if (!isConnected || !address) return

    const fetchStakingData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch staking pools
        const poolsRes = await fetch('/api/staking/pools')
        if (!poolsRes.ok) {
          const errorData = await poolsRes.json()
          throw new Error(errorData.message || 'Failed to fetch staking pools')
        }
        const poolsData = await poolsRes.json()
        setPools(poolsData.pools)

        // Fetch staking stats
        const statsRes = await fetch(`/api/staking/stats?userAddress=${address}`)
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }

        // Fetch user stakes
        const stakesRes = await fetch(`/api/staking/user/${address}`)
        if (stakesRes.ok) {
          const stakesData = await stakesRes.json()
          setUserStakes(stakesData.stakes)
        }

      } catch (err: any) {
        console.error('Failed to fetch staking data:', err)
        setError(err.message || 'Failed to load staking data')
      } finally {
        setLoading(false)
      }
    }

    fetchStakingData()
  }, [isConnected, address])

  const openStakeModal = (pool: StakingPool) => {
    setSelectedPool(pool)
    setStakeModalOpen(true)
    setStakeAmount('')
  }

  const handleStake = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPool || !stakeAmount) {
      alert('Please enter an amount')
      return
    }

    try {
      setStakeLoading(true)
      setSuccessMessage(null)

      const res = await fetch('/api/staking/stake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: stakeAmount,
          lockPeriodId: selectedPool.id,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Staking failed')
      }

      const data = await res.json()
      setSuccessMessage(`Successfully staked ${stakeAmount} tokens! TX: ${data.txHash.slice(0, 10)}...`)
      setStakeModalOpen(false)
      setStakeAmount('')

      // Refresh data
      setTimeout(() => {
        window.location.reload()
      }, 2000)

    } catch (err: any) {
      alert(err.message || 'Staking failed')
    } finally {
      setStakeLoading(false)
    }
  }

  const handleWithdraw = async (stakeIndex: number) => {
    if (!confirm('Are you sure you want to withdraw this stake?')) return

    try {
      setActionLoading(stakeIndex)
      setSuccessMessage(null)

      const res = await fetch('/api/staking/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stakeIndex }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Withdrawal failed')
      }

      const data = await res.json()
      setSuccessMessage(`Successfully withdrew stake! TX: ${data.txHash.slice(0, 10)}...`)

      // Refresh data
      setTimeout(() => {
        window.location.reload()
      }, 2000)

    } catch (err: any) {
      alert(err.message || 'Withdrawal failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleClaimRewards = async (stakeIndex: number) => {
    try {
      setActionLoading(stakeIndex)
      setSuccessMessage(null)

      const res = await fetch('/api/staking/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stakeIndex }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Claim failed')
      }

      const data = await res.json()
      setSuccessMessage(`Successfully claimed rewards! TX: ${data.txHash.slice(0, 10)}...`)

      // Refresh data
      setTimeout(() => {
        window.location.reload()
      }, 2000)

    } catch (err: any) {
      alert(err.message || 'Claim failed')
    } finally {
      setActionLoading(null)
    }
  }

  const formatDuration = (seconds: number): string => {
    const days = Math.floor(seconds / 86400)
    if (days >= 365) return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''}`
    if (days >= 30) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''}`
    return `${days} day${days !== 1 ? 's' : ''}`
  }

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString()
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
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            Staking Dashboard
          </h1>
          <p className="text-slate-300">
            Stake your IMMBOT tokens to earn rewards
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-900/20 border border-green-500 rounded-lg p-4 mb-6">
            <p className="text-green-400">✅ {successMessage}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">⚠️ {error}</p>
            <p className="text-slate-400 text-sm mt-2">
              Make sure the staking contract is configured in your .env file (STAKING_CONTRACT)
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading staking data...</p>
          </div>
        )}

        {/* Staking Dashboard */}
        {!loading && !error && (
          <div className="space-y-6">
            {/* Staking Stats */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">Total Staked</p>
                  <p className="text-2xl font-bold text-white">
                    {parseFloat(stats.totalStaked).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">IMMBOT</p>
                </div>
                <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">Total Rewards Paid</p>
                  <p className="text-2xl font-bold text-green-400">
                    {parseFloat(stats.totalRewardsPaid).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">IMMBOT</p>
                </div>
                <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">Total Stakers</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.totalStakers.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">Your Total Staked</p>
                  <p className="text-2xl font-bold text-white">
                    {parseFloat(stats.userTotalStaked).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">IMMBOT</p>
                </div>
                <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">Your Total Rewards</p>
                  <p className="text-2xl font-bold text-green-400">
                    {parseFloat(stats.userTotalRewards).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">IMMBOT</p>
                </div>
              </div>
            )}

            {/* Staking Pools */}
            <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Staking Pools</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {pools.map((pool) => (
                  <div
                    key={pool.id}
                    className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700 rounded-lg p-6 hover:border-purple-500/50 transition-all"
                  >
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-white mb-1">{pool.name}</h3>
                      <p className="text-slate-400 text-sm">Lock Period: {formatDuration(pool.duration)}</p>
                    </div>

                    <div className="mb-6">
                      <p className="text-slate-400 text-sm mb-1">APY</p>
                      <p className="text-4xl font-bold text-green-400">{pool.apy.toFixed(1)}%</p>
                    </div>

                    <div className="mb-4">
                      <p className="text-slate-400 text-sm">Multiplier: {pool.multiplier / 100}x</p>
                    </div>

                    <button
                      onClick={() => openStakeModal(pool)}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-3 rounded-lg font-bold transition-all transform hover:scale-105"
                    >
                      Stake Now
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* User Stakes */}
            <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Your Active Stakes</h2>

              {userStakes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400 text-lg mb-4">No active stakes yet</p>
                  <p className="text-slate-500">Start staking to earn rewards!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left text-slate-400 font-medium py-3 px-4">Amount</th>
                        <th className="text-left text-slate-400 font-medium py-3 px-4">Lock Period</th>
                        <th className="text-left text-slate-400 font-medium py-3 px-4">APY</th>
                        <th className="text-left text-slate-400 font-medium py-3 px-4">Pending Rewards</th>
                        <th className="text-left text-slate-400 font-medium py-3 px-4">Unlock Date</th>
                        <th className="text-left text-slate-400 font-medium py-3 px-4">Time Remaining</th>
                        <th className="text-left text-slate-400 font-medium py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userStakes.map((stake, index) => (
                        <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                          <td className="py-4 px-4">
                            <p className="text-white font-semibold">
                              {parseFloat(stake.amount).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                            <p className="text-slate-500 text-sm">IMMBOT</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-white">
                              {pools.find(p => p.id === stake.lockPeriodId)?.name || 'Unknown'}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-green-400 font-semibold">{stake.apy.toFixed(1)}%</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-yellow-400 font-semibold">
                              {parseFloat(stake.rewards).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 4,
                              })}
                            </p>
                            <p className="text-slate-500 text-sm">IMMBOT</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-white">{formatDate(stake.unlockTime)}</p>
                          </td>
                          <td className="py-4 px-4">
                            {stake.daysRemaining > 0 ? (
                              <span className="inline-block bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                                {stake.daysRemaining} {stake.daysRemaining === 1 ? 'day' : 'days'}
                              </span>
                            ) : (
                              <span className="inline-block bg-green-900/30 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                                Unlocked
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleClaimRewards(index)}
                                disabled={actionLoading === index || parseFloat(stake.rewards) === 0}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading === index ? '...' : 'Claim'}
                              </button>
                              <button
                                onClick={() => handleWithdraw(index)}
                                disabled={actionLoading === index || stake.daysRemaining > 0}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading === index ? '...' : 'Withdraw'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">ℹ️ Staking Information</h3>
              <ul className="space-y-2 text-slate-300">
                <li>• <strong>Lock Periods:</strong> Choose from flexible (30 days) to long-term (1 year) staking options</li>
                <li>• <strong>APY:</strong> Higher lock periods earn higher APY through reward multipliers</li>
                <li>• <strong>Rewards:</strong> Earned continuously and can be claimed anytime</li>
                <li>• <strong>Early Withdrawal:</strong> Not available - you must wait until unlock date</li>
                <li>• <strong>Auto-compound:</strong> Claim rewards and restake to maximize earnings</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Stake Modal */}
      {stakeModalOpen && selectedPool && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-purple-500/30 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">{selectedPool.name}</h3>
                <p className="text-slate-400">Stake IMMBOT Tokens</p>
              </div>
              <button
                onClick={() => setStakeModalOpen(false)}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-slate-400">Lock Period:</span>
                <span className="text-white font-semibold">{formatDuration(selectedPool.duration)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-400">APY:</span>
                <span className="text-green-400 font-bold text-xl">{selectedPool.apy.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Multiplier:</span>
                <span className="text-purple-400 font-semibold">{selectedPool.multiplier / 100}x</span>
              </div>
            </div>

            <form onSubmit={handleStake}>
              <div className="mb-6">
                <label htmlFor="stakeAmount" className="block text-white font-medium mb-2">
                  Amount to Stake
                </label>
                <input
                  type="number"
                  id="stakeAmount"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.01"
                  min="0"
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  disabled={stakeLoading}
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStakeModalOpen(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-bold transition-colors"
                  disabled={stakeLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={stakeLoading || !stakeAmount}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {stakeLoading ? 'Staking...' : 'Stake'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
