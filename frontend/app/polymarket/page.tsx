'use client'

import Header from '@/components/layout/Header'
import PolymarketDashboard from '@/components/PolymarketDashboard'

export default function PolymarketPage() {
  return (
    <main className="min-h-screen bg-slate-900">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Polymarket Trading</h1>
          <p className="text-slate-400">
            AI-powered prediction market trading on Polymarket CLOB
          </p>
        </div>

        {/* Polymarket Dashboard Component */}
        <PolymarketDashboard />
      </div>
    </main>
  )
}
