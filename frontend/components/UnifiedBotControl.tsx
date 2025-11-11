/**
 * Unified Bot Control Component
 * Single control panel for DEX and Polymarket trading bots
 */

'use client';

import React, { useState } from 'react';
import { useWebSocketContext } from '../src/contexts/WebSocketContext';

interface BotConfig {
  maxTradeAmount: number;
  confidenceThreshold: number;
  stopLoss: number;
  maxSlippage: number;
}

interface BotControlProps {
  apiUrl?: string;
}

export default function UnifiedBotControl({ apiUrl = 'http://localhost:3001' }: BotControlProps) {
  const { botStatus, isConnected } = useWebSocketContext();
  const [dexRunning, setDexRunning] = useState(false);
  const [polymarketRunning, setPolymarketRunning] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

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

  // Start DEX bot
  const startDexBot = async () => {
    setLoading('dex-start');
    try {
      const response = await fetch(`${apiUrl}/api/start-bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: dexConfig }),
      });
      if (response.ok) {
        setDexRunning(true);
      }
    } catch (error) {
      console.error('Error starting DEX bot:', error);
    } finally {
      setLoading(null);
    }
  };

  // Stop DEX bot
  const stopDexBot = async () => {
    setLoading('dex-stop');
    try {
      const response = await fetch(`${apiUrl}/api/stop-bot`, {
        method: 'POST',
      });
      if (response.ok) {
        setDexRunning(false);
      }
    } catch (error) {
      console.error('Error stopping DEX bot:', error);
    } finally {
      setLoading(null);
    }
  };

  // Start Polymarket bot
  const startPolymarketBot = async () => {
    setLoading('polymarket-start');
    try {
      const response = await fetch('http://localhost:5000/api/run-trading-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        setPolymarketRunning(true);
      }
    } catch (error) {
      console.error('Error starting Polymarket bot:', error);
    } finally {
      setLoading(null);
    }
  };

  // Stop Polymarket bot
  const stopPolymarketBot = async () => {
    setLoading('polymarket-stop');
    setPolymarketRunning(false);
    setLoading(null);
  };

  // Emergency stop all bots
  const emergencyStop = async () => {
    setLoading('emergency');
    await Promise.all([
      stopDexBot(),
      stopPolymarketBot(),
    ]);
    setLoading(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          🤖 Unified Bot Control
        </h2>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Emergency Stop Button */}
      <div className="mb-6">
        <button
          onClick={emergencyStop}
          disabled={loading === 'emergency' || (!dexRunning && !polymarketRunning)}
          className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold rounded-lg transition-colors"
        >
          🛑 EMERGENCY STOP ALL BOTS
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DEX Bot Control */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              🔷 DEX Trading Bot
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              dexRunning
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {dexRunning ? 'Running' : 'Stopped'}
            </span>
          </div>

          {/* DEX Configuration */}
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Trade Amount (BNB)
              </label>
              <input
                type="number"
                step="0.01"
                value={dexConfig.maxTradeAmount}
                onChange={(e) => setDexConfig({ ...dexConfig, maxTradeAmount: parseFloat(e.target.value) })}
                disabled={dexRunning}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confidence Threshold ({(dexConfig.confidenceThreshold * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={dexConfig.confidenceThreshold}
                onChange={(e) => setDexConfig({ ...dexConfig, confidenceThreshold: parseFloat(e.target.value) })}
                disabled={dexRunning}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stop Loss ({dexConfig.stopLoss}%)
              </label>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={dexConfig.stopLoss}
                onChange={(e) => setDexConfig({ ...dexConfig, stopLoss: parseInt(e.target.value) })}
                disabled={dexRunning}
                className="w-full"
              />
            </div>
          </div>

          {/* DEX Control Buttons */}
          <div className="flex gap-2">
            <button
              onClick={startDexBot}
              disabled={dexRunning || loading === 'dex-start'}
              className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              {loading === 'dex-start' ? '⏳ Starting...' : '▶️ Start'}
            </button>
            <button
              onClick={stopDexBot}
              disabled={!dexRunning || loading === 'dex-stop'}
              className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              {loading === 'dex-stop' ? '⏳ Stopping...' : '⏹️ Stop'}
            </button>
          </div>

          {/* DEX Status from WebSocket */}
          {botStatus.dex && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                Status: {botStatus.dex.status}
                {botStatus.dex.message && ` - ${botStatus.dex.message}`}
              </p>
            </div>
          )}
        </div>

        {/* Polymarket Bot Control */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              🎲 Polymarket Bot
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              polymarketRunning
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {polymarketRunning ? 'Running' : 'Stopped'}
            </span>
          </div>

          {/* Polymarket Configuration */}
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Trade Amount (USDC)
              </label>
              <input
                type="number"
                step="1"
                value={polymarketConfig.maxTradeAmount}
                onChange={(e) => setPolymarketConfig({ ...polymarketConfig, maxTradeAmount: parseFloat(e.target.value) })}
                disabled={polymarketRunning}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confidence Threshold ({(polymarketConfig.confidenceThreshold * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={polymarketConfig.confidenceThreshold}
                onChange={(e) => setPolymarketConfig({ ...polymarketConfig, confidenceThreshold: parseFloat(e.target.value) })}
                disabled={polymarketRunning}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stop Loss ({polymarketConfig.stopLoss}%)
              </label>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={polymarketConfig.stopLoss}
                onChange={(e) => setPolymarketConfig({ ...polymarketConfig, stopLoss: parseInt(e.target.value) })}
                disabled={polymarketRunning}
                className="w-full"
              />
            </div>
          </div>

          {/* Polymarket Control Buttons */}
          <div className="flex gap-2">
            <button
              onClick={startPolymarketBot}
              disabled={polymarketRunning || loading === 'polymarket-start'}
              className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              {loading === 'polymarket-start' ? '⏳ Starting...' : '▶️ Start'}
            </button>
            <button
              onClick={stopPolymarketBot}
              disabled={!polymarketRunning || loading === 'polymarket-stop'}
              className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              {loading === 'polymarket-stop' ? '⏳ Stopping...' : '⏹️ Stop'}
            </button>
          </div>

          {/* Polymarket Status from WebSocket */}
          {botStatus.polymarket && (
            <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm text-purple-900 dark:text-purple-200">
                Status: {botStatus.polymarket.status}
                {botStatus.polymarket.message && ` - ${botStatus.polymarket.message}`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info Panel */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          ℹ️ <strong>Note:</strong> Both bots operate independently. DEX bot trades on PancakeSwap (BNB/opBNB),
          while Polymarket bot trades prediction markets on Polygon. All trades are stored permanently on BNB Greenfield.
        </p>
      </div>
    </div>
  );
}
