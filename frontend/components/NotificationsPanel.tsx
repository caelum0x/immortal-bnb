/**
 * Notifications Panel Component
 * Displays real-time WebSocket events with toast notifications
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocketContext } from '../src/contexts/WebSocketContext';
import { format } from 'date-fns';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: number;
}

export default function NotificationsPanel() {
  const { events, clearEvents, isConnected } = useWebSocketContext();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [showToasts, setShowToasts] = useState(true);

  // Add toast notification
  const addToast = (toast: Omit<Toast, 'id' | 'timestamp'>) => {
    const newToast: Toast = {
      ...toast,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 5000);
  };

  // Listen for new events and create toasts
  useEffect(() => {
    if (!showToasts || events.length === 0) return;

    const latestEvent = events[0];
    let toastMessage = '';
    let toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

    switch (latestEvent.type) {
      case 'trade':
        toastMessage = `Trade ${latestEvent.outcome}: ${latestEvent.platform}`;
        toastType = latestEvent.outcome === 'success' ? 'success' : 'error';
        break;
      case 'bot-status':
        toastMessage = `Bot ${latestEvent.platform}: ${latestEvent.status}`;
        toastType = latestEvent.status === 'running' ? 'success' : 'warning';
        break;
      case 'opportunity':
        toastMessage = `New opportunity on ${latestEvent.platform}`;
        toastType = 'info';
        break;
      case 'memory':
        toastMessage = `Memory ${latestEvent.action}`;
        toastType = 'info';
        break;
      case 'balance':
        toastMessage = `Balance updated: ${latestEvent.token}`;
        toastType = latestEvent.change >= 0 ? 'success' : 'warning';
        break;
    }

    if (toastMessage) {
      addToast({ type: toastType, message: toastMessage });
    }
  }, [events]);

  // Filter events
  const filteredEvents = filter === 'all'
    ? events
    : events.filter(event => event.type === filter);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'trade': return '💱';
      case 'bot-status': return '🤖';
      case 'opportunity': return '💡';
      case 'memory': return '💾';
      case 'balance': return '💰';
      default: return '📢';
    }
  };

  const getEventColor = (event: any) => {
    switch (event.type) {
      case 'trade':
        return event.outcome === 'success' ? 'green' : 'red';
      case 'bot-status':
        return event.status === 'running' ? 'green' : event.status === 'stopped' ? 'gray' : 'red';
      case 'opportunity':
        return 'blue';
      case 'memory':
        return 'purple';
      case 'balance':
        return event.change >= 0 ? 'green' : 'orange';
      default:
        return 'gray';
    }
  };

  const getToastIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const getToastColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'warning': return 'bg-orange-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            🔔 Live Notifications
          </h2>
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowToasts(!showToasts)}
            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            {showToasts ? '🔕 Mute' : '🔔 Unmute'}
          </button>
          <button
            onClick={clearEvents}
            className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['all', 'trade', 'bot-status', 'opportunity', 'memory', 'balance'].map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              filter === filterType
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {filterType === 'all' ? '🌐 All' : `${getEventIcon(filterType)} ${filterType}`}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-4xl mb-2">📭</p>
            <p>No notifications yet</p>
            <p className="text-sm mt-1">Events will appear here when they occur</p>
          </div>
        ) : (
          filteredEvents.map((event, index) => {
            const color = getEventColor(event);
            return (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 border-${color}-500 bg-${color}-50 dark:bg-${color}-900/20`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="text-xl">{getEventIcon(event.type)}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {event.type === 'trade' && `Trade ${event.outcome} on ${event.platform}`}
                        {event.type === 'bot-status' && `Bot ${event.status}: ${event.platform}`}
                        {event.type === 'opportunity' && `New opportunity: ${event.description}`}
                        {event.type === 'memory' && `Memory ${event.action}`}
                        {event.type === 'balance' && `Balance change: ${event.token}`}
                      </p>
                      {event.type === 'trade' && event.pnl && (
                        <p className={`text-sm mt-1 ${event.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          P&L: {event.pnl >= 0 ? '+' : ''}{event.pnl.toFixed(4)}
                        </p>
                      )}
                      {event.type === 'opportunity' && (
                        <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                          Confidence: {(event.confidence * 100).toFixed(0)}%
                          {event.potentialProfit && ` | Potential: $${event.potentialProfit.toFixed(2)}`}
                        </p>
                      )}
                      {event.type === 'balance' && (
                        <p className={`text-sm mt-1 ${event.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {event.change >= 0 ? '+' : ''}{event.change.toFixed(4)} {event.token}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {format(event.timestamp, 'MMM dd, yyyy HH:mm:ss')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${getToastColor(toast.type)} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] animate-slide-in`}
          >
            <span className="text-xl">{getToastIcon(toast.type)}</span>
            <div className="flex-1">
              <p className="font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
