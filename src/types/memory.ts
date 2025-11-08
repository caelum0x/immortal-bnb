// src/types/memory.ts
// Shared types for memory storage system

export interface TradeMemory {
  id: string;
  timestamp: number;
  tokenAddress: string;
  tokenSymbol: string;
  action: 'buy' | 'sell';
  entryPrice: number;
  exitPrice?: number;
  amount: number;
  outcome?: 'profit' | 'loss' | 'pending';
  profitLoss?: number;
  profitLossPercentage?: number;
  aiReasoning: string;
  marketConditions: {
    volume24h: number;
    liquidity: number;
    priceChange24h: number;
    buySellPressure: number;
  };
  lessons?: string;
}

export interface MemoryAnalysis {
  totalTrades: number;
  winRate: number;
  avgProfitLoss: number;
  bestToken: string | null;
  worstToken: string | null;
  insights: string[];
}

export interface StorageStats {
  totalMemories: number;
  oldestMemory: number | null;
  newestMemory: number | null;
  totalSize: number;
}
