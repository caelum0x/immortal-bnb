/**
 * Unified Memory Storage System
 * Handles cross-chain memory storage, batch uploads, and analytics
 */

import { Client } from '@bnb-chain/greenfield-js-sdk';
import { VisibilityType } from '@bnb-chain/greenfield-js-sdk';
import Long from 'long';
import { ethers } from 'ethers';
import { logger } from '../utils/logger.js';
import { CONFIG } from '../config.js';
import type {
  ImmortalMemory,
  UnifiedMemoryAnalysis,
  MemoryQueryFilters,
  BatchUploadConfig,
  SyncStatus,
  PlatformStats,
  ChainStats,
  PerformanceMetrics,
  AgentPerformance
} from '../types/unifiedMemory.js';

// Greenfield configuration
const GREENFIELD_RPC_URL = CONFIG.GREENFIELD_RPC_URL;
const GREENFIELD_CHAIN_ID = CONFIG.GREENFIELD_CHAIN_ID;
const BUCKET_NAME = CONFIG.GREENFIELD_BUCKET_NAME || 'immortal-trading-memories';
const ACCOUNT_PRIVATE_KEY = CONFIG.WALLET_PRIVATE_KEY;

// In-memory cache for pending uploads
const pendingUploads: ImmortalMemory[] = [];
const uploadQueue: ImmortalMemory[] = [];
let syncInProgress = false;

// Batch upload configuration
const BATCH_CONFIG: BatchUploadConfig = {
  maxBatchSize: 10,
  retryAttempts: 3,
  retryDelay: 2000,
  compression: false,
  encryption: false,
};

// Greenfield client
let client: Client;

/**
 * Initialize Greenfield client
 */
async function initClient(): Promise<Client> {
  if (!client) {
    client = Client.create(GREENFIELD_RPC_URL, GREENFIELD_CHAIN_ID);
    logger.info('✅ Unified memory storage client initialized');
  }
  return client;
}

/**
 * Store a unified memory to Greenfield
 */
export async function storeUnifiedMemory(memory: ImmortalMemory): Promise<boolean> {
  try {
    // Add to upload queue
    uploadQueue.push(memory);
    logger.info(`📝 Memory queued for upload: ${memory.id} (${memory.platform})`);

    // If batch is ready, trigger upload
    if (uploadQueue.length >= BATCH_CONFIG.maxBatchSize) {
      await processBatchUpload();
    }

    return true;
  } catch (error) {
    logger.error('Error queueing memory:', error);
    return false;
  }
}

/**
 * Process batch upload to Greenfield
 */
export async function processBatchUpload(): Promise<void> {
  if (syncInProgress || uploadQueue.length === 0) {
    return;
  }

  syncInProgress = true;
  logger.info(`🔄 Processing batch upload: ${uploadQueue.length} memories`);

  try {
    const batch = uploadQueue.splice(0, BATCH_CONFIG.maxBatchSize);

    for (const memory of batch) {
      try {
        await uploadSingleMemory(memory);
        logger.info(`✅ Uploaded memory: ${memory.id}`);
      } catch (error) {
        logger.error(`❌ Failed to upload memory ${memory.id}:`, error);
        pendingUploads.push(memory);
      }
    }

    logger.info(`✅ Batch upload complete`);
  } catch (error) {
    logger.error('Error processing batch upload:', error);
  } finally {
    syncInProgress = false;
  }
}

/**
 * Upload a single memory to Greenfield
 */
async function uploadSingleMemory(memory: ImmortalMemory): Promise<void> {
  if (!ACCOUNT_PRIVATE_KEY) {
    throw new Error('No wallet private key configured');
  }

  const greenfieldClient = await initClient();
  const wallet = new ethers.Wallet(ACCOUNT_PRIVATE_KEY);
  const objectName = memory.storage.greenfieldObjectName;

  // Convert memory to JSON
  const content = JSON.stringify(memory, null, 2);
  const contentBuffer = Buffer.from(content, 'utf-8');

  // Create object transaction
  const createObjectTx = await greenfieldClient.object.createObject({
    bucketName: BUCKET_NAME,
    objectName: objectName,
    creator: wallet.address,
    visibility: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
    contentType: 'application/json',
    redundancyType: 0, // REDUNDANCY_EC_TYPE
    payloadSize: Long.fromNumber(contentBuffer.length),
    expectChecksums: [new Uint8Array()],
  });

  // Simulate and broadcast
  const simulateInfo = await createObjectTx.simulate({ denom: 'BNB' });
  const broadcastRes = await createObjectTx.broadcast({
    denom: 'BNB',
    gasLimit: Number(simulateInfo.gasLimit),
    gasPrice: simulateInfo.gasPrice || '5000000000',
    payer: wallet.address,
    granter: '',
    privateKey: ACCOUNT_PRIVATE_KEY,
  });

  if (broadcastRes.code !== 0) {
    throw new Error(`Object creation failed: ${broadcastRes.rawLog}`);
  }

  // Upload object content
  await greenfieldClient.object.uploadObject(
    {
      bucketName: BUCKET_NAME,
      objectName: objectName,
      body: new File([contentBuffer], objectName, { type: 'application/json' }),
      txnHash: broadcastRes.transactionHash,
    },
    {
      type: 'ECDSA',
      privateKey: ACCOUNT_PRIVATE_KEY,
    }
  );
}

