/**
 * Polymarket Wallet Selector Component
 * Allows users to switch between Proxy (email-based) and Safe (browser wallet) wallets
 */

'use client';

import { useState, useEffect } from 'react';
import { Wallet, Shield, Mail, Chrome, Info, RefreshCw } from 'lucide-react';

interface WalletInfo {
  walletType: 'proxy' | 'safe' | 'standard';
  isInitialized: boolean;
  details: any;
}

interface WalletComparison {
  proxy: {
    pros: string[];
    cons: string[];
  };
  safe: {
    pros: string[];
    cons: string[];
  };
}

export default function PolymarketWalletSelector() {
  const [currentWallet, setCurrentWallet] = useState<WalletInfo | null>(null);
  const [comparison, setComparison] = useState<WalletComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Fetch wallet info on mount
  useEffect(() => {
    fetchWalletInfo();
    fetchComparison();
  }, []);

  async function fetchWalletInfo() {
    try {
      const response = await fetch('http://localhost:3001/api/polymarket/wallet/info');
      const data = await response.json();

      if (data.success) {
        setCurrentWallet(data.walletInfo);
      }
    } catch (error) {
      console.error('Failed to fetch wallet info:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchComparison() {
    try {
      const response = await fetch('http://localhost:3001/api/polymarket/wallet/compare');
      const data = await response.json();

      if (data.success) {
        setComparison(data.comparison);
      }
    } catch (error) {
      console.error('Failed to fetch wallet comparison:', error);
    }
  }

  async function switchWallet(newType: 'proxy' | 'safe') {
    if (!currentWallet || currentWallet.walletType === newType) return;

    try {
      setSwitching(true);

      const response = await fetch('http://localhost:3001/api/polymarket/wallet/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletType: newType }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchWalletInfo();
        alert(`Successfully switched to ${newType} wallet!`);
      } else {
        alert(`Failed to switch wallet: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to switch wallet:', error);
      alert('Failed to switch wallet. Please try again.');
    } finally {
      setSwitching(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-800">
        <div className="flex items-center justify-center">
          <RefreshCw className="animate-spin h-6 w-6 text-blue-400" />
          <span className="ml-2 text-gray-400">Loading wallet info...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Wallet className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Polymarket Wallet</h2>
        </div>
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors"
        >
          <Info className="h-4 w-4" />
          Compare Wallets
        </button>
      </div>

      {/* Current Wallet Status */}
      <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Current Wallet Type</p>
            <p className="text-lg font-semibold text-white capitalize mt-1">
              {currentWallet?.walletType || 'Not configured'}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            currentWallet?.isInitialized
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
          }`}>
            {currentWallet?.isInitialized ? 'Initialized' : 'Not Initialized'}
          </div>
        </div>
      </div>

      {/* Wallet Type Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Proxy Wallet */}
        <button
          onClick={() => switchWallet('proxy')}
          disabled={switching || currentWallet?.walletType === 'proxy'}
          className={`p-5 rounded-lg border-2 transition-all ${
            currentWallet?.walletType === 'proxy'
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-gray-700 bg-gray-800/30 hover:border-gray-600 hover:bg-gray-800/50'
          } ${switching ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${
              currentWallet?.walletType === 'proxy'
                ? 'bg-blue-500/20'
                : 'bg-gray-700/50'
            }`}>
              <Mail className="h-6 w-6 text-blue-400" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-semibold text-white mb-1">
                Proxy Wallet
              </h3>
              <p className="text-sm text-gray-400 mb-3">
                Email-based wallet using Magic authentication
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                  Simple Setup
                </span>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                  Mobile Friendly
                </span>
              </div>
            </div>
          </div>
        </button>

        {/* Safe Wallet */}
        <button
          onClick={() => switchWallet('safe')}
          disabled={switching || currentWallet?.walletType === 'safe'}
          className={`p-5 rounded-lg border-2 transition-all ${
            currentWallet?.walletType === 'safe'
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-gray-700 bg-gray-800/30 hover:border-gray-600 hover:bg-gray-800/50'
          } ${switching ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${
              currentWallet?.walletType === 'safe'
                ? 'bg-purple-500/20'
                : 'bg-gray-700/50'
            }`}>
              <Shield className="h-6 w-6 text-purple-400" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-semibold text-white mb-1">
                Safe Wallet
              </h3>
              <p className="text-sm text-gray-400 mb-3">
                Gnosis Safe with browser wallet (MetaMask, Rainbow, etc.)
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                  High Security
                </span>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                  Self-Custody
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Wallet Comparison */}
      {showComparison && comparison && (
        <div className="mt-6 p-5 bg-gray-800/50 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Wallet Comparison</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Proxy Pros/Cons */}
            <div>
              <h4 className="text-md font-semibold text-blue-400 mb-3 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Proxy Wallet
              </h4>

              <div className="mb-4">
                <p className="text-sm font-medium text-green-400 mb-2">✓ Pros</p>
                <ul className="space-y-1">
                  {comparison.proxy.pros.map((pro, idx) => (
                    <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm font-medium text-red-400 mb-2">✗ Cons</p>
                <ul className="space-y-1">
                  {comparison.proxy.cons.map((con, idx) => (
                    <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Safe Pros/Cons */}
            <div>
              <h4 className="text-md font-semibold text-purple-400 mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Safe Wallet
              </h4>

              <div className="mb-4">
                <p className="text-sm font-medium text-green-400 mb-2">✓ Pros</p>
                <ul className="space-y-1">
                  {comparison.safe.pros.map((pro, idx) => (
                    <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm font-medium text-red-400 mb-2">✗ Cons</p>
                <ul className="space-y-1">
                  {comparison.safe.cons.map((con, idx) => (
                    <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-gray-300">
              <strong className="text-blue-400">💡 Recommendation:</strong>
              <br />
              Use <strong>Proxy Wallet</strong> for simple setup and mobile trading.
              <br />
              Use <strong>Safe Wallet</strong> for maximum security and hardware wallet integration.
            </p>
          </div>
        </div>
      )}

      {/* Switching Indicator */}
      {switching && (
        <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-3">
            <RefreshCw className="animate-spin h-5 w-5 text-yellow-400" />
            <p className="text-sm text-yellow-400">
              Switching wallet type... Please wait.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
