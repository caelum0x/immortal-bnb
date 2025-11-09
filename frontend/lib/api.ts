// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// API client with error handling
class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      
      // Return mock data for development when backend is not configured
      if (error instanceof Error && error.message.includes('fetch')) {
        console.warn('🔄 Backend not available, using mock data for development');
        return this.getMockData(endpoint) as T;
      }
      
      throw error;
    }
  }

  private getMockData(endpoint: string): any {
    // Provide mock data when backend is not configured
    if (endpoint.includes('/api/status')) {
      return {
        status: 'demo',
        message: 'Backend not configured - Demo Mode',
        walletConnected: false,
        aiEnabled: false,
        needsSetup: true
      };
    }

    if (endpoint.includes('/api/wallet/balance')) {
      return {
        balance: '0.0000',
        usdValue: '0.00',
        network: 'Not Connected',
        address: 'Connect Wallet First'
      };
    }

    if (endpoint.includes('/api/trades')) {
      return {
        trades: [],
        total: 0,
        message: 'No trades available - Configure wallet first'
      };
    }

    if (endpoint.includes('/api/stats')) {
      return {
        totalTrades: 0,
        successRate: 0,
        totalProfit: '0.00',
        needsConfiguration: true
      };
    }

    return { error: 'Backend not configured', needsSetup: true };
  }

  // Bot Status API - Updated to match backend endpoints
  async getBotStatus() {
    return this.request<{
      status: 'running' | 'stopped' | 'error' | 'demo';
      message: string;
      walletConnected?: boolean;
      aiEnabled?: boolean;
      needsSetup?: boolean;
    }>('/api/status');
  }

  // Wallet API - Updated to match backend
  async getWalletBalance() {
    return this.request<{
      balance: string;
      usdValue: string;
      network: string;
      address: string;
    }>('/api/wallet/balance');
  }

  // Trading History API - Updated to match backend
  async getTradingHistory(limit = 20) {
    return this.request<{
      trades: Array<{
        id: string;
        timestamp: string;
        pair: string;
        type: 'buy' | 'sell';
        amount: string;
        price: string;
        status: 'completed' | 'pending' | 'failed';
        pnl?: string;
        txHash?: string;
      }>;
      total: number;
    }>(`/api/trades?limit=${limit}`);
  }

  // Performance API - Updated to match backend stats endpoint
  async getPerformanceData() {
    return this.request<{
      totalTrades: number;
      successRate: number;
      totalProfit: string;
      needsConfiguration?: boolean;
    }>('/api/stats');
  }

  // Bot Control API (for future implementation)
  async startBot() {
    return this.request<{ success: boolean; message: string }>('/api/bot/start', {
      method: 'POST',
    });
  }

  async stopBot() {
    return this.request<{ success: boolean; message: string }>('/api/bot/stop', {
      method: 'POST',
    });
  }

  // Wallet Info API (compatibility method)
  async getWalletInfo(address?: string) {
    // Redirect to wallet balance endpoint since backend uses that
    return this.getWalletBalance();
  }

  // Dashboard Stats API
  async getDashboardStats() {
    return this.request<{
      totalProfit: string;
      profitChange: string;
      totalTrades: number;
      successRate: number;
      activePositions: number;
      daysProfitable: number;
      aiStatus: {
        isLearning: boolean;
        confidence: number;
        memoryCount: number;
        lastUpdate: string;
      };
    }>('/api/dashboard/stats');
  }

  // Memory API
  async getMemories(limit = 10) {
    return this.request<{
      memories: Array<{
        id: string;
        timestamp: number;
        action: string;
        outcome: string;
        profitLoss?: number;
        tokenSymbol: string;
      }>;
      total: number;
    }>(`/api/memories?limit=${limit}`);
  }

  // Token Data API
  async getTokenData(tokenAddress: string) {
    return this.request<{
      address: string;
      symbol: string;
      name: string;
      price: number;
      priceChange24h: number;
      volume24h: number;
      liquidity: number;
      marketCap: number;
    }>(`/api/token/${tokenAddress}`);
  }

  // Health Check
  async getHealth() {
    return this.request<{
      status: 'healthy' | 'unhealthy';
      timestamp: string;
      uptime: number;
      version: string;
    }>('/api/health');
  }
}