/**
 * Query unified memories with filters
 */
export async function queryUnifiedMemories(filters: MemoryQueryFilters = {}): Promise<ImmortalMemory[]> {
  try {
    logger.info('🔍 Querying unified memories with filters:', filters);

    // This would query Greenfield for all memories
    // For now, we'll return cached/queued memories as example
    const allMemories = [...pendingUploads, ...uploadQueue];

    // Apply filters
    let filtered = allMemories;

    if (filters.platform) {
      filtered = filtered.filter(m => m.platform === filters.platform);
    }

    if (filters.chain) {
      filtered = filtered.filter(m => m.chain === filters.chain);
    }

    if (filters.type) {
      filtered = filtered.filter(m => m.type === filters.type);
    }

    if (filters.outcome) {
      filtered = filtered.filter(m => m.outcome.status === filters.outcome);
    }

    if (filters.startDate) {
      filtered = filtered.filter(m => m.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      filtered = filtered.filter(m => m.timestamp <= filters.endDate!);
    }

    if (filters.aiModel) {
      filtered = filtered.filter(m => m.ai.model === filters.aiModel);
    }

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 100;
    filtered = filtered.slice(offset, offset + limit);

    return filtered;
  } catch (error) {
    logger.error('Error querying memories:', error);
    return [];
  }
}

/**
 * Get unified memory analytics
 */
export async function getUnifiedAnalytics(): Promise<UnifiedMemoryAnalysis> {
  try {
    const allMemories = await queryUnifiedMemories({ limit: 10000 });

    // Calculate total stats
    const total = {
      trades: allMemories.length,
      volume: allMemories.reduce((sum, m) => sum + m.execution.amount, 0),
      volumeUsd: allMemories.reduce((sum, m) => sum + (m.execution.amountUsd || 0), 0),
      profitLoss: allMemories.reduce((sum, m) => sum + (m.outcome.profitLoss || 0), 0),
      profitLossUsd: allMemories.reduce((sum, m) => sum + (m.outcome.profitLossUsd || 0), 0),
    };

    // Calculate per-platform stats
    const byPlatform = {
      pancakeswap: calculatePlatformStats(allMemories.filter(m => m.platform === 'pancakeswap')),
      polymarket: calculatePlatformStats(allMemories.filter(m => m.platform === 'polymarket')),
      crossChain: calculatePlatformStats(allMemories.filter(m => m.platform === 'cross-chain')),
    };

    // Calculate per-chain stats
    const byChain = {
      bnb: calculateChainStats(allMemories.filter(m => m.chain === 'bnb')),
      opbnb: calculateChainStats(allMemories.filter(m => m.chain === 'opbnb')),
      polygon: calculateChainStats(allMemories.filter(m => m.chain === 'polygon')),
    };

    // Time-based analysis
    const now = Date.now();
    const performance = {
      last24h: calculatePerformanceMetrics(allMemories.filter(m => m.timestamp > now - 24 * 60 * 60 * 1000)),
      last7d: calculatePerformanceMetrics(allMemories.filter(m => m.timestamp > now - 7 * 24 * 60 * 60 * 1000)),
      last30d: calculatePerformanceMetrics(allMemories.filter(m => m.timestamp > now - 30 * 24 * 60 * 60 * 1000)),
      allTime: calculatePerformanceMetrics(allMemories),
    };

    // AI performance
    const aiPerformance = {
      typescriptAgent: calculateAgentPerformance(allMemories.filter(m => m.ai.model === 'typescript-agent')),
      pythonAgent: calculateAgentPerformance(allMemories.filter(m => m.ai.model === 'python-agent')),
      hybrid: calculateAgentPerformance(allMemories.filter(m => m.ai.model === 'hybrid')),
    };

    // Generate insights
    const insights = generateInsights(allMemories);

    return {
      total,
      byPlatform,
      byChain,
      performance,
      aiPerformance,
      insights,
    };
  } catch (error) {
    logger.error('Error calculating analytics:', error);
    throw error;
  }
}

/**
 * Calculate platform statistics
 */
function calculatePlatformStats(memories: ImmortalMemory[]): PlatformStats {
  if (memories.length === 0) {
    return {
      trades: 0,
      volume: 0,
      profitLoss: 0,
      winRate: 0,
      avgTradeSize: 0,
      bestTrade: 0,
      worstTrade: 0,
    };
  }

  const successful = memories.filter(m => m.outcome.status === 'success');
  const profitLosses = memories.map(m => m.outcome.profitLoss || 0);

  return {
    trades: memories.length,
    volume: memories.reduce((sum, m) => sum + m.execution.amount, 0),
    profitLoss: memories.reduce((sum, m) => sum + (m.outcome.profitLoss || 0), 0),
    winRate: (successful.length / memories.length) * 100,
    avgTradeSize: memories.reduce((sum, m) => sum + m.execution.amount, 0) / memories.length,
    bestTrade: Math.max(...profitLosses),
    worstTrade: Math.min(...profitLosses),
  };
}

/**
 * Calculate chain statistics
 */
function calculateChainStats(memories: ImmortalMemory[]): ChainStats {
  return {
    trades: memories.length,
    volume: memories.reduce((sum, m) => sum + m.execution.amount, 0),
    profitLoss: memories.reduce((sum, m) => sum + (m.outcome.profitLoss || 0), 0),
    gasSpent: memories.reduce((sum, m) => sum + m.execution.fees, 0),
    avgGasPrice: memories.length > 0
      ? memories.reduce((sum, m) => sum + m.execution.fees, 0) / memories.length
      : 0,
  };
}

/**
 * Calculate performance metrics
 */
function calculatePerformanceMetrics(memories: ImmortalMemory[]): PerformanceMetrics {
  if (memories.length === 0) {
    return {
      trades: 0,
      winRate: 0,
      profitLoss: 0,
      roi: 0,
      maxDrawdown: 0,
    };
  }

  const successful = memories.filter(m => m.outcome.status === 'success');
  const totalInvested = memories.reduce((sum, m) => sum + m.execution.amount, 0);
  const totalProfitLoss = memories.reduce((sum, m) => sum + (m.outcome.profitLoss || 0), 0);

  return {
    trades: memories.length,
    winRate: (successful.length / memories.length) * 100,
    profitLoss: totalProfitLoss,
    roi: totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0,
    maxDrawdown: calculateMaxDrawdown(memories),
  };
}

/**
 * Calculate maximum drawdown
 */
function calculateMaxDrawdown(memories: ImmortalMemory[]): number {
  if (memories.length === 0) return 0;

  let peak = 0;
  let maxDrawdown = 0;
  let cumulative = 0;

  memories.forEach(m => {
    cumulative += m.outcome.profitLoss || 0;
    if (cumulative > peak) {
      peak = cumulative;
    }
    const drawdown = peak - cumulative;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });

  return maxDrawdown;
}

/**
 * Calculate agent performance
 */
function calculateAgentPerformance(memories: ImmortalMemory[]): AgentPerformance {
  if (memories.length === 0) {
    return {
      totalDecisions: 0,
      successfulTrades: 0,
      avgConfidence: 0,
      avgAccuracy: 0,
      profitLoss: 0,
      bestStrategy: '',
    };
  }

  const successful = memories.filter(m => m.outcome.status === 'success');
  const strategies = memories.map(m => m.ai.strategy);
  const strategyCounts = strategies.reduce((acc, s) => {
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const bestStrategy = Object.keys(strategyCounts).reduce((a, b) =>
    (strategyCounts[a] || 0) > (strategyCounts[b] || 0) ? a : b, ''
  );

  return {
    totalDecisions: memories.length,
    successfulTrades: successful.length,
    avgConfidence: memories.reduce((sum, m) => sum + m.ai.confidence, 0) / memories.length,
    avgAccuracy: (successful.length / memories.length) * 100,
    profitLoss: memories.reduce((sum, m) => sum + (m.outcome.profitLoss || 0), 0),
    bestStrategy,
  };
}

/**
 * Generate insights from memories
 */
function generateInsights(memories: ImmortalMemory[]) {
  if (memories.length === 0) {
    return {
      bestPerformingAsset: 'None',
      worstPerformingAsset: 'None',
      bestStrategy: 'None',
      bestTimeOfDay: 'None',
      recommendations: ['Not enough data to generate insights'],
    };
  }

  // Find best/worst assets
  const assetPerformance = memories.reduce((acc, m) => {
    const key = m.asset.name;
    if (!acc[key]) acc[key] = 0;
    acc[key] += m.outcome.profitLoss || 0;
    return acc;
  }, {} as Record<string, number>);

  const bestAsset = Object.keys(assetPerformance).reduce((a, b) =>
    (assetPerformance[a] || 0) > (assetPerformance[b] || 0) ? a : b, 'None'
  );
  const worstAsset = Object.keys(assetPerformance).reduce((a, b) =>
    (assetPerformance[a] || 0) < (assetPerformance[b] || 0) ? a : b, 'None'
  );

  // Find best strategy
  const strategyPerformance = memories.reduce((acc, m) => {
    const key = m.ai.strategy;
    if (!acc[key]) acc[key] = 0;
    acc[key] += m.outcome.profitLoss || 0;
    return acc;
  }, {} as Record<string, number>);

  const bestStrategy = Object.keys(strategyPerformance).reduce((a, b) =>
    (strategyPerformance[a] || 0) > (strategyPerformance[b] || 0) ? a : b, 'None'
  );

  // Recommendations
  const recommendations = [];
  const winRate = (memories.filter(m => m.outcome.status === 'success').length / memories.length) * 100;

  if (winRate < 50) {
    recommendations.push('Consider adjusting confidence thresholds - current win rate is below 50%');
  }
  if (bestAsset !== 'None') {
    recommendations.push(`Focus on ${bestAsset} - it has the best historical performance`);
  }
  if (bestStrategy !== 'None') {
    recommendations.push(`${bestStrategy} strategy is most profitable - consider using it more`);
  }

  return {
    bestPerformingAsset: bestAsset,
    worstPerformingAsset: worstAsset,
    bestStrategy,
    bestTimeOfDay: 'Analysis pending',
    recommendations,
  };
}

/**
 * Get synchronization status
 */
export function getSyncStatus(): SyncStatus {
  return {
    lastSyncTimestamp: Date.now(),
    pendingUploads: pendingUploads.length,
    failedUploads: 0,
    totalSynced: 0,
    syncInProgress,
    errors: [],
  };
}

/**
 * Force sync all pending uploads
 */
export async function forceSyncAll(): Promise<void> {
  logger.info('🔄 Forcing sync of all pending uploads...');
  await processBatchUpload();
}

/**
 * Convert legacy TradeMemory to ImmortalMemory
 */
export function convertLegacyMemory(legacy: any, platform: 'pancakeswap' | 'polymarket'): ImmortalMemory {
  const chain = platform === 'pancakeswap' ? (CONFIG.IS_OPBNB ? 'opbnb' : 'bnb') : 'polygon';

  return {
    id: legacy.id || `${platform}-${Date.now()}`,
    timestamp: legacy.timestamp || Date.now(),
    platform,
    chain,
    type: 'trade',
    action: legacy.action || 'buy',
    asset: {
      tokenAddress: legacy.tokenAddress,
      tokenSymbol: legacy.tokenSymbol,
      marketId: legacy.marketId,
      marketQuestion: legacy.marketQuestion,
      name: legacy.tokenSymbol || legacy.marketQuestion || 'Unknown',
    },
    execution: {
      entryPrice: legacy.entryPrice || 0,
      exitPrice: legacy.exitPrice,
      amount: legacy.amount || 0,
      amountUsd: legacy.amountUsd,
      fees: legacy.fees || 0,
      slippage: legacy.slippage,
      probability: legacy.probability,
      shares: legacy.shares,
    },
    outcome: {
      status: legacy.outcome || 'pending',
      profitLoss: legacy.profitLoss,
      profitLossPercentage: legacy.profitLossPercentage,
      profitLossUsd: legacy.profitLossUsd,
      resolved: legacy.resolved,
      correctPrediction: legacy.correctPrediction,
      payout: legacy.payout,
    },
    ai: {
      reasoning: legacy.aiReasoning || '',
      confidence: legacy.confidence || 0.5,
      strategy: legacy.strategy || 'default',
      signals: legacy.signals || [],
      model: 'typescript-agent',
    },
    market: {
      volume24h: legacy.marketConditions?.volume24h,
      liquidity: legacy.marketConditions?.liquidity,
      priceChange24h: legacy.marketConditions?.priceChange24h,
      volatility: legacy.volatility,
      buySellPressure: legacy.marketConditions?.buySellPressure,
    },
    learning: {
      lessons: legacy.lessons,
      whatWorked: [],
      whatFailed: [],
      improvements: [],
    },
    storage: {
      greenfieldObjectName: `memory-${legacy.id || Date.now()}.json`,
      greenfieldUrl: legacy.greenfieldUrl,
      txHash: legacy.txHash,
      blockNumber: legacy.blockNumber,
    },
  };
}

export default {
  storeUnifiedMemory,
  processBatchUpload,
  queryUnifiedMemories,
  getUnifiedAnalytics,
  getSyncStatus,
  forceSyncAll,
  convertLegacyMemory,
};
