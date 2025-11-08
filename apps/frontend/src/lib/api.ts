/**
 * API Integration Layer
 * Handles all backend API calls for the trading bot
 */

import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL } from './wagmi';

// Types
export interface TradeMemory {
  id: string;
  timestamp: number;
  tokenAddress: string;
  tokenSymbol: string;
  action: 'buy' | 'sell';
  entryPrice: number;
  amount: number;
  outcome: 'pending' | 'profit' | 'loss';
  profitLoss?: number;
  aiReasoning: string;
  marketConditions: {
    volume24h: number;
    liquidity: number;
    priceChange24h: number;
    buySellPressure: number;
  };
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  priceUsd: string;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
}

export interface BotStatus {
  running: boolean;
  watchlist: string[];
  riskLevel: number;
  config: {
    maxTradeAmount: number;
    stopLoss: number;
    network: string;
  };
}

export interface TradingStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPL: number;
  avgPL: number;
}

export interface StartBotRequest {
  tokens: string[];
  risk: number;
}

export interface StartBotResponse {
  status: 'started';
  message: string;
  config: {
    tokens: string[];
    riskLevel: number;
    interval: number;
  };
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Start the trading bot
 */
export async function startBot(params: StartBotRequest): Promise<StartBotResponse> {
  const response = await apiClient.post<StartBotResponse>('/api/start-bot', params);
  return response.data;
}

/**
 * Stop the trading bot
 */
export async function stopBot(): Promise<{ status: string; message: string }> {
  const response = await apiClient.post('/api/stop-bot');
  return response.data;
}

/**
 * Get bot status
 */
export async function getBotStatus(): Promise<BotStatus> {
  const response = await apiClient.get<BotStatus>('/api/bot-status');
  return response.data;
}

/**
 * Get trading memories from Greenfield
 */
export async function getMemories(limit: number = 50): Promise<TradeMemory[]> {
  const response = await apiClient.get<{ total: number; memories: TradeMemory[] }>(
    '/api/memories',
    {
      params: { limit },
    }
  );
  return response.data.memories;
}

/**
 * Discover trending tokens from DexScreener
 */
export async function discoverTokens(limit: number = 10): Promise<TokenInfo[]> {
  const response = await apiClient.get<{ tokens: TokenInfo[]; timestamp: number }>(
    '/api/discover-tokens',
    {
      params: { limit },
    }
  );
  return response.data.tokens;
}

/**
 * Get trading statistics
 */
export async function getTradingStats(): Promise<TradingStats> {
  const response = await apiClient.get<TradingStats>('/api/trading-stats');
  return response.data;
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ status: string; timestamp: number }> {
  const response = await apiClient.get('/health');
  return response.data;
}

// Mock data generators for development (when API is unavailable)
export const mockMemories: TradeMemory[] = [
  {
    id: 'mock-1',
    timestamp: Date.now() - 3600000,
    tokenAddress: '0x1234567890abcdef',
    tokenSymbol: 'CAKE',
    action: 'buy',
    entryPrice: 2.45,
    amount: 0.5,
    outcome: 'profit',
    profitLoss: 0.025,
    aiReasoning: 'Strong buy pressure detected with increasing volume',
    marketConditions: {
      volume24h: 1500000,
      liquidity: 850000,
      priceChange24h: 12.5,
      buySellPressure: 0.75,
    },
  },
  {
    id: 'mock-2',
    timestamp: Date.now() - 7200000,
    tokenAddress: '0xabcdef1234567890',
    tokenSymbol: 'WBNB',
    action: 'sell',
    entryPrice: 305.2,
    amount: 0.1,
    outcome: 'pending',
    aiReasoning: 'Taking profits after 15% gain',
    marketConditions: {
      volume24h: 50000000,
      liquidity: 25000000,
      priceChange24h: 5.2,
      buySellPressure: 0.55,
    },
  },
];

export const mockTokens: TokenInfo[] = [
  {
    address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
    symbol: 'CAKE',
    name: 'PancakeSwap Token',
    priceUsd: '2.45',
    priceChange24h: 12.5,
    volume24h: 15000000,
    liquidity: 8500000,
    marketCap: 450000000,
  },
  {
    address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    symbol: 'WBNB',
    name: 'Wrapped BNB',
    priceUsd: '305.20',
    priceChange24h: 5.2,
    volume24h: 500000000,
    liquidity: 250000000,
    marketCap: 47000000000,
  },
];

export const mockStats: TradingStats = {
  totalTrades: 25,
  wins: 18,
  losses: 7,
  winRate: 72,
  totalPL: 1.25,
  avgPL: 0.05,
};

/**
 * Safely call API with fallback to mock data
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  mockData: T
): Promise<{ data: T; isMock: boolean }> {
  try {
    const data = await apiCall();
    return { data, isMock: false };
  } catch (error) {
    console.warn('[API] Using mock data due to error:', error);
    return { data: mockData, isMock: true };
  }
}
