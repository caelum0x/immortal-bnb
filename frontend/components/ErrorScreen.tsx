'use client';

import { AlertTriangle, RefreshCw, ArrowLeft, Droplets } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ErrorScreenProps {
  type?: 'low-liquidity' | 'api-offline' | 'network-error' | 'insufficient-funds' | 'generic';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function ErrorScreen({
  type = 'generic',
  title,
  description,
  actionLabel,
  onAction,
}: ErrorScreenProps) {
  const router = useRouter();

  const errorConfigs = {
    'low-liquidity': {
      icon: Droplets,
      title: 'Low Liquidity Detected',
      description: 'This token has insufficient liquidity for safe trading. High slippage expected.',
      color: 'yellow',
      suggestions: [
        'Try a smaller trade amount',
        'Wait for liquidity to increase',
        'Check alternative DEXs',
        'Consider splitting the trade',
      ],
    },
    'api-offline': {
      icon: AlertTriangle,
      title: 'API Service Unavailable',
      description: 'Unable to connect to the trading backend. Please try again in a moment.',
      color: 'red',
      suggestions: [
        'Check your internet connection',
        'Refresh the page',
        'Try again in a few minutes',
        'Check status page for updates',
      ],
    },
    'network-error': {
      icon: AlertTriangle,
      title: 'Network Connection Error',
      description: 'Unable to connect to the blockchain network.',
      color: 'red',
      suggestions: [
        'Check your wallet connection',
        'Verify network settings',
        'Switch to a different RPC',
        'Check if the network is congested',
      ],
    },
    'insufficient-funds': {
      icon: AlertTriangle,
      title: 'Insufficient Funds',
      description: 'Your wallet does not have enough balance to complete this transaction.',
      color: 'orange',
      suggestions: [
        'Add funds to your wallet',
        'Reduce trade amount',
        'Account for gas fees',
        'Check token balances',
      ],
    },
    generic: {
      icon: AlertTriangle,
      title: 'Something Went Wrong',
      description: 'An unexpected error occurred. Please try again.',
      color: 'red',
      suggestions: [
        'Refresh the page',
        'Check your connection',
        'Try again later',
        'Contact support if issue persists',
      ],
    },
  };

  const config = errorConfigs[type];
  const Icon = config.icon;

  const colorClasses = {
    yellow: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      iconBg: 'bg-yellow-500/10',
    },
    red: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      iconBg: 'bg-red-500/10',
    },
    orange: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
      iconBg: 'bg-orange-500/10',
    },
  };

  const colors = colorClasses[config.color as keyof typeof colorClasses];

  const handleBack = () => {
    router.back();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Error Card */}
        <div className={`${colors.bg} backdrop-blur-sm border ${colors.border} rounded-xl p-8 shadow-2xl`}>
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className={`p-4 ${colors.iconBg} rounded-full`}>
              <Icon className={`w-16 h-16 ${colors.text}`} />
            </div>
          </div>

          {/* Title */}
          <h1 className={`text-3xl font-bold ${colors.text} text-center mb-4`}>
            {title || config.title}
          </h1>

          {/* Description */}
          <p className="text-gray-300 text-center mb-6">
            {description || config.description}
          </p>

          {/* Suggestions */}
          <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Suggested Actions:</h3>
            <ul className="space-y-2">
              {config.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-300">
                  <span className={`${colors.text} mt-0.5`}>•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onAction ? (
              <button
                onClick={onAction}
                className={`flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors`}
              >
                <span>{actionLabel || 'Try Again'}</span>
              </button>
            ) : (
              <button
                onClick={handleRefresh}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Refresh Page</span>
              </button>
            )}
            <button
              onClick={handleBack}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Go Back</span>
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-200 text-center">
              💡 Need help?{' '}
              <a
                href="https://github.com/caelum0x/immortal-bnb/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline font-semibold"
              >
                Report this issue
              </a>
            </p>
          </div>
        </div>

        {/* Status Cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Error Type</p>
            <p className={`text-sm font-semibold ${colors.text}`}>{type}</p>
          </div>
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Timestamp</p>
            <p className="text-sm font-semibold text-gray-300">
              {new Date().toLocaleTimeString()}
            </p>
          </div>
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Severity</p>
            <p className={`text-sm font-semibold ${colors.text}`}>
              {config.color === 'red' ? 'High' : config.color === 'orange' ? 'Medium' : 'Low'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export specific error screens as separate components
export function LowLiquidityError(props: Omit<ErrorScreenProps, 'type'>) {
  return <ErrorScreen {...props} type="low-liquidity" />;
}

export function APIOfflineError(props: Omit<ErrorScreenProps, 'type'>) {
  return <ErrorScreen {...props} type="api-offline" />;
}

export function NetworkError(props: Omit<ErrorScreenProps, 'type'>) {
  return <ErrorScreen {...props} type="network-error" />;
}

export function InsufficientFundsError(props: Omit<ErrorScreenProps, 'type'>) {
  return <ErrorScreen {...props} type="insufficient-funds" />;
}
