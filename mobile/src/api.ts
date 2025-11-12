/**
 * API Client for Mobile App
 */

import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001';

async function apiRequest(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

export const fetchBotStatus = () => apiRequest('/api/bot-status');

export const startBot = (config: { tokens: string[]; risk: number }) =>
  apiRequest('/api/start-bot', {
    method: 'POST',
    body: JSON.stringify(config),
  });

export const stopBot = () =>
  apiRequest('/api/stop-bot', {
    method: 'POST',
  });

export const fetchTradingStats = () => apiRequest('/api/trading-stats');

export const fetchTradeLogs = () => apiRequest('/api/trade-logs');

export const fetchPositions = () => apiRequest('/api/positions');

export const fetchMemories = () => apiRequest('/api/memories');

export const fetchDiscoverTokens = () => apiRequest('/api/discover-tokens');
