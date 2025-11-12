'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { useWeb3 } from '@/components/providers/Web3Provider'

interface BotSettings {
  // Risk Management
  maxSlippage: number
  maxTradeSize: number
  stopLossPercentage: number
  takeProfitPercentage: number

  // Trading Strategy
  tradingEnabled: boolean
  dexTradingEnabled: boolean
  polymarketTradingEnabled: boolean
  flashLoanEnabled: boolean
  mevProtectionEnabled: boolean

  // Advanced
  gasMultiplier: number
  minProfitThreshold: number
  maxDailyTrades: number
  autoCompound: boolean

  // Notifications
  notifyOnTrade: boolean
  notifyOnProfit: boolean
  notifyOnLoss: boolean
  emailNotifications: boolean
}

export default function SettingsPage() {
  const { isConnected, address, network } = useWeb3()
  const router = useRouter()
  const [settings, setSettings] = useState<BotSettings>({
    maxSlippage: 1.0,
    maxTradeSize: 1.0,
    stopLossPercentage: 5.0,
    takeProfitPercentage: 10.0,
    tradingEnabled: false,
    dexTradingEnabled: true,
    polymarketTradingEnabled: false,
    flashLoanEnabled: false,
    mevProtectionEnabled: true,
    gasMultiplier: 1.2,
    minProfitThreshold: 0.5,
    maxDailyTrades: 50,
    autoCompound: false,
    notifyOnTrade: true,
    notifyOnProfit: true,
    notifyOnLoss: true,
    emailNotifications: false,
  })
  const [loading, setLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
      return
    }

    loadSettings()
  }, [isConnected, router])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      setSaveMessage('')

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })

      if (response.ok) {
        setSaveMessage('Settings saved successfully!')
        setTimeout(() => setSaveMessage(''), 3000)
      } else {
        setSaveMessage('Failed to save settings')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      setSaveMessage('Error saving settings')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset to default settings?')) {
      loadSettings()
      setSaveMessage('Settings reset to defaults')
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  if (!isConnected) {
    return null
  }

  return (
    <main className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">⚙️ Settings</h1>
          <p className="text-slate-300">Configure your bot's trading parameters and preferences</p>
        </div>

        {/* Account Info */}
        <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-slate-400 text-sm mb-1">Wallet Address</div>
              <div className="text-white font-mono text-sm">{address}</div>
            </div>
            <div>
              <div className="text-slate-400 text-sm mb-1">Network</div>
              <div className="text-white text-sm">{network || 'Unknown'}</div>
            </div>
          </div>
        </div>

        {/* Risk Management */}
        <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Risk Management</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm mb-2">
                Max Slippage (%): {settings.maxSlippage}%
              </label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={settings.maxSlippage}
                onChange={(e) =>
                  setSettings({ ...settings, maxSlippage: parseFloat(e.target.value) })
                }
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">
                Max Trade Size (BNB): {settings.maxTradeSize}
              </label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={settings.maxTradeSize}
                onChange={(e) =>
                  setSettings({ ...settings, maxTradeSize: parseFloat(e.target.value) })
                }
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">
                Stop Loss (%): {settings.stopLossPercentage}%
              </label>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={settings.stopLossPercentage}
                onChange={(e) =>
                  setSettings({ ...settings, stopLossPercentage: parseFloat(e.target.value) })
                }
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">
                Take Profit (%): {settings.takeProfitPercentage}%
              </label>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={settings.takeProfitPercentage}
                onChange={(e) =>
                  setSettings({ ...settings, takeProfitPercentage: parseFloat(e.target.value) })
                }
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
            </div>
          </div>
        </div>

        {/* Trading Strategy */}
        <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Trading Strategy</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
              <div>
                <div className="text-white font-semibold">Trading Enabled</div>
                <div className="text-slate-400 text-sm">Master switch for all trading activities</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.tradingEnabled}
                  onChange={(e) =>
                    setSettings({ ...settings, tradingEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
              <div>
                <div className="text-white font-semibold">DEX Trading</div>
                <div className="text-slate-400 text-sm">Trade on BNB Chain DEXs</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.dexTradingEnabled}
                  onChange={(e) =>
                    setSettings({ ...settings, dexTradingEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
              <div>
                <div className="text-white font-semibold">Polymarket Trading</div>
                <div className="text-slate-400 text-sm">Trade on Polymarket prediction markets</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.polymarketTradingEnabled}
                  onChange={(e) =>
                    setSettings({ ...settings, polymarketTradingEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
              <div>
                <div className="text-white font-semibold">Flash Loan Arbitrage</div>
                <div className="text-slate-400 text-sm">Execute high-capital arbitrage with flash loans</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.flashLoanEnabled}
                  onChange={(e) =>
                    setSettings({ ...settings, flashLoanEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
              <div>
                <div className="text-white font-semibold">MEV Protection</div>
                <div className="text-slate-400 text-sm">Use Flashbots for protected transactions</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.mevProtectionEnabled}
                  onChange={(e) =>
                    setSettings({ ...settings, mevProtectionEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Advanced Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm mb-2">
                Gas Price Multiplier: {settings.gasMultiplier}x
              </label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={settings.gasMultiplier}
                onChange={(e) =>
                  setSettings({ ...settings, gasMultiplier: parseFloat(e.target.value) })
                }
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <p className="text-slate-400 text-xs mt-1">
                Higher values increase transaction speed but cost more gas
              </p>
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">
                Min Profit Threshold (%): {settings.minProfitThreshold}%
              </label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={settings.minProfitThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, minProfitThreshold: parseFloat(e.target.value) })
                }
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <p className="text-slate-400 text-xs mt-1">
                Only execute trades with profit above this threshold
              </p>
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">
                Max Daily Trades: {settings.maxDailyTrades}
              </label>
              <input
                type="range"
                min="10"
                max="200"
                step="10"
                value={settings.maxDailyTrades}
                onChange={(e) =>
                  setSettings({ ...settings, maxDailyTrades: parseInt(e.target.value) })
                }
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
              <div>
                <div className="text-white font-semibold">Auto-Compound Profits</div>
                <div className="text-slate-400 text-sm">Reinvest profits automatically</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoCompound}
                  onChange={(e) =>
                    setSettings({ ...settings, autoCompound: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
              <div>
                <div className="text-white font-semibold">Notify on Trade</div>
                <div className="text-slate-400 text-sm">Get notified when a trade is executed</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifyOnTrade}
                  onChange={(e) =>
                    setSettings({ ...settings, notifyOnTrade: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
              <div>
                <div className="text-white font-semibold">Notify on Profit</div>
                <div className="text-slate-400 text-sm">Get notified when a trade is profitable</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifyOnProfit}
                  onChange={(e) =>
                    setSettings({ ...settings, notifyOnProfit: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
              <div>
                <div className="text-white font-semibold">Notify on Loss</div>
                <div className="text-slate-400 text-sm">Get notified when a trade results in loss</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifyOnLoss}
                  onChange={(e) =>
                    setSettings({ ...settings, notifyOnLoss: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
              <div>
                <div className="text-white font-semibold">Email Notifications</div>
                <div className="text-slate-400 text-sm">Receive notifications via email</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) =>
                    setSettings({ ...settings, emailNotifications: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              saveMessage.includes('success')
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {saveMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : '💾 Save Settings'}
          </button>
          <button
            onClick={handleReset}
            className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </main>
  )
}
