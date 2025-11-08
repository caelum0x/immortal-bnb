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

// Immortal AI types
export interface AIPersonality {
  riskTolerance: number;
  aggressiveness: number;
  learningRate: number;
  memoryWeight: number;
  explorationRate: number;
  confidenceThreshold: number;
}

export interface AIDecision {
  action: 'BUY' | 'SELL' | 'HOLD';
  amount: number;
  confidence: number;
  reasoning: string;
  strategy: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AIStatus {
  status: string;
  personality: AIPersonality;
  memoryStats: {
    totalMemories: number;
    successfulTrades: number;
    totalProfit: number;
  };
  successRate: number;
  capabilities: {
    decisionMaking: boolean;
    memoryLearning: boolean;
    crossChainArbitrage: boolean;
    strategyEvolution: boolean;
  };
  timestamp: number;
}

export interface CrossChainOpportunity {
  id: string;
  sourceChain: string;
  targetChain: string;
  tokenSymbol: string;
  sourcePrice: number;
  targetPrice: number;
  priceDifference: number;
  profitPotential: number;
  volume24h: number;
  liquidity: { source: number; target: number };
  bridgeFee: number;
  gasCosts: { source: number; target: number };
  executionTime: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
}

export interface StrategyMetrics {
  generation: number;
  totalStrategies: number;
  avgFitness: number;
  bestFitness: number;
  evolutionHistory: any[];
}

export interface MarketSentiment {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  reasoning: string;
}

class APIService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(`Network error: Cannot connect to backend at ${this.baseUrl}. Make sure the backend is running.`);
      }
      throw error;
    }
  }

  // Test connection to backend
  async ping(): Promise<{ message: string; timestamp: number; frontend_connected: boolean }> {
    return this.fetch('/api/ping');
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

  // =============================================================================
  // IMMORTAL AI AGENT METHODS
  // =============================================================================

  // Get AI agent status and personality
  async getAIStatus(): Promise<AIStatus> {
    return this.fetch('/api/ai/status');
  }

  // Get AI decision for a specific token
  async getAIDecision(tokenAddress: string, availableAmount?: number): Promise<{
    tokenAddress: string;
    tokenSymbol: string;
    decision: AIDecision;
    timestamp: number;
  }> {
    const response = await fetch(`${this.baseUrl}/api/ai/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tokenAddress, availableAmount }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get cross-chain arbitrage opportunities
  async getCrossChainOpportunities(): Promise<{
    opportunities: CrossChainOpportunity[];
    count: number;
    timestamp: number;
  }> {
    return this.fetch('/api/ai/crosschain');
  }

  // Get strategy evolution status and metrics
  async getStrategyMetrics(): Promise<{
    strategies: any[];
    metrics: StrategyMetrics;
    timestamp: number;
  }> {
    return this.fetch('/api/ai/strategies');
  }

  // Trigger strategy evolution
  async triggerStrategyEvolution(): Promise<{ message: string; timestamp: number }> {
    const response = await fetch(`${this.baseUrl}/api/ai/evolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Analyze market sentiment for a token
  async analyzeSentiment(tokenSymbol: string, tokenAddress?: string): Promise<{
    tokenSymbol: string;
    sentiment: MarketSentiment;
    timestamp: number;
  }> {
    const response = await fetch(`${this.baseUrl}/api/ai/sentiment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tokenSymbol, tokenAddress }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Load immortal memories for AI agent
  async loadAIMemories(): Promise<{ message: string; timestamp: number }> {
    const response = await fetch(`${this.baseUrl}/api/ai/load-memories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

export const api = new APIService();
export default api;
