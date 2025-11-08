'use client'

import { useState } from 'react'

export default function SetupGuide() {
  const [showGuide, setShowGuide] = useState(false)

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">🚀 Quick Setup Guide</h2>
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          {showGuide ? 'Hide Guide' : 'Show Setup'}
        </button>
      </div>

      {showGuide && (
        <div className="space-y-4 text-sm">
          <div className="bg-slate-900/50 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">1. Environment Configuration</h3>
            <p className="text-slate-300 mb-2">Create a <code className="bg-slate-700 px-1 rounded">.env</code> file in your project root:</p>
            <pre className="bg-slate-800 p-3 rounded text-xs text-slate-300 overflow-x-auto">
{`# Required for trading
WALLET_PRIVATE_KEY=your_wallet_private_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Optional
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here

# Network Configuration
TRADING_NETWORK=opbnb  # or 'bnb'
NETWORK=testnet        # or 'mainnet'`}
            </pre>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">2. Get API Keys</h3>
            <ul className="space-y-1 text-slate-300">
              <li>• <a href="https://openrouter.ai" className="text-blue-400 hover:underline">OpenRouter AI</a> - For AI trading decisions</li>
              <li>• <a href="https://t.me/botfather" className="text-blue-400 hover:underline">Telegram BotFather</a> - For notifications (optional)</li>
              <li>• MetaMask/Trust Wallet - For wallet private key</li>
            </ul>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">3. Start Trading</h3>
            <div className="space-y-2 text-slate-300">
              <div className="flex items-center space-x-2">
                <span>📁</span>
                <code className="bg-slate-700 px-2 py-1 rounded">npm install</code>
                <span>- Install dependencies</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>⚡</span>
                <code className="bg-slate-700 px-2 py-1 rounded">npm run dev</code>
                <span>- Start development servers</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🔥</span>
                <code className="bg-slate-700 px-2 py-1 rounded">npm run bot</code>
                <span>- Start trading bot</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 p-3 rounded-lg">
            <p className="text-sm">
              <strong>⚠️ Safety First:</strong> Start with testnet and small amounts. 
              Never share your private keys or commit them to version control.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
