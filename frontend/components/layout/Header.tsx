'use client'

import { useWeb3 } from '@/components/providers/Web3Provider'

export default function Header() {
  const { isConnected, address, connect, disconnect } = useWeb3();

  return (
    <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IM</span>
            </div>
            <h1 className="text-xl font-bold text-white">Immortal AI</h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#dashboard" className="text-slate-300 hover:text-white transition-colors">
              Dashboard
            </a>
            <a href="#trading" className="text-slate-300 hover:text-white transition-colors">
              Trading
            </a>
            <a href="#staking" className="text-slate-300 hover:text-white transition-colors">
              Staking
            </a>
            <a href="#analytics" className="text-slate-300 hover:text-white transition-colors">
              Analytics
            </a>
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Connected</span>
                </div>
                <div className="text-slate-300 text-sm font-mono">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
                <button
                  onClick={disconnect}
                  className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1 rounded-md text-sm transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
