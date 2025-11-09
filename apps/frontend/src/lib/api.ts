/**
 * Production API Integration Layer
 * All API calls to backend - NO MOCKS
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
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

export interface APIError {
  message: string;
  code?: string;
  details?: any;
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with detailed error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<APIError>) => {
    if (error.response) {
      // Server responded with error status
      console.error('[API Error]', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
      });
    } else if (error.request) {
      // Request made but no response
      console.error('[API Error] No response from server:', error.message);
    } else {
      // Error setting up request
      console.error('[API Error] Request setup failed:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Start the trading bot
 */
export async function startBot(params: StartBotRequest): Promise<StartBotResponse> {
  try {
    const response = await apiClient.post<StartBotResponse>('/api/start-bot', params);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to start bot');
  }
}

/**
 * Stop the trading bot
 */
export async function stopBot(): Promise<{ status: string; message: string }> {
  try {
    const response = await apiClient.post('/api/stop-bot');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to stop bot');
  }
}

/**
 * Get bot status
 */
export async function getBotStatus(): Promise<BotStatus> {
  try {
    const response = await apiClient.get<BotStatus>('/api/bot-status');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to get bot status');
  }
}

/**
 * Get trading memories from Greenfield
 */
export async function getMemories(limit: number = 50): Promise<TradeMemory[]> {
  try {
    const response = await apiClient.get<{ total: number; memories: TradeMemory[] }>(
      '/api/memories',
      { params: { limit } }
    );
    return response.data.memories || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to fetch memories');
  }
}

/**
 * Discover trending tokens from DexScreener
 */
export async function discoverTokens(limit: number = 10): Promise<TokenInfo[]> {
  try {
    const response = await apiClient.get<{ tokens: TokenInfo[]; timestamp: number }>(
      '/api/discover-tokens',
      { params: { limit } }
    );
    return response.data.tokens || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to discover tokens');
  }
}

/**
 * Get trading statistics
 */
export async function getTradingStats(): Promise<TradingStats> {
  try {
    const response = await apiClient.get<TradingStats>('/api/trading-stats');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to get trading stats');
  }
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ status: string; timestamp: number; botRunning?: boolean }> {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error: any) {
    throw new Error('Backend server is not responding');
  }
}

/**
 * Check if backend is available
 */
export async function isBackendAvailable(): Promise<boolean> {
  try {
    await healthCheck();
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// POLYMARKET PREDICTION MARKETS API
// =============================================================================

export interface PolymarketMarket {
  id: string;
  question: string;
  description?: string;
  endDate?: string;
  volume?: string;
  liquidity?: string;
  active?: boolean;
  condition_id?: string;
}

export interface AIMarketAnalysis {
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  suggestedPrice: number;
  suggestedSize: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reasoning: string;
  expectedReturn?: number;
  timeframe?: string;
}

export interface PolymarketBalance {
  matic: number;
  usdc: number;
}

export interface PolymarketPosition {
  marketId: string;
  marketQuestion: string;
  outcome: string;
  size: number;
  avgPrice: number;
  currentPrice?: number;
  pnl?: number;
}

export interface PolymarketOrder {
  id: string;
  marketId: string;
  side: 'BUY' | 'SELL';
  price: number;
  size: number;
  filled: number;
  status: string;
}

export interface CrossPlatformOpportunity {
  type: 'CORRELATION' | 'ARBITRAGE' | 'HEDGING' | 'DIRECTIONAL';
  description: string;
  expectedProfit: number;
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  markets?: PolymarketMarket[];
  tokens?: string[];
  action: string;
}

/**
 * Get trending Polymarket markets
 */
export async function getPolymarketMarkets(limit: number = 10): Promise<PolymarketMarket[]> {
  try {
    const response = await apiClient.get<{ markets: PolymarketMarket[]; count: number; timestamp: number }>(
      '/api/polymarket/markets',
      { params: { limit } }
    );
    return response.data.markets || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to fetch Polymarket markets');
  }
}

/**
 * Get AI analysis for a Polymarket market
 */
export async function analyzePolymarketMarket(marketId: string, question?: string): Promise<{
  market: PolymarketMarket;
  analysis: AIMarketAnalysis;
  timestamp: number;
}> {
  try {
    const response = await apiClient.post('/api/polymarket/analyze', {
      marketId,
      question,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to analyze market');
  }
}

/**
 * Get Polymarket wallet balance
 */
export async function getPolymarketBalance(): Promise<PolymarketBalance> {
  try {
    const response = await apiClient.get<{ balances: PolymarketBalance; timestamp: number }>(
      '/api/polymarket/balance'
    );
    return response.data.balances;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to fetch Polymarket balance');
  }
}

/**
 * Get current Polymarket positions
 */
export async function getPolymarketPositions(): Promise<PolymarketPosition[]> {
  try {
    const response = await apiClient.get<{ positions: PolymarketPosition[]; count: number; timestamp: number }>(
      '/api/polymarket/positions'
    );
    return response.data.positions || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to fetch positions');
  }
}

/**
 * Get open Polymarket orders
 */
export async function getPolymarketOrders(): Promise<PolymarketOrder[]> {
  try {
    const response = await apiClient.get<{ orders: PolymarketOrder[]; count: number; timestamp: number }>(
      '/api/polymarket/orders'
    );
    return response.data.orders || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to fetch orders');
  }
}

/**
 * Get cross-platform trading opportunities
 */
export async function getCrossPlatformOpportunities(): Promise<CrossPlatformOpportunity[]> {
  try {
    const response = await apiClient.get<{ opportunities: CrossPlatformOpportunity[]; count: number; timestamp: number }>(
      '/api/polymarket/opportunities'
    );
    return response.data.opportunities || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to fetch opportunities');
  }
}

/**
 * Get orderbook for a specific market
 */
export async function getPolymarketOrderbook(marketId: string): Promise<{
  marketId: string;
  orderbook: any;
  midPrice: number | null;
  timestamp: number;
}> {
  try {
    const response = await apiClient.get(`/api/polymarket/orderbook/${marketId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to fetch orderbook');
  }
}
