'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { useWeb3 } from '@/components/providers/Web3Provider'

interface TelegramConfig {
  enabled: boolean
  botToken: string
  chatId: string
  notifications: {
    trades: boolean
    opportunities: boolean
    errors: boolean
    dailySummary: boolean
  }
  filters: {
    minProfitPercent: number
    minConfidence: number
  }
}

interface TelegramMessage {
  id: string
  timestamp: number
  type: 'trade' | 'opportunity' | 'error' | 'summary'
  message: string
  status: 'sent' | 'failed'
}

export default function TelegramPage() {
  const { isConnected } = useWeb3()
  const router = useRouter()

  const [config, setConfig] = useState<TelegramConfig>({
    enabled: false,
    botToken: '',
    chatId: '',
    notifications: {
      trades: true,
      opportunities: true,
      errors: true,
      dailySummary: true,
    },
    filters: {
      minProfitPercent: 1.0,
      minConfidence: 0.7,
    },
  })

  const [recentMessages, setRecentMessages] = useState<TelegramMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [botConnected, setBotConnected] = useState(false)

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
      return
    }

    fetchConfig()
    fetchRecentMessages()

    // Auto-refresh recent messages every 30s
    const interval = setInterval(fetchRecentMessages, 30000)
    return () => clearInterval(interval)
  }, [isConnected, router])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load from localStorage for now (backend endpoint can be added later)
      const savedConfig = localStorage.getItem('telegram-config')
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig)
        setConfig(parsed)
        setBotConnected(parsed.enabled && parsed.botToken && parsed.chatId)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentMessages = async () => {
    try {
      // Load from localStorage for now
      const savedMessages = localStorage.getItem('telegram-messages')
      if (savedMessages) {
        setRecentMessages(JSON.parse(savedMessages))
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    }
  }

  const saveConfig = async () => {
    try {
      setSaving(true)
      setError(null)

      // Validate config
      if (config.enabled && (!config.botToken || !config.chatId)) {
        throw new Error('Bot Token and Chat ID are required when Telegram is enabled')
      }

      // Save to localStorage (backend endpoint can be added later)
      localStorage.setItem('telegram-config', JSON.stringify(config))
      setBotConnected(config.enabled && config.botToken && config.chatId)

      // TODO: Send to backend API
      // await fetch(`${API_URL}/api/telegram/config`, {
      //   method: 'POST',
      //   body: JSON.stringify(config),
      // })

      alert('Configuration saved successfully!')
    } catch (err) {
      setError((err as Error).message)
      alert(`Error: ${(err as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async () => {
    try {
      setTesting(true)
      setTestResult(null)

      if (!config.botToken || !config.chatId) {
        throw new Error('Bot Token and Chat ID are required')
      }

      // Send test message via Telegram API
      const response = await fetch(
        `https://api.telegram.org/bot${config.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: config.chatId,
            text: '🤖 Immortal BNB Bot Test\n\nYour Telegram bot is configured correctly! You will receive trading notifications here.',
            parse_mode: 'Markdown',
          }),
        }
      )

      const data = await response.json()

      if (data.ok) {
        setTestResult({
          success: true,
          message: 'Test message sent successfully! Check your Telegram.',
        })

        // Add to recent messages
        const newMessage: TelegramMessage = {
          id: `msg_${Date.now()}`,
          timestamp: Date.now(),
          type: 'summary',
          message: 'Test message sent successfully',
          status: 'sent',
        }
        const updated = [newMessage, ...recentMessages].slice(0, 20)
        setRecentMessages(updated)
        localStorage.setItem('telegram-messages', JSON.stringify(updated))
      } else {
        throw new Error(data.description || 'Failed to send test message')
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: (err as Error).message,
      })
    } finally {
      setTesting(false)
    }
  }

  if (!isConnected) {
    return null
  }

  return (
    <main className="min-h-screen bg-slate-900">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Telegram Bot</h1>
              <p className="text-slate-400">Configure Telegram notifications for trading alerts</p>
            </div>
            <div className="flex items-center gap-3">
              {botConnected && (
                <div className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm font-bold flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Connected
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <p className="font-semibold text-red-400">Error</p>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Setup Instructions */}
        <div className="mb-8 bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span>📘</span> Setup Instructions
          </h3>
          <ol className="space-y-2 text-slate-300 text-sm">
            <li>1. Open Telegram and search for <code className="px-2 py-1 bg-slate-800 rounded text-blue-400">@BotFather</code></li>
            <li>2. Send <code className="px-2 py-1 bg-slate-800 rounded text-blue-400">/newbot</code> and follow instructions to create your bot</li>
            <li>3. Copy the <strong>Bot Token</strong> (looks like: <code className="text-xs">123456789:ABCdefGHIjklMNOpqrsTUVwxyz</code>)</li>
            <li>4. Start a chat with your bot and send any message</li>
            <li>5. Get your <strong>Chat ID</strong> from <code className="px-2 py-1 bg-slate-800 rounded text-blue-400">https://api.telegram.org/bot{'<YOUR_BOT_TOKEN>'}/getUpdates</code></li>
            <li>6. Enter both values below and click "Test Connection"</li>
          </ol>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="space-y-6">
            {/* Bot Credentials */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Bot Configuration</h3>

              <div className="space-y-4">
                {/* Enable/Disable */}
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                  <div>
                    <div className="font-semibold text-white">Enable Telegram Bot</div>
                    <div className="text-sm text-slate-400">Receive trading notifications via Telegram</div>
                  </div>
                  <button
                    onClick={() => setConfig({ ...config, enabled: !config.enabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.enabled ? 'bg-blue-600' : 'bg-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Bot Token */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Bot Token</label>
                  <input
                    type="password"
                    value={config.botToken}
                    onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Chat ID */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Chat ID</label>
                  <input
                    type="text"
                    value={config.chatId}
                    onChange={(e) => setConfig({ ...config, chatId: e.target.value })}
                    placeholder="123456789"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Test Connection Button */}
                <button
                  onClick={testConnection}
                  disabled={testing || !config.botToken || !config.chatId}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                >
                  {testing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Testing...
                    </span>
                  ) : (
                    '🧪 Test Connection'
                  )}
                </button>

                {/* Test Result */}
                {testResult && (
                  <div
                    className={`p-3 rounded-lg border ${
                      testResult.success
                        ? 'bg-green-500/20 border-green-500/30 text-green-400'
                        : 'bg-red-500/20 border-red-500/30 text-red-400'
                    }`}
                  >
                    <p className="text-sm">{testResult.message}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Notification Preferences</h3>

              <div className="space-y-3">
                {[
                  { key: 'trades', label: 'Trade Executions', desc: 'Get notified when trades are executed' },
                  { key: 'opportunities', label: 'New Opportunities', desc: 'Alert for profitable opportunities' },
                  { key: 'errors', label: 'Errors & Warnings', desc: 'Important error notifications' },
                  { key: 'dailySummary', label: 'Daily Summary', desc: 'Daily performance report' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <div>
                      <div className="text-sm font-semibold text-white">{item.label}</div>
                      <div className="text-xs text-slate-400">{item.desc}</div>
                    </div>
                    <button
                      onClick={() =>
                        setConfig({
                          ...config,
                          notifications: {
                            ...config.notifications,
                            [item.key]: !config.notifications[item.key as keyof typeof config.notifications],
                          },
                        })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.notifications[item.key as keyof typeof config.notifications]
                          ? 'bg-green-600'
                          : 'bg-slate-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.notifications[item.key as keyof typeof config.notifications]
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Notification Filters</h3>

              <div className="space-y-4">
                {/* Min Profit */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Minimum Profit % <span className="text-blue-400">{config.filters.minProfitPercent}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={config.filters.minProfitPercent}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        filters: { ...config.filters, minProfitPercent: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full"
                  />
                  <div className="text-xs text-slate-400 mt-1">Only notify about opportunities above this profit %</div>
                </div>

                {/* Min Confidence */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Minimum Confidence <span className="text-blue-400">{(config.filters.minConfidence * 100).toFixed(0)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.filters.minConfidence}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        filters: { ...config.filters, minConfidence: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full"
                  />
                  <div className="text-xs text-slate-400 mt-1">Only notify about high-confidence opportunities</div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={saveConfig}
              disabled={saving}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold rounded-lg transition-all transform hover:scale-[1.02] disabled:scale-100"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                '💾 Save Configuration'
              )}
            </button>
          </div>

          {/* Recent Messages Panel */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Recent Messages</h3>

            {recentMessages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-slate-400">No messages sent yet</p>
                <p className="text-sm text-slate-500 mt-2">Messages will appear here once bot is active</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {recentMessages.map((msg) => (
                  <div key={msg.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {msg.type === 'trade'
                            ? '💱'
                            : msg.type === 'opportunity'
                            ? '🎯'
                            : msg.type === 'error'
                            ? '⚠️'
                            : '📊'}
                        </span>
                        <span className="text-sm font-semibold text-white capitalize">{msg.type}</span>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          msg.status === 'sent' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {msg.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mb-2">{msg.message}</p>
                    <p className="text-xs text-slate-500">{new Date(msg.timestamp).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Messages Sent', value: recentMessages.filter((m) => m.status === 'sent').length, icon: '📤' },
            { label: 'Failed', value: recentMessages.filter((m) => m.status === 'failed').length, icon: '❌' },
            { label: 'Trade Alerts', value: recentMessages.filter((m) => m.type === 'trade').length, icon: '💱' },
            {
              label: 'Opportunities',
              value: recentMessages.filter((m) => m.type === 'opportunity').length,
              icon: '🎯',
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">{stat.label}</span>
                <span className="text-xl">{stat.icon}</span>
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
