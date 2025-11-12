'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { useWeb3 } from '@/components/providers/Web3Provider'
import BotStatus from '@/components/dashboard/BotStatus'
import WalletInfo from '@/components/dashboard/WalletInfo'
import PerformanceChart from '@/components/dashboard/PerformanceChart'
import TradingHistory from '@/components/dashboard/TradingHistory'
import TokenDiscovery from '@/components/TokenDiscovery'
import PolymarketDashboard from '@/components/PolymarketDashboard'
import CrossChainOpportunities from '@/components/CrossChainOpportunities'
import UnifiedBotControl from '@/components/UnifiedBotControl'
import NotificationsPanel from '@/components/NotificationsPanel'

export default function DashboardPage() {
  const { isConnected, address } = useWeb3()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'dex' | 'polymarket' | 'opportunities'>('overview')

  // Redirect to landing if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push('/')
    }
  }, [isConnected, router])

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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back!</h1>
          <p className="text-slate-300">
            Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-slate-700">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('dex')}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === 'dex'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              DEX Trading
            </button>
            <button
              onClick={() => setActiveTab('polymarket')}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === 'polymarket'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Polymarket
            </button>
            <button
              onClick={() => setActiveTab('opportunities')}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === 'opportunities'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Opportunities
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Bot Controls & Notifications */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <UnifiedBotControl />
              </div>
              <div>
                <NotificationsPanel />
              </div>
            </div>

            {/* Status & Wallet */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <BotStatus />
              </div>
              <div>
                <WalletInfo />
              </div>
            </div>

            {/* Performance Chart */}
            <div>
              <PerformanceChart />
            </div>

            {/* Trading History */}
            <div>
              <TradingHistory />
            </div>
          </div>
        )}

        {activeTab === 'dex' && (
          <div className="space-y-6">
            {/* Token Discovery */}
            <TokenDiscovery />

            {/* DEX Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BotStatus />
              <WalletInfo />
            </div>

            {/* Recent DEX Trades */}
            <TradingHistory />
          </div>
        )}

        {activeTab === 'polymarket' && (
          <div className="space-y-6">
            {/* Polymarket Dashboard */}
            <PolymarketDashboard />

            {/* Polymarket Trading History */}
            <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
              <h3 className="text-xl font-bold text-white mb-4">Polymarket Trading History</h3>
              <p className="text-slate-400 text-sm">Recent prediction market trades will appear here</p>
            </div>
          </div>
        )}

        {activeTab === 'opportunities' && (
          <div className="space-y-6">
            {/* Cross-Chain Opportunities */}
            <CrossChainOpportunities />

            {/* Flash Loan Opportunities */}
            <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
              <h3 className="text-xl font-bold text-white mb-4">⚡ Flash Loan Arbitrage Opportunities</h3>
              <p className="text-slate-400 text-sm mb-4">
                AI-detected arbitrage opportunities across multiple DEXs using flash loans
              </p>
              <div className="space-y-3">
                <div className="bg-slate-900/50 p-4 rounded border border-green-500/30">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-white font-semibold">USDT/BUSD Arbitrage</span>
                      <div className="text-xs text-slate-400 mt-1">PancakeSwap V2 → Biswap</div>
                    </div>
                    <span className="text-green-400 font-bold">+2.34%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-slate-400">Loan Amount</div>
                      <div className="text-white font-semibold">$50,000</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Expected Profit</div>
                      <div className="text-green-400 font-semibold">$1,170</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Gas Cost</div>
                      <div className="text-white">~$5</div>
                    </div>
                  </div>
                  <button className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm font-medium transition-colors">
                    Execute Flash Loan
                  </button>
                </div>
              </div>
            </div>

            {/* MEV Protected Trades */}
            <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
              <h3 className="text-xl font-bold text-white mb-4">🛡️ MEV Protection Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 p-4 rounded">
                  <div className="text-2xl font-bold text-green-400 mb-1">ACTIVE</div>
                  <div className="text-sm text-slate-400">Flashbots Protection</div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded">
                  <div className="text-2xl font-bold text-purple-400 mb-1">247</div>
                  <div className="text-sm text-slate-400">Protected Trades</div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded">
                  <div className="text-2xl font-bold text-blue-400 mb-1">$12.5K</div>
                  <div className="text-sm text-slate-400">Saved from MEV</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 flex flex-wrap gap-4">
          <button
            onClick={() => router.push('/trades')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            View All Trades
          </button>
          <button
            onClick={() => router.push('/memory')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            View Memory & Analytics
          </button>
          <button
            onClick={() => router.push('/settings')}
            className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Settings
          </button>
        </div>
      </div>
    </main>
  )
}
