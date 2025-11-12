'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/apiClient';
import useWebSocket from '@/lib/useWebSocket';

export default function BotStatus() {
  const { isConnected: wsConnected, botStatus: wsBotStatus } = useWebSocket();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // Update from WebSocket
  useEffect(() => {
    if (wsBotStatus) {
      setStatus((prev: any) => ({ ...prev, ...wsBotStatus }));
    }
  }, [wsBotStatus]);

  const fetchStatus = async () => {
    try {
      const data = await api.getBotStatus();
      setStatus(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  const dexStatus = status?.dex?.status || 'STOPPED';
  const polymarketStatus = status?.polymarket?.status || 'STOPPED';
  const isRunning = dexStatus === 'RUNNING' || polymarketStatus === 'RUNNING';

  return (
    <div className="relative">
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-blue-500/10 to-purple-500/10 rounded-2xl backdrop-blur-xl" />

      <div className="relative bg-slate-800/50 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <h2 className="text-xl font-bold text-white">Bot Status</h2>
          </div>
          <div className={`px-4 py-2 rounded-lg font-bold text-sm ${
            isRunning
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-slate-700 text-slate-400 border border-slate-600'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`} />
              <span>{isRunning ? 'ACTIVE' : 'INACTIVE'}</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">⚠ {error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-slate-600 border-t-green-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Bot Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* DEX Status */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-slate-900/50 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔷</span>
                      <span className="text-sm font-semibold text-white">DEX Trading</span>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-bold ${
                      dexStatus === 'RUNNING'
                        ? 'bg-green-500/20 text-green-400'
                        : dexStatus === 'ERROR'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      {dexStatus}
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Chain:</span>
                      <span className="text-blue-400 font-medium">BNB Chain</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Platform:</span>
                      <span className="text-blue-400 font-medium">PancakeSwap V3</span>
                    </div>
                    {status?.dex?.lastTrade && (
                      <div className="flex justify-between text-slate-400">
                        <span>Last Trade:</span>
                        <span className="text-white font-medium">
                          {new Date(status.dex.lastTrade).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Polymarket Status */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-slate-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎲</span>
                      <span className="text-sm font-semibold text-white">Polymarket</span>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-bold ${
                      polymarketStatus === 'RUNNING'
                        ? 'bg-purple-500/20 text-purple-400'
                        : polymarketStatus === 'ERROR'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      {polymarketStatus}
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Chain:</span>
                      <span className="text-purple-400 font-medium">Polygon</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Platform:</span>
                      <span className="text-purple-400 font-medium">CLOB</span>
                    </div>
                    {status?.polymarket?.lastTrade && (
                      <div className="flex justify-between text-slate-400">
                        <span>Last Trade:</span>
                        <span className="text-white font-medium">
                          {new Date(status.polymarket.lastTrade).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-xs text-slate-400">WebSocket</span>
                </div>
                <span className="text-sm font-bold text-white">
                  {wsConnected ? 'Live' : 'Offline'}
                </span>
              </div>

              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-lg p-3 text-center">
                <div className="text-xs text-slate-400 mb-1">Network</div>
                <span className="text-sm font-bold text-white">
                  {status?.network || 'BNB Chain'}
                </span>
              </div>

              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-lg p-3 text-center">
                <div className="text-xs text-slate-400 mb-1">Total Trades</div>
                <span className="text-sm font-bold text-green-400">
                  {status?.totalTrades || 0}
                </span>
              </div>
            </div>

            {/* Balance Display */}
            {status?.balance && (
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Wallet Balance</div>
                    <div className="text-2xl font-bold text-white">{status.balance} BNB</div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                </div>
              </div>
            )}

            {/* Last Update */}
            <div className="mt-4 text-center">
              <span className="text-xs text-slate-500">
                Last updated: {new Date(status?.timestamp || Date.now()).toLocaleTimeString()}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
