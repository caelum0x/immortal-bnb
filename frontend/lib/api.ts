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
      throw error;
    }
  }

  // Bot Status API
  async getBotStatus() {
    return this.request<{
      status: 'running' | 'stopped' | 'error';
      lastAction: string;
      totalTrades: number;
      successRate: number;
      currentAction: string;
      uptime: number;
    }>('/api/bot/status');
  }

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

  // Wallet API
  async getWalletInfo(address: string) {
    return this.request<{
      balance: string;
      usdValue: string;
      network: string;
      address: string;
    }>(`/api/wallet/${address}`);
  }

  // Trading History API
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

  // Performance API
  async getPerformanceData(timeframe = '24h') {
    return this.request<{
      totalProfit: string;
      profitChange: string;
      chartData: Array<{ time: string; value: number }>;
      stats: {
        todayProfit: string;
        todayTrades: number;
        todayWinRate: number;
      };
    }>(`/api/performance?timeframe=${timeframe}`);
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
  getPerformanceData: (timeframe?: string) => apiClient.getPerformanceData(timeframe),

  // Dashboard operations
  getDashboardStats: () => apiClient.getDashboardStats(),
  getMemories: (limit?: number) => apiClient.getMemories(limit),

  // Token operations
  getTokenData: (address: string) => apiClient.getTokenData(address),

  // Health check
  getHealth: () => apiClient.getHealth(),
};

export default apiClient;
