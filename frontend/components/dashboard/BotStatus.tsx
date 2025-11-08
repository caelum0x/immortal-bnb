'use client'

import { useBotStatus } from '@/lib/hooks'

export default function BotStatus() {
  const {
    status,
    message,
    walletConnected,
    aiEnabled,
    needsSetup,
    isLoading,
    error,
    isToggling,
    toggleBot,
  } = useBotStatus();

  const getStatusColor = () => {
    switch (status) {
      case 'running': return 'text-green-400'
      case 'stopped': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      case 'demo': return 'text-blue-400'
      default: return 'text-slate-400'
    }
  }

  const getStatusBg = () => {
    switch (status) {
      case 'running': return 'bg-green-500/20 border-green-500/30'
      case 'stopped': return 'bg-yellow-500/20 border-yellow-500/30'
      case 'error': return 'bg-red-500/20 border-red-500/30'
      case 'demo': return 'bg-blue-500/20 border-blue-500/30'
      default: return 'bg-slate-500/20 border-slate-500/30'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'running': return 'Running'
      case 'stopped': return 'Stopped'
      case 'error': return 'Error'
      case 'demo': return 'Demo Mode'
      default: return 'Unknown'
    }
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Bot Status</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBg()} ${getStatusColor()}`}>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${status === 'running' ? 'bg-green-500 animate-pulse' : status === 'error' ? 'bg-red-500' : status === 'demo' ? 'bg-blue-500' : 'bg-yellow-500'}`}></div>
            <span>{getStatusText()}</span>
          </div>
        </div>
      </div>

      {/* Setup Required Notice */}
      {needsSetup && (
        <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 p-4 rounded-lg mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-5 h-5">⚠️</div>
            <span className="font-medium">Configuration Required</span>
          </div>
          <div className="text-sm text-yellow-300 space-y-1">
            <p>To start trading, please configure:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Wallet Private Key (WALLET_PRIVATE_KEY)</li>
              <li>OpenRouter AI API Key (OPENROUTER_API_KEY)</li>
              <li>Telegram Bot Token (TELEGRAM_BOT_TOKEN) - optional</li>
            </ul>
            <p className="mt-2 text-xs">Create a <code>.env</code> file in the project root with your configuration.</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Status Message */}
      <div className="mb-4">
        <div className="text-sm text-slate-400 mb-1">Status</div>
        <div className="text-white">{message}</div>
      </div>

      {/* Configuration Status */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900/50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${walletConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-slate-300">Wallet</span>
          </div>
          <span className="text-xs text-slate-400">
            {walletConnected ? 'Connected' : 'Not configured'}
          </span>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${aiEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-slate-300">AI Engine</span>
          </div>
          <span className="text-xs text-slate-400">
            {aiEnabled ? 'Ready' : 'API key needed'}
          </span>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-4">
          <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <div className="text-sm text-slate-400">Loading status...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Control Button */}
          <button
            onClick={toggleBot}
            disabled={needsSetup || isToggling}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              needsSetup 
                ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed' 
                : status === 'running'
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
            }`}
          >
            {isToggling ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : needsSetup ? (
              'Configure Bot First'
            ) : status === 'running' ? (
              'Stop Bot'
            ) : (
              'Start Bot'
            )}
          </button>

          {/* Quick Stats */}
          {!needsSetup && (
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="text-sm text-slate-400">Mode</div>
                <div className="text-white font-medium">
                  {status === 'demo' ? 'Demo' : 'Live Trading'}
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="text-sm text-slate-400">Network</div>
                <div className="text-white font-medium">BNB Chain</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
