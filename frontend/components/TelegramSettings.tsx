'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, X, AlertCircle, Info, Send, Loader2 } from 'lucide-react';

interface TelegramStatus {
  isRunning: boolean;
  subscribers: number;
  totalAlerts: number;
  subscribedChatIds: string[];
  alertStats: {
    trades: number;
    decisions: number;
    errors: number;
    profits: number;
    losses: number;
  };
}

export default function TelegramSettings() {
  const [chatId, setChatId] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchStatus();
    // Load saved chat ID from localStorage
    const savedChatId = localStorage.getItem('telegram_chat_id');
    if (savedChatId) {
      setChatId(savedChatId);
      setIsConfigured(true);
    }
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/telegram/status`);
      const data = await response.json();

      if (data.success) {
        setStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching telegram status:', error);
    }
  };

  const verifyChatId = async () => {
    if (!chatId.trim()) {
      setMessage({
        type: 'error',
        text: 'Please enter a chat ID',
      });
      return;
    }

    setVerifying(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/api/telegram/verify-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId: chatId.trim() }),
      });

      const data = await response.json();

      if (data.success && data.data.isValid) {
        setMessage({
          type: 'success',
          text: 'Chat ID verified successfully!',
        });
        return true;
      } else {
        setMessage({
          type: 'error',
          text: 'Invalid chat ID. Please start the bot by sending /start to @YourBotName',
        });
        return false;
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to verify chat ID',
      });
      return false;
    } finally {
      setVerifying(false);
    }
  };

  const subscribeTelegram = async () => {
    if (!chatId.trim()) {
      setMessage({
        type: 'error',
        text: 'Please enter a chat ID',
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // First verify the chat ID
      const isValid = await verifyChatId();
      if (!isValid) {
        setLoading(false);
        return;
      }

      // Subscribe the chat
      const response = await fetch(`${API_URL}/api/telegram/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId: chatId.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('telegram_chat_id', chatId.trim());
        setIsConfigured(true);
        setMessage({
          type: 'success',
          text: 'Successfully subscribed to Telegram notifications!',
        });
        await fetchStatus();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to subscribe',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to configure Telegram notifications',
      });
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeTelegram = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/api/telegram/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId: chatId.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.removeItem('telegram_chat_id');
        setIsConfigured(false);
        setMessage({
          type: 'info',
          text: 'Unsubscribed from Telegram notifications',
        });
        await fetchStatus();
      } else {
        setMessage({
          type: 'error',
          text: 'Failed to unsubscribe',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to unsubscribe from Telegram notifications',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestAlert = async () => {
    if (!chatId.trim()) {
      setMessage({
        type: 'error',
        text: 'Please enter a chat ID first',
      });
      return;
    }

    setTesting(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/api/telegram/test-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId: chatId.trim() }),
      });

      const data = await response.json();

      if (data.success && data.data.sent) {
        setMessage({
          type: 'success',
          text: 'Test alert sent! Check your Telegram.',
        });
      } else {
        setMessage({
          type: 'error',
          text: 'Failed to send test alert',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to send test alert',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-blue-500/10 rounded-lg">
          <Bell className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Telegram Notifications</h2>
          <p className="text-sm text-gray-400 mt-1">
            Configure real-time trading alerts via Telegram
          </p>
        </div>
      </div>

      {/* Status Card */}
      {status && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-300">Bot Status</h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                status.isRunning
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-red-500/10 text-red-400'
              }`}
            >
              {status.isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400">Subscribers</p>
              <p className="text-lg font-semibold text-white">{status.subscribers}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Alerts</p>
              <p className="text-lg font-semibold text-white">{status.totalAlerts}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Trade Alerts</p>
              <p className="text-lg font-semibold text-white">{status.alertStats.trades}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">AI Decisions</p>
              <p className="text-lg font-semibold text-white">{status.alertStats.decisions}</p>
            </div>
          </div>
        </div>
      )}

      {/* Setup Instructions */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200">
            <p className="font-medium mb-2">How to get your Chat ID:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Start a chat with your bot on Telegram</li>
              <li>Send the /start command to the bot</li>
              <li>Send /debug command to get your Chat ID</li>
              <li>Copy the Chat ID and paste it below</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Telegram Chat ID
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="Enter your Telegram chat ID"
              className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isConfigured}
            />
            {!isConfigured && (
              <button
                onClick={verifyChatId}
                disabled={verifying || !chatId.trim()}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div
            className={`p-3 rounded-lg flex items-start space-x-2 ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/30'
                : message.type === 'error'
                ? 'bg-red-500/10 border border-red-500/30'
                : 'bg-blue-500/10 border border-blue-500/30'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
            ) : message.type === 'error' ? (
              <X className="w-5 h-5 text-red-400 flex-shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
            )}
            <p
              className={`text-sm ${
                message.type === 'success'
                  ? 'text-green-200'
                  : message.type === 'error'
                  ? 'text-red-200'
                  : 'text-blue-200'
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          {!isConfigured ? (
            <button
              onClick={subscribeTelegram}
              disabled={loading || !chatId.trim()}
              className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Subscribing...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Subscribe</span>
                </>
              )}
            </button>
          ) : (
            <>
              <button
                onClick={sendTestAlert}
                disabled={testing}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Test</span>
                  </>
                )}
              </button>
              <button
                onClick={unsubscribeTelegram}
                disabled={loading}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Unsubscribing...</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    <span>Unsubscribe</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alert Types */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Alert Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-300">Trade Executions</span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-300">AI Decisions</span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-300">Position Updates</span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-300">Market Alerts</span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-300">Risk Warnings</span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-300">Daily Summary</span>
          </div>
        </div>
      </div>
    </div>
  );
}
