'use client'

import Header from '@/components/layout/Header'
import TokenDiscovery from '@/components/TokenDiscovery'

export default function DiscoveryPage() {
  return (
    <main className="min-h-screen bg-slate-900">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Token Discovery</h1>
          <p className="text-slate-400">
            Discover trending tokens on BNB Chain with real-time data from DexScreener
          </p>
        </div>

        {/* Token Discovery Component */}
        <TokenDiscovery />
      </div>
    </main>
  )
}
