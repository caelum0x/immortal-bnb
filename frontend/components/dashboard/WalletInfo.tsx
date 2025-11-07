'use client'

import { useWeb3 } from '@/components/providers/Web3Provider'
import { useWalletInfo } from '@/lib/hooks'

export default function WalletInfo() {
  const { isConnected, address } = useWeb3()
  const { balance, usdValue, network, isLoading, error } = useWalletInfo(address)

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Wallet Info</h2>
        {isConnected && (
          <div className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded">
            Connected
          </div>
        )}
      </div>

      {isConnected ? (
        <div className="space-y-4">
          {/* Error Display */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div>
                <div className="h-4 bg-slate-700 rounded w-1/3 mb-1"></div>
                <div className="h-8 bg-slate-700 rounded w-2/3 mb-1"></div>
                <div className="h-4 bg-slate-700 rounded w-1/2"></div>
              </div>
              <div>
                <div className="h-4 bg-slate-700 rounded w-1/4 mb-1"></div>
                <div className="h-6 bg-slate-700 rounded"></div>
              </div>
              <div>
                <div className="h-4 bg-slate-700 rounded w-1/4 mb-1"></div>
                <div className="h-6 bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
          ) : (
            <>
              {/* Balance */}
              <div>
                <div className="text-sm text-slate-400 mb-1">BNB Balance</div>
                <div className="text-2xl font-bold text-white">{balance} BNB</div>
                <div className="text-sm text-slate-400">${usdValue} USD</div>
              </div>

              {/* Address */}
              <div>
                <div className="text-sm text-slate-400 mb-1">Address</div>
                <div className="text-sm font-mono text-slate-300 bg-slate-900/50 p-2 rounded break-all">
                  {address}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(address || '')}
                  className="text-xs text-purple-400 hover:text-purple-300 mt-1 transition-colors"
                >
                  Copy Address
                </button>
              </div>

              {/* Network */}
              <div>
                <div className="text-sm text-slate-400 mb-1">Network</div>
                <div className="text-sm text-white bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded inline-block">
                  {network || 'BNB Smart Chain'}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-4 border-t border-slate-700">
                <div className="text-sm text-slate-400 mb-2">Quick Actions</div>
                <div className="flex space-x-2">
                  <button className="flex-1 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 px-3 py-2 rounded text-sm transition-colors">
                    View on Explorer
                  </button>
                  <button className="flex-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-3 py-2 rounded text-sm transition-colors">
                    Add BNB
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-slate-400 mb-4">
            Connect your wallet to view balance and start trading
          </div>
          <div className="text-sm text-slate-500">
            MetaMask, Trust Wallet, and other Web3 wallets supported
          </div>
        </div>
      )}
    </div>
  )
}
