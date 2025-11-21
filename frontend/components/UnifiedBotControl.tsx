/**
 * Unified Bot Control Component - Modern Design
 * Single control panel for DEX and Polymarket trading bots with real API integration
 */

'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import useWebSocket from '@/lib/useWebSocket';

interface BotConfig {
  maxTradeAmount: number;
  confidenceThreshold: number;
  stopLoss: number;
  maxSlippage: number;
}

export default function UnifiedBotControl() {
  const { isConnected: wsConnected, botStatus, refreshBotStatus } = useWebSocket();
  const [dexRunning, setDexRunning] = useState(false);
  const [polymarketRunning, setPolymarketRunning] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Configuration states
  const [dexConfig, setDexConfig] = useState<BotConfig>({
    maxTradeAmount: 0.1,
    confidenceThreshold: 0.7,
    stopLoss: 10,
    maxSlippage: 2,
  });

  const [polymarketConfig, setPolymarketConfig] = useState<BotConfig>({
    maxTradeAmount: 10,
    confidenceThreshold: 0.75,
    stopLoss: 15,
    maxSlippage: 1,
  });

  // Fetch initial bot status
  useEffect(() => {
    fetchBotStatus();
  }, []);

  // Update status from WebSocket
  useEffect(() => {
    if (botStatus?.dex) {
      setDexRunning(botStatus.dex.status === 'RUNNING');
    }
    if (botStatus?.polymarket) {
      setPolymarketRunning(botStatus.polymarket.status === 'RUNNING');
    }
  }, [botStatus]);

  const fetchBotStatus = async () => {
    try {
      const status = await api.getBotStatus();
      // Check if this is mock data (backend offline)
      if (status._mock) {
        setError('⚠️ Backend is offline - Cannot connect to server. Please ensure backend is running on port 3001.');
        setDexRunning(false);
        setPolymarketRunning(false);
        return;
      }
      setDexRunning(status.dex?.status === 'RUNNING');
      setPolymarketRunning(status.polymarket?.status === 'RUNNING');
      setError(null); // Clear error if connection successful
    } catch (err: any) {
      console.error('Failed to fetch bot status:', err);
      setError(`Failed to connect to backend: ${err.message || 'Unknown error'}`);
      setDexRunning(false);
      setPolymarketRunning(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setError(null);
    setTimeout(() => setSuccess(null), 3000);
  };

  const showError = (msg: string) => {
    setError(msg);
    setSuccess(null);
    setTimeout(() => setError(null), 5000);
  };

  // Start DEX bot
  const startDexBot = async () => {
    setLoading('dex-start');
    try {
      const result = await api.startBot('dex');
      if (result.status === 'started' || result.message) {
        setDexRunning(true);
        showSuccess(result.message || 'DEX bot started successfully!');
        refreshBotStatus();
      } else {
        showError('Failed to start DEX bot: Unexpected response');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to start DEX bot');
    } finally {
      setLoading(null);
    }
  };

  // Stop DEX bot
  const stopDexBot = async () => {
    setLoading('dex-stop');
    try {
      const result = await api.stopBot('dex');
      if (result.status === 'stopped' || result.message) {
        setDexRunning(false);
        showSuccess(result.message || 'DEX bot stopped');
        refreshBotStatus();
      } else {
        showError('Failed to stop DEX bot: Unexpected response');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to stop DEX bot');
    } finally {
      setLoading(null);
    }
  };

  // Start Polymarket bot
  const startPolymarketBot = async () => {
    setLoading('polymarket-start');
    try {
      const result = await api.startBot('polymarket');
      if (result.status === 'started' || result.message) {
        setPolymarketRunning(true);
        showSuccess(result.message || 'Polymarket bot started successfully!');
        refreshBotStatus();
      } else {
        showError('Failed to start Polymarket bot: Unexpected response');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to start Polymarket bot');
    } finally {
      setLoading(null);
    }
  };

  // Stop Polymarket bot
  const stopPolymarketBot = async () => {
    setLoading('polymarket-stop');
    try {
      const result = await api.stopBot('polymarket');
      if (result.status === 'stopped' || result.message) {
        setPolymarketRunning(false);
        showSuccess(result.message || 'Polymarket bot stopped');
        refreshBotStatus();
      } else {
        showError('Failed to stop Polymarket bot: Unexpected response');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to stop Polymarket bot');
    } finally {
      setLoading(null);
    }
  };

  // Emergency stop all bots
  const emergencyStop = async () => {
    setLoading('emergency');
    try {
      await api.stopBot('all');
      setDexRunning(false);
      setPolymarketRunning(false);
      showSuccess('All bots stopped!');
      refreshBotStatus();
    } catch (err: any) {
      showError(err.message || 'Emergency stop failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relative">
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 rounded-2xl backdrop-blur-xl" />

      <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Bot Control Center</h2>
              <p className="text-sm text-slate-400">Multi-chain trading automation</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-sm font-medium text-slate-300">
              {wsConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg backdrop-blur-sm animate-in fade-in slide-in-from-top duration-300">
            <p className="text-green-400 text-sm font-medium flex items-center gap-2">
              <span>✓</span> {success}
            </p>
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg backdrop-blur-sm animate-in fade-in slide-in-from-top duration-300">
            <p className="text-red-400 text-sm font-medium flex items-center gap-2">
              <span>⚠</span> {error}
            </p>
          </div>
        )}

        {/* Emergency Stop Button */}
        <button
          onClick={emergencyStop}
          disabled={loading === 'emergency' || (!dexRunning && !polymarketRunning)}
          className="w-full mb-6 py-4 px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 disabled:opacity-50 shadow-lg hover:shadow-red-500/50"
        >
          {loading === 'emergency' ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Stopping All Bots...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span className="text-xl">🛑</span>
              EMERGENCY STOP ALL BOTS
            </span>
          )}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* DEX Bot Control */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl blur opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-slate-900/50 backdrop-blur-xl border border-blue-500/30 rounded-xl p-5 hover:border-blue-400/50 transition-all duration-300">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🔷</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">DEX Trading</h3>
                    <p className="text-xs text-slate-400">BNB Chain • PancakeSwap</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  dexRunning
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-slate-700 text-slate-400 border border-slate-600'
                }`}>
                  {dexRunning ? '● RUNNING' : '○ STOPPED'}
                </div>
              </div>

              {/* Configuration */}
              <div className="space-y-4 mb-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-slate-300">Max Trade Amount</label>
                    <span className="text-sm font-bold text-blue-400">{dexConfig.maxTradeAmount} BNB</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="1"
                    step="0.01"
                    value={dexConfig.maxTradeAmount}
                    onChange={(e) => setDexConfig({ ...dexConfig, maxTradeAmount: parseFloat(e.target.value) })}
                    disabled={dexRunning}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-slate-300">AI Confidence</label>
                    <span className="text-sm font-bold text-blue-400">{(dexConfig.confidenceThreshold * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="0.95"
                    step="0.05"
                    value={dexConfig.confidenceThreshold}
                    onChange={(e) => setDexConfig({ ...dexConfig, confidenceThreshold: parseFloat(e.target.value) })}
                    disabled={dexRunning}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Stop Loss</label>
                    <div className="px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
                      <span className="text-sm font-bold text-red-400">{dexConfig.stopLoss}%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Max Slippage</label>
                    <div className="px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
                      <span className="text-sm font-bold text-yellow-400">{dexConfig.maxSlippage}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={startDexBot}
                  disabled={dexRunning || loading === 'dex-start'}
                  className="py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 shadow-lg"
                >
                  {loading === 'dex-start' ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </span>
                  ) : (
                    '▶ Start'
                  )}
                </button>
                <button
                  onClick={stopDexBot}
                  disabled={!dexRunning || loading === 'dex-stop'}
                  className="py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 shadow-lg"
                >
                  {loading === 'dex-stop' ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </span>
                  ) : (
                    '⏹ Stop'
                  )}
                </button>
              </div>

              {/* Status Info */}
              {botStatus?.dex && dexRunning && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg backdrop-blur-sm">
                  <p className="text-xs text-blue-300">
                    <strong>Status:</strong> {botStatus.dex.status}
                  </p>
                  {botStatus.dex.lastTrade && (
                    <p className="text-xs text-slate-400 mt-1">
                      Last trade: {new Date(botStatus.dex.lastTrade).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Polymarket Bot Control */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl blur opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-slate-900/50 backdrop-blur-xl border border-purple-500/30 rounded-xl p-5 hover:border-purple-400/50 transition-all duration-300">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🎲</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Polymarket</h3>
                    <p className="text-xs text-slate-400">Polygon • Prediction Markets</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  polymarketRunning
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-slate-700 text-slate-400 border border-slate-600'
                }`}>
                  {polymarketRunning ? '● RUNNING' : '○ STOPPED'}
                </div>
              </div>

              {/* Configuration */}
              <div className="space-y-4 mb-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-slate-300">Max Trade Amount</label>
                    <span className="text-sm font-bold text-purple-400">{polymarketConfig.maxTradeAmount} USDC</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={polymarketConfig.maxTradeAmount}
                    onChange={(e) => setPolymarketConfig({ ...polymarketConfig, maxTradeAmount: parseFloat(e.target.value) })}
                    disabled={polymarketRunning}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-slate-300">AI Confidence</label>
                    <span className="text-sm font-bold text-purple-400">{(polymarketConfig.confidenceThreshold * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="0.95"
                    step="0.05"
                    value={polymarketConfig.confidenceThreshold}
                    onChange={(e) => setPolymarketConfig({ ...polymarketConfig, confidenceThreshold: parseFloat(e.target.value) })}
                    disabled={polymarketRunning}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Stop Loss</label>
                    <div className="px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
                      <span className="text-sm font-bold text-red-400">{polymarketConfig.stopLoss}%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Max Slippage</label>
                    <div className="px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
                      <span className="text-sm font-bold text-yellow-400">{polymarketConfig.maxSlippage}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={startPolymarketBot}
                  disabled={polymarketRunning || loading === 'polymarket-start'}
                  className="py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 shadow-lg"
                >
                  {loading === 'polymarket-start' ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </span>
                  ) : (
                    '▶ Start'
                  )}
                </button>
                <button
                  onClick={stopPolymarketBot}
                  disabled={!polymarketRunning || loading === 'polymarket-stop'}
                  className="py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 shadow-lg"
                >
                  {loading === 'polymarket-stop' ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </span>
                  ) : (
                    '⏹ Stop'
                  )}
                </button>
              </div>

              {/* Status Info */}
              {botStatus?.polymarket && polymarketRunning && (
                <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg backdrop-blur-sm">
                  <p className="text-xs text-purple-300">
                    <strong>Status:</strong> {botStatus.polymarket.status}
                  </p>
                  {botStatus.polymarket.lastTrade && (
                    <p className="text-xs text-slate-400 mt-1">
                      Last trade: {new Date(botStatus.polymarket.lastTrade).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl backdrop-blur-sm">
          <p className="text-sm text-slate-300 leading-relaxed">
            <strong className="text-blue-400">ℹ Info:</strong> Both bots operate independently with AI-powered decisions.
            DEX bot trades on PancakeSwap (BNB Chain), Polymarket bot trades prediction markets (Polygon).
            All decisions stored permanently on BNB Greenfield for continuous learning.
          </p>
        </div>
      </div>
    </div>
  );
}