// Create singleton instance
export const apiClient = new APIClient(API_BASE_URL);

// Convenience functions
export const api = {
  // Bot operations
  getBotStatus: () => apiClient.getBotStatus(),
  startBot: () => apiClient.startBot(),
  stopBot: () => apiClient.stopBot(),

  // Wallet operations
  getWalletInfo: (address: string) => apiClient.getWalletInfo(address),

  // Trading operations
  getTradingHistory: (limit?: number) => apiClient.getTradingHistory(limit),
  getPerformanceData: () => apiClient.getPerformanceData(),

  // Dashboard operations
  getDashboardStats: () => apiClient.getDashboardStats(),
  getMemories: (limit?: number) => apiClient.getMemories(limit),

  // Token operations
  getTokenData: (address: string) => apiClient.getTokenData(address),

  // Health check
  getHealth: () => apiClient.getHealth(),
};

export default apiClient;

// Type exports for components
export interface TradeMemory {
  id: string;
  timestamp: number;
  tokenSymbol: string;
  tokenAddress: string;
  action: 'buy' | 'sell';
  amount: number;
  entryPrice: number;
  exitPrice?: number;
  outcome: 'profit' | 'loss' | 'pending';
  aiReasoning: string;
  marketConditions: {
    volume24h: number;
    liquidity: number;
    priceChange24h: number;
    marketTrend: 'bullish' | 'bearish' | 'sideways';
    buySellPressure: number;
  };
  strategy: string;
  profitLoss?: number;
  success?: boolean;
}

export interface TradingStats {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  totalProfit: number;
  totalLoss: number;
  winRate: number;
  avgProfit: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;
  totalVolume: number;
  wins: number;
  losses: number;
  totalPL: number;
  avgPL: number;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  priceUsd: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap?: number;
  score?: number;
  trending?: boolean;
}

// Export convenience functions
export async function getMemories(limit = 50): Promise<TradeMemory[]> {
  const response = await apiClient.getMemories(limit);
  // Transform backend response to match TradeMemory interface
  return response.memories.map(m => ({
    id: m.id,
    timestamp: m.timestamp,
    tokenSymbol: m.tokenSymbol || 'UNKNOWN',
    tokenAddress: '0x0000000000000000000000000000000000000000',
    action: (m.action.toLowerCase() === 'buy' || m.action.toLowerCase() === 'sell' ? m.action.toLowerCase() : 'buy') as 'buy' | 'sell',
    amount: 0.1,
    entryPrice: 0,
    outcome: (m.outcome === 'profit' || m.outcome === 'loss' || m.outcome === 'pending' ? m.outcome : 'pending') as 'profit' | 'loss' | 'pending',
    aiReasoning: 'AI analysis in progress',
    marketConditions: {
      volume24h: 0,
      liquidity: 0,
      priceChange24h: 0,
      marketTrend: 'sideways' as const,
      buySellPressure: 1.0,
    },
    strategy: 'Dynamic AI Trading',
    profitLoss: m.profitLoss,
  }));
}

export async function getTradingStats(): Promise<TradingStats> {
  const response = await apiClient.getDashboardStats();
  return {
    totalTrades: response.totalTrades,
    successfulTrades: Math.floor(response.totalTrades * (response.successRate / 100)),
    failedTrades: Math.floor(response.totalTrades * (1 - response.successRate / 100)),
    totalProfit: parseFloat(response.totalProfit) || 0,
    totalLoss: 0,
    winRate: response.successRate,
    avgProfit: 0,
    avgLoss: 0,
    bestTrade: 0,
    worstTrade: 0,
    totalVolume: 0,
    wins: Math.floor(response.totalTrades * (response.successRate / 100)),
    losses: Math.floor(response.totalTrades * (1 - response.successRate / 100)),
    totalPL: parseFloat(response.totalProfit) || 0,
    avgPL: 0,
  };
}

export async function discoverTokens(): Promise<TokenInfo[]> {
  // Mock implementation for now - needs backend endpoint
  return [];
}
