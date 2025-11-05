/**
 * API Service for connecting frontend to backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface BotStatus {
  status: string;
  balance: number;
  network: string;
  chainId: number;
  totalTrades: number;
  timestamp: number;
}

export interface TradeMemory {
  id: string;
  timestamp: number;
  tokenAddress: string;
  tokenSymbol: string;
  action: 'buy' | 'sell';
  entryPrice: number;
  amount: number;
  outcome: 'profit' | 'loss' | 'pending';
  profitLoss?: number;
  aiReasoning: string;
  marketConditions: {
    volume24h: number;
    liquidity: number;
    priceChange24h: number;
    buySellPressure: number;
  };
}

export interface TradeStats {
  totalTrades: number;
  completedTrades: number;
  pendingTrades: number;
  profitableTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfitLoss: number;
  bestTrade: TradeMemory | null;
  worstTrade: TradeMemory | null;
}

export interface TokenData {
  address: string;
  symbol: string;
  name: string;
  priceUsd: string;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  txns24h: {
    buys: number;
    sells: number;
  };
}

class APIService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Health check
  async checkHealth(): Promise<{ status: string; timestamp: number }> {
    return this.fetch('/api/health');
  }

  // Get bot status
  async getBotStatus(): Promise<BotStatus> {
    return this.fetch('/api/status');
  }

  // Get wallet balance
  async getWalletBalance(): Promise<{ balance: number; currency: string; network: string }> {
    return this.fetch('/api/wallet/balance');
  }

  // Get all trades
  async getTrades(limit: number = 50): Promise<{ trades: TradeMemory[]; total: number; returned: number }> {
    return this.fetch(`/api/trades?limit=${limit}`);
  }

  // Get single trade
  async getTrade(memoryId: string): Promise<TradeMemory> {
    return this.fetch(`/api/trades/${memoryId}`);
  }

  // Get trade statistics
  async getStats(): Promise<TradeStats> {
    return this.fetch('/api/stats');
  }

  // Get token data
  async getTokenData(address: string): Promise<TokenData> {
    return this.fetch(`/api/token/${address}`);
  }

  // Get token balance
  async getTokenBalance(address: string): Promise<{ tokenAddress: string; balance: string }> {
    return this.fetch(`/api/token/${address}/balance`);
  }
}

export const api = new APIService();
export default api;
