/**
 * Dashboard Component
 * Main control panel for starting/stopping bot and configuring trading parameters
 */

'use client';

import { useState, useEffect } from 'react';
import { startBot, stopBot, getBotStatus, safeApiCall, BotStatus } from '@/lib/api';

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [isMock, setIsMock] = useState(false);

  // Form state
  const [tokenInputs, setTokenInputs] = useState<string[]>(['']);
  const [riskLevel, setRiskLevel] = useState(5);

  // Load bot status on mount
  useEffect(() => {
    loadBotStatus();
  }, []);

  const loadBotStatus = async () => {
    const { data, isMock } = await safeApiCall(
      () => getBotStatus(),
      {
        running: false,
        watchlist: [],
        riskLevel: 5,
        config: {
          maxTradeAmount: 1.0,
          stopLoss: 10,
          network: 'testnet',
        },
      }
    );
    setBotStatus(data);
    setIsMock(isMock);
    if (data.watchlist.length > 0) {
      setTokenInputs(data.watchlist);
    }
    if (data.riskLevel) {
      setRiskLevel(data.riskLevel);
    }
  };

  const handleAddToken = () => {
    setTokenInputs([...tokenInputs, '']);
  };

  const handleRemoveToken = (index: number) => {
    if (tokenInputs.length > 1) {
      const newTokens = tokenInputs.filter((_, i) => i !== index);
      setTokenInputs(newTokens);
    }
  };

  const handleTokenChange = (index: number, value: string) => {
    const newTokens = [...tokenInputs];
    newTokens[index] = value;
    setTokenInputs(newTokens);
  };

  const handleStartBot = async () => {
    setIsLoading(true);
    try {
      // Filter out empty token addresses
      const validTokens = tokenInputs.filter((t) => t.trim() !== '');

      if (validTokens.length === 0) {
        alert('Please add at least one token address');
        return;
      }

      const response = await startBot({
        tokens: validTokens,
        risk: riskLevel,
      });

      console.log('Bot started:', response);
      alert(`Bot started successfully! Monitoring ${validTokens.length} tokens with risk level ${riskLevel}`);

      // Reload status
      await loadBotStatus();
    } catch (error) {
      console.error('Failed to start bot:', error);
      alert('Failed to start bot. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopBot = async () => {
    setIsLoading(true);
    try {
      const response = await stopBot();
      console.log('Bot stopped:', response);
      alert('Bot stopped successfully!');

      // Reload status
      await loadBotStatus();
    } catch (error) {
      console.error('Failed to stop bot:', error);
      alert('Failed to stop bot. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskLevelColor = (level: number) => {
    if (level <= 3) return 'text-green-500';
    if (level <= 7) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRiskLevelLabel = (level: number) => {
    if (level <= 3) return 'Conservative';
    if (level <= 7) return 'Moderate';
    return 'Aggressive';
  };

  return (
    <div className="space-y-6">
      {/* Mock Data Warning */}
      {isMock && (
        <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <p className="font-semibold text-yellow-500">Using Mock Data</p>
              <p className="text-sm text-gray-300">
                Backend API is unavailable. Connect the backend server to enable real trading.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bot Status Card */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Bot Status</h2>
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                botStatus?.running ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="font-semibold">
              {botStatus?.running ? 'Running' : 'Stopped'}
            </span>
          </div>
        </div>

        {botStatus && botStatus.running && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Monitoring</p>
              <p className="font-semibold">{botStatus.watchlist.length} tokens</p>
            </div>
            <div>
              <p className="text-gray-400">Risk Level</p>
              <p className="font-semibold">{botStatus.riskLevel}/10</p>
            </div>
            <div>
              <p className="text-gray-400">Network</p>
              <p className="font-semibold capitalize">{botStatus.config.network}</p>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Card */}
      <div className="card p-6">
        <h2 className="text-2xl font-bold mb-6">Trading Configuration</h2>

        {/* Token Watchlist */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-3">
            Token Watchlist
            <span className="text-gray-400 font-normal ml-2">
              (Contract addresses to monitor)
            </span>
          </label>

          <div className="space-y-2">
            {tokenInputs.map((token, index) => (
              <div key={index} className="flex space-x-2">
                <input
                  type="text"
                  value={token}
                  onChange={(e) => handleTokenChange(index, e.target.value)}
                  placeholder="0x... (e.g., 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82)"
                  className="input flex-1"
                  disabled={botStatus?.running}
                />
                <button
                  onClick={() => handleRemoveToken(index)}
                  disabled={tokenInputs.length === 1 || botStatus?.running}
                  className="btn-secondary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddToken}
            disabled={botStatus?.running}
            className="btn-secondary mt-3 w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Add Token
          </button>

          <p className="text-xs text-gray-400 mt-2">
            💡 Leave empty to auto-discover trending tokens from DexScreener
          </p>
        </div>

        {/* Risk Level Slider */}
        <div className="mb-8">
          <label className="block text-sm font-semibold mb-3">
            Risk Level: <span className={getRiskLevelColor(riskLevel)}>{riskLevel}/10</span>
            <span className="text-gray-400 font-normal ml-2">
              ({getRiskLevelLabel(riskLevel)})
            </span>
          </label>

          <input
            type="range"
            min="1"
            max="10"
            value={riskLevel}
            onChange={(e) => setRiskLevel(parseInt(e.target.value))}
            disabled={botStatus?.running}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(to right, #0ECB81 0%, #F0B90B 50%, #F6465D 100%)`,
            }}
          />

          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1 (Safe)</span>
            <span>5 (Balanced)</span>
            <span>10 (Risky)</span>
          </div>

          <p className="text-xs text-gray-400 mt-2">
            💡 Higher risk = larger trade sizes & more aggressive entries
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          {!botStatus?.running ? (
            <button
              onClick={handleStartBot}
              disabled={isLoading}
              className="btn-primary flex-1 text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '⏳ Starting...' : '🚀 Start Trading Bot'}
            </button>
          ) : (
            <button
              onClick={handleStopBot}
              disabled={isLoading}
              className="btn-danger flex-1 text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '⏳ Stopping...' : '🛑 Stop Bot'}
            </button>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          ⚠️ The bot will execute real trades with your wallet. Monitor closely!
        </p>
      </div>

      {/* Configuration Info */}
      {botStatus && (
        <div className="card p-6">
          <h3 className="text-lg font-bold mb-4">Current Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Max Trade Amount</p>
              <p className="font-semibold">{botStatus.config.maxTradeAmount} BNB</p>
            </div>
            <div>
              <p className="text-gray-400">Stop Loss</p>
              <p className="font-semibold">{botStatus.config.stopLoss}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
