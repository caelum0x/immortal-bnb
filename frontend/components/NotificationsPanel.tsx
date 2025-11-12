'use client';

import { useEffect, useState } from 'react';
import useWebSocket from '@/lib/useWebSocket';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
  details?: string;
}

export default function NotificationsPanel() {
  const { isConnected, lastTrade, botStatus, newOpportunity } = useWebSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  // Listen for new trades
  useEffect(() => {
    if (lastTrade) {
      const isProfitable = (lastTrade.profit || 0) > 0;
      addNotification({
        type: isProfitable ? 'success' : 'warning',
        message: `Trade ${lastTrade.status === 'SUCCESS' ? 'executed' : 'failed'}`,
        details: `${lastTrade.tokenIn} → ${lastTrade.tokenOut} on ${lastTrade.chain}`,
        timestamp: Date.now(),
      });
    }
  }, [lastTrade]);

  // Listen for bot status changes
  useEffect(() => {
    if (botStatus) {
      const dexChanged = botStatus.dex.status;
      const polyChanged = botStatus.polymarket.status;

      if (dexChanged === 'RUNNING') {
        addNotification({
          type: 'success',
          message: 'DEX Bot Started',
          details: 'Trading bot is now active on BNB Chain',
          timestamp: Date.now(),
        });
      } else if (dexChanged === 'STOPPED') {
        addNotification({
          type: 'info',
          message: 'DEX Bot Stopped',
          details: 'Trading bot has been stopped',
          timestamp: Date.now(),
        });
      } else if (dexChanged === 'ERROR') {
        addNotification({
          type: 'error',
          message: 'DEX Bot Error',
          details: 'Trading bot encountered an error',
          timestamp: Date.now(),
        });
      }

      if (polyChanged === 'RUNNING') {
        addNotification({
          type: 'success',
          message: 'Polymarket Bot Started',
          details: 'Prediction market bot is now active',
          timestamp: Date.now(),
        });
      } else if (polyChanged === 'STOPPED') {
        addNotification({
          type: 'info',
          message: 'Polymarket Bot Stopped',
          details: 'Prediction market bot has been stopped',
          timestamp: Date.now(),
        });
      }
    }
  }, [botStatus]);

  // Listen for new opportunities
  useEffect(() => {
    if (newOpportunity) {
      addNotification({
        type: 'info',
        message: `New ${newOpportunity.type} opportunity found!`,
        details: `Expected profit: ${newOpportunity.expectedProfit.toFixed(4)} (${(newOpportunity.confidence * 100).toFixed(0)}% confidence)`,
        timestamp: Date.now(),
      });
    }
  }, [newOpportunity]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [{ id, ...notification }, ...prev].slice(0, 10)); // Keep last 10

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
    }
  };

  const getColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400';
      case 'error':
        return 'from-red-500/20 to-rose-500/20 border-red-500/30 text-red-400';
      case 'warning':
        return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-400';
      case 'info':
        return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400';
    }
  };

  return (
    <div className="relative">
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl backdrop-blur-xl" />

      <div className="relative bg-slate-800/50 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-xl">🔔</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Notifications</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                <span className="text-xs text-slate-400">
                  {isConnected ? 'Live' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-xs font-medium transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              {isExpanded ? '▼ Collapse' : '▶ Expand'}
            </button>
          </div>
        </div>

        {/* Notifications List */}
        {isExpanded && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">🔕</div>
                <p className="text-slate-400 text-sm">No notifications yet</p>
                <p className="text-slate-500 text-xs mt-1">
                  You'll see real-time updates here when trading
                </p>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`relative group animate-slide-in-top`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${getColor(notification.type).split(' ')[0]} ${getColor(notification.type).split(' ')[1]} rounded-lg blur opacity-50`} />
                  <div className={`relative bg-slate-800/80 backdrop-blur-sm border ${getColor(notification.type).split(' ')[2]} rounded-lg p-3`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getColor(notification.type).split(' ')[0]} ${getColor(notification.type).split(' ')[1]} border ${getColor(notification.type).split(' ')[2]}`}>
                        <span className="text-xs font-bold">{getIcon(notification.type)}</span>
                      </div>
                      <div className="flex-1">
                        <div className={`font-semibold text-sm ${getColor(notification.type).split(' ')[3]}`}>
                          {notification.message}
                        </div>
                        {notification.details && (
                          <div className="text-xs text-slate-400 mt-1">
                            {notification.details}
                          </div>
                        )}
                        <div className="text-xs text-slate-500 mt-1">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <button
                        onClick={() => removeNotification(notification.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white"
                      >
                        <span className="text-lg">×</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer Stats */}
        {!isExpanded && notifications.length > 0 && (
          <div className="text-center text-sm text-slate-400">
            {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in-top {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-in-top {
          animation: slide-in-top 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
