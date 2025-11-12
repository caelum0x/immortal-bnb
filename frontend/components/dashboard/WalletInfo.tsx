'use client';

import { useEffect, useState } from 'react';
import { useWeb3 } from '@/components/providers/Web3Provider';
import api from '@/lib/apiClient';

export default function WalletInfo() {
  const { isConnected, address, connect, isConnecting, error: web3Error, network, balance } = useWeb3();
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isConnected) {
      fetchPortfolio();
    }
  }, [isConnected]);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const data = await api.getPortfolio();
      setPortfolio(data);
    } catch (err) {
      console.error('Failed to fetch portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const totalPnL = portfolio?.total?.combined_pnl || 0;
  const isProfitable = totalPnL > 0;

  return (
    <div className="relative">
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-yellow-500/10 to-orange-500/10 rounded-2xl backdrop-blur-xl" />

      <div className="relative bg-slate-800/50 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-xl">💰</span>
            </div>
            <h2 className="text-xl font-bold text-white">Wallet</h2>
          </div>
          {isConnected && (
            <div className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-bold">
              ● CONNECTED
            </div>
          )}
        </div>

        {!isConnected ? (
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">🔐</div>
            <p className="text-slate-400 mb-4">
              Connect your wallet to start trading
            </p>

            <button
              onClick={connect}
              disabled={isConnecting}
              className="w-full py-3 px-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 shadow-lg"
            >
              {isConnecting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>🔗</span>
                  Connect Wallet
                </span>
              )}
            </button>

            {web3Error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">⚠ {web3Error}</p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-500 mb-2">Supported Wallets:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['MetaMask', 'Trust Wallet', 'Coinbase', 'WalletConnect'].map((wallet) => (
                  <span key={wallet} className="text-xs px-2 py-1 bg-slate-700 rounded text-slate-400">
                    {wallet}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Balance Display */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl blur" />
              <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Total Balance</span>
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <button onClick={fetchPortfolio} className="text-amber-400 hover:text-amber-300">
                      🔄
                    </button>
                  )}
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {loading ? '...' : (balance || '0.0000')} BNB
                </div>
                <div className="text-sm text-slate-400">
                  ≈ ${(parseFloat(balance || '0') * 600).toFixed(2)} USD
                </div>
              </div>
            </div>

            {/* P&L Display */}
            {portfolio && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">DEX P&L</div>
                  <div className={`text-lg font-bold ${portfolio.dex?.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {portfolio.dex?.pnl > 0 ? '+' : ''}{portfolio.dex?.pnl?.toFixed(4) || '0.0000'}
                  </div>
                </div>
                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Polymarket P&L</div>
                  <div className={`text-lg font-bold ${portfolio.polymarket?.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {portfolio.polymarket?.pnl > 0 ? '+' : ''}{portfolio.polymarket?.pnl?.toFixed(2) || '0.00'}
                  </div>
                </div>
              </div>
            )}

            {/* Total P&L */}
            {portfolio && (
              <div className={`p-4 rounded-xl border ${
                isProfitable
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Total P&L</div>
                    <div className={`text-2xl font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                      {isProfitable ? '+' : ''}{totalPnL.toFixed(4)} BNB
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isProfitable ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    <span className="text-2xl">{isProfitable ? '📈' : '📉'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Address */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-2">Wallet Address</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 text-xs font-mono text-white bg-slate-800 px-2 py-1 rounded overflow-hidden text-ellipsis">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
                <button
                  onClick={copyAddress}
                  className="px-3 py-1 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded text-xs font-medium transition-colors"
                >
                  {copied ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
            </div>

            {/* Network */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-2">Network</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-sm font-semibold text-white">{network || 'BNB Chain'}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => window.open(`https://bscscan.com/address/${address}`, '_blank')}
                className="py-2 px-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                🔍 Explorer
              </button>
              <button
                onClick={() => window.location.href = '/settings'}
                className="py-2 px-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                ⚙️ Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
