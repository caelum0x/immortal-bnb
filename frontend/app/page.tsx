import Header from '@/components/layout/Header'
import Dashboard from '@/components/dashboard/Dashboard'
import BotStatus from '@/components/dashboard/BotStatus'
import TradingHistory from '@/components/dashboard/TradingHistory'
import WalletInfo from '@/components/dashboard/WalletInfo'
import PerformanceChart from '@/components/dashboard/PerformanceChart'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-6">
            Immortal AI Trading Bot
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
            Experience the power of AI-driven trading on BNB Chain with immortal memory. 
            Our bot learns from every trade and evolves continuously.
          </p>
          
          {/* Key Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
              <div className="text-3xl mb-3">🧠</div>
              <h3 className="text-lg font-semibold text-white mb-2">AI Intelligence</h3>
              <p className="text-slate-300 text-sm">Advanced AI with learning capabilities and memory storage</p>
            </div>
            
            <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-lg font-semibold text-white mb-2">Fast Execution</h3>
              <p className="text-slate-300 text-sm">Lightning-fast trades on PancakeSwap V2/V3</p>
            </div>
            
            <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="text-lg font-semibold text-white mb-2">Non-Custodial</h3>
              <p className="text-slate-300 text-sm">You control your funds. Bot requires approval for each trade</p>
            </div>
          </div>
        </section>

        {/* Dashboard */}
        <section className="space-y-8">
          {/* Status Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <BotStatus />
            </div>
            <div>
              <WalletInfo />
            </div>
          </div>

          {/* Performance Chart */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <PerformanceChart />
            </div>
            <div>
              <Dashboard />
            </div>
          </div>

          {/* Trading History */}
          <div>
            <TradingHistory />
          </div>
        </section>
      </div>
    </main>
  )
}
