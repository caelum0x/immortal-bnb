/**
 * Main Dashboard Page
 */

'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Dashboard from '@/components/Dashboard';
import MemoriesView from '@/components/MemoriesView';
import TokenDiscovery from '@/components/TokenDiscovery';
import StakingUI from '@/components/StakingUI';
import TradingStats from '@/components/TradingStats';

type Tab = 'dashboard' | 'memories' | 'tokens' | 'staking';

export default function Home() {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const tabs = [
    { id: 'dashboard' as Tab, label: '🤖 Dashboard', icon: '📊' },
    { id: 'memories' as Tab, label: '🧠 Memories', icon: '💾' },
    { id: 'tokens' as Tab, label: '🔍 Discover', icon: '🔎' },
    { id: 'staking' as Tab, label: '💰 Staking', icon: '🏦' },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="text-2xl">🏦</div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  Immortal AI Trading Bot
                </h1>
                <p className="text-sm text-gray-400">Powered by BNB Greenfield & PancakeSwap</p>
              </div>
            </div>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex space-x-2 border-b border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === tab.id
                  ? 'border-b-2 border-yellow-500 text-yellow-500'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {!isConnected ? (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Connect your wallet to access the Immortal AI Trading Bot dashboard and start
              trading on BNB Chain with AI-powered decisions.
            </p>
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button onClick={openConnectModal} className="btn-primary text-lg px-8 py-4">
                  Connect Wallet
                </button>
              )}
            </ConnectButton.Custom>
          </div>
        ) : (
          <>
            {/* Trading Stats Overview */}
            <div className="mb-6">
              <TradingStats />
            </div>

            {/* Tab Content */}
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'memories' && <MemoriesView />}
            {activeTab === 'tokens' && <TokenDiscovery />}
            {activeTab === 'staking' && <StakingUI />}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-700 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
          <p className="mb-2">
            Built for BNB Hackathon | Powered by OpenRouter, DexScreener, PancakeSwap & BNB
            Greenfield
          </p>
          <p className="text-sm">
            ⚠️ Trading involves risk. This bot is for educational purposes. Use at your own risk.
          </p>
        </div>
      </footer>
    </main>
  );
}
