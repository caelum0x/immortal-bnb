'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { useWeb3 } from '@/components/providers/Web3Provider'

export default function Home() {
  const { isConnected, connect, isConnecting } = useWeb3()
  const router = useRouter()

  // Redirect to dashboard if wallet is connected
  useEffect(() => {
    if (isConnected) {
      router.push('/dashboard')
    }
  }, [isConnected, router])

  return (
    <main className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16 py-12">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 bg-clip-text text-transparent">
            Immortal AI Trading Bot
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
            Experience the power of AI-driven multi-chain trading with immortal memory.
            Our bot learns from every trade and evolves continuously across BNB Chain and Polymarket.
          </p>

          {/* CTA Button */}
          <button
            onClick={connect}
            disabled={isConnecting}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet & Start Trading'}
          </button>
        </section>

        {/* Stats */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">10K+</div>
              <div className="text-slate-300 text-sm">Total Trades Executed</div>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">78%</div>
              <div className="text-slate-300 text-sm">Average Win Rate</div>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">$2.5M</div>
              <div className="text-slate-300 text-sm">Total Volume</div>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30 text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">24/7</div>
              <div className="text-slate-300 text-sm">Automated Trading</div>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-10">
            Advanced Trading Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-semibold text-white mb-3">AI-Powered Decisions</h3>
              <p className="text-slate-300 text-sm">
                Advanced GPT-4 powered AI analyzes markets and executes optimal trading strategies with immortal memory storage on BNB Greenfield.
              </p>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-semibold text-white mb-3">MEV Protection</h3>
              <p className="text-slate-300 text-sm">
                Protected trades via Flashbots private transactions. No front-running, no sandwich attacks.
              </p>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
              <div className="text-4xl mb-4">💾</div>
              <h3 className="text-xl font-semibold text-white mb-3">Immortal Memory</h3>
              <p className="text-slate-300 text-sm">
                All trading history stored permanently on BNB Greenfield. Bot learns and evolves from every trade.
              </p>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-semibold text-white mb-3">Multi-Chain Trading</h3>
              <p className="text-slate-300 text-sm">
                Trade on BNB Chain DEXs (PancakeSwap V2/V3, Biswap, ApeSwap) and Polymarket prediction markets.
              </p>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-semibold text-white mb-3">Multi-DEX Routing</h3>
              <p className="text-slate-300 text-sm">
                Automatically finds best prices across 5+ DEXs. Save on every trade with optimal routing.
              </p>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-white mb-3">Flash Loan Arbitrage</h3>
              <p className="text-slate-300 text-sm">
                Execute large capital arbitrage with zero upfront capital using flash loans from PancakeSwap V3.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-16 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-10">
            How It Works
          </h2>
          <div className="space-y-6">
            <div className="flex items-start space-x-4 bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Connect Your Wallet</h3>
                <p className="text-slate-300 text-sm">
                  Connect your MetaMask or any Web3 wallet. Switch to BNB Chain or Polygon network.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Configure Your Bot</h3>
                <p className="text-slate-300 text-sm">
                  Set risk parameters, choose trading strategies, enable MEV protection and flash loans.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">AI Discovers Opportunities</h3>
                <p className="text-slate-300 text-sm">
                  Bot continuously scans DexScreener, Polymarket, and DEXs for profitable trading opportunities.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                4
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Automated Execution & Learning</h3>
                <p className="text-slate-300 text-sm">
                  Trades execute automatically with MEV protection. All data stored on Greenfield for continuous learning.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center py-12">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Start Trading?
          </h2>
          <button
            onClick={connect}
            disabled={isConnecting}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet Now'}
          </button>
        </section>
      </div>
    </main>
  )
}
