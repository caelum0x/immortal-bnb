// src/types/unifiedMemory.ts
// Unified memory schema for cross-chain trades (DEX + Polymarket)

/**
 * Unified Memory Schema
 * Works across PancakeSwap (DEX), Polymarket (Prediction Markets), and cross-chain arbitrage
 */
export interface ImmortalMemory {
  // Core identification
  id: string;
  timestamp: number;
  platform: 'pancakeswap' | 'polymarket' | 'cross-chain';
  chain: 'bnb' | 'opbnb' | 'polygon';

  // Transaction type
  type: 'trade' | 'bet' | 'arbitrage' | 'liquidity';
  action: 'buy' | 'sell' | 'add_liquidity' | 'remove_liquidity';

  // Asset information
  asset: {
    // For DEX trades
    tokenAddress?: string;
    tokenSymbol?: string;

    // For Polymarket
    marketId?: string;
    marketQuestion?: string;
    outcome?: string;

    // Universal
    name: string;
  };

  // Trade/Bet details
  execution: {
    entryPrice: number;
    exitPrice?: number;
    amount: number;
    amountUsd?: number;
    fees: number;
    slippage?: number;

    // For Polymarket
    probability?: number;
    shares?: number;
  };

  // Outcome tracking
  outcome: {
    status: 'pending' | 'success' | 'fail' | 'partially_filled';
    profitLoss?: number;
    profitLossPercentage?: number;
    profitLossUsd?: number;

    // For Polymarket
    resolved?: boolean;
    correctPrediction?: boolean;
    payout?: number;
  };

  // AI decision context
  ai: {
    reasoning: string;
    confidence: number;
    strategy: string;
    signals: string[];
    model: 'typescript-agent' | 'python-agent' | 'hybrid';
  };

  // Market conditions at time of trade
  market: {
    volume24h?: number;
    liquidity?: number;
    priceChange24h?: number;
    volatility?: number;
    buySellPressure?: number;

    // For Polymarket
    totalVolume?: number;
    liquidityPool?: number;
    eventCategory?: string;
  };

  // Cross-chain metadata
  crossChain?: {
    relatedTrades: string[]; // IDs of related trades on other chains
    arbitrageOpportunity?: boolean;
    priceDiscrepancy?: number;
  };

  // Learning data
  learning: {
    lessons?: string;
    whatWorked?: string[];
    whatFailed?: string[];
    improvements?: string[];
  };

  // Storage metadata
  storage: {
    greenfieldObjectName: string;
    greenfieldUrl?: string;
    txHash?: string;
    blockNumber?: number;
  };
}

/**
 * Memory analytics across all platforms
 */
export interface UnifiedMemoryAnalysis {
  // Overall stats
  total: {
    trades: number;
    volume: number;
    volumeUsd: number;
    profitLoss: number;
    profitLossUsd: number;
  };

  // Per-platform breakdown
  byPlatform: {
    pancakeswap: PlatformStats;
    polymarket: PlatformStats;
    crossChain: PlatformStats;
  };

  // Per-chain breakdown
  byChain: {
    bnb: ChainStats;
    opbnb: ChainStats;
    polygon: ChainStats;
  };

  // Time-based analysis
  performance: {
    last24h: PerformanceMetrics;
    last7d: PerformanceMetrics;
    last30d: PerformanceMetrics;
    allTime: PerformanceMetrics;
  };

  // AI performance
  aiPerformance: {
    typescriptAgent: AgentPerformance;
    pythonAgent: AgentPerformance;
    hybrid: AgentPerformance;
  };

  // Insights
  insights: {
    bestPerformingAsset: string;
    worstPerformingAsset: string;
    bestStrategy: string;
    bestTimeOfDay: string;
    recommendations: string[];
  };
}

export interface PlatformStats {
  trades: number;
  volume: number;
  profitLoss: number;
  winRate: number;
  avgTradeSize: number;
  bestTrade: number;
  worstTrade: number;
}

export interface ChainStats {
  trades: number;
  volume: number;
  profitLoss: number;
  gasSpent: number;
  avgGasPrice: number;
}

export interface PerformanceMetrics {
  trades: number;
  winRate: number;
  profitLoss: number;
  roi: number;
  sharpeRatio?: number;
  maxDrawdown: number;
}

export interface AgentPerformance {
  totalDecisions: number;
  successfulTrades: number;
  avgConfidence: number;
  avgAccuracy: number;
  profitLoss: number;
  bestStrategy: string;
}

/**
 * Memory query filters
 */
export interface MemoryQueryFilters {
  platform?: 'pancakeswap' | 'polymarket' | 'cross-chain';
  chain?: 'bnb' | 'opbnb' | 'polygon';
  type?: 'trade' | 'bet' | 'arbitrage';
  outcome?: 'pending' | 'success' | 'fail';
  startDate?: number;
  endDate?: number;
  minProfitLoss?: number;
  maxProfitLoss?: number;
  aiModel?: 'typescript-agent' | 'python-agent' | 'hybrid';
  limit?: number;
  offset?: number;
}

/**
 * Batch upload configuration
 */
export interface BatchUploadConfig {
  maxBatchSize: number;
  retryAttempts: number;
  retryDelay: number;
  compression: boolean;
  encryption: boolean;
}

/**
 * Memory synchronization status
 */
export interface SyncStatus {
  lastSyncTimestamp: number;
  pendingUploads: number;
  failedUploads: number;
  totalSynced: number;
  syncInProgress: boolean;
  errors: string[];
}
