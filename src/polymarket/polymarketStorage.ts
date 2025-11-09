/**
 * Polymarket Bet Storage on BNB Greenfield
 *
 * Stores prediction market bets as immortal data on Greenfield:
 * - Market analysis and AI predictions
 * - Bet placements and outcomes
 * - Position tracking and P&L
 * - Historical performance data
 */

import { Client } from '@bnb-chain/greenfield-js-sdk';
import { VisibilityType, RedundancyType } from '@bnb-chain/greenfield-js-sdk';
import Long from 'long';
import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { CONFIG } from '../config';

// Constants
const GREENFIELD_RPC_URL = CONFIG.GREENFIELD_RPC_URL;
const GREENFIELD_CHAIN_ID = CONFIG.GREENFIELD_CHAIN_ID;
const POLYMARKET_BUCKET_NAME = `${CONFIG.GREENFIELD_BUCKET_NAME}-polymarket`;
const ACCOUNT_PRIVATE_KEY = CONFIG.WALLET_PRIVATE_KEY;

// Check if we have a valid private key
const hasValidKey = ACCOUNT_PRIVATE_KEY &&
  ACCOUNT_PRIVATE_KEY !== 'your_test_wallet_private_key_here' &&
  ACCOUNT_PRIVATE_KEY !== 'your_wallet_private_key_here' &&
  ACCOUNT_PRIVATE_KEY.length > 20 &&
  ACCOUNT_PRIVATE_KEY.startsWith('0x');

if (!hasValidKey) {
  logger.warn('⚠️  No valid WALLET_PRIVATE_KEY configured. Polymarket storage will be disabled.');
}

const ACCOUNT_ADDRESS = ACCOUNT_PRIVATE_KEY && ACCOUNT_PRIVATE_KEY.length > 20 && ACCOUNT_PRIVATE_KEY.startsWith('0x')
  ? new ethers.Wallet(ACCOUNT_PRIVATE_KEY).address
  : null;

// Greenfield client
let client: Client;

/**
 * Polymarket Bet Data Structure
 */
export interface PolymarketBet {
  id: string;
  timestamp: number;
  marketId: string;
  marketQuestion: string;
  marketDescription?: string;
  outcome: string; // Which outcome (YES/NO, or specific option)
  side: 'BUY' | 'SELL';
  size: number; // Amount in USDC
  price: number; // Price paid (0-1)

  // AI Analysis
  aiAnalysis?: {
    recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
    confidence: number;
    reasoning: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    suggestedPrice: number;
    suggestedSize: number;
  };

  // Market conditions at time of bet
  marketConditions: {
    volume24h: number;
    liquidity: number;
    midPrice: number;
    spread: number;
    timeToExpiry: number; // seconds
  };

  // Position tracking
  entryPrice: number;
  currentPrice?: number;
  exitPrice?: number;

  // Results
  status: 'OPEN' | 'CLOSED' | 'EXPIRED' | 'CANCELLED';
  outcome_result?: 'WIN' | 'LOSS' | 'PENDING';
  profitLoss?: number; // In USDC
  profitLossPercent?: number;

  // Blockchain data
  txHash?: string;
  orderId?: string;

  // Metadata
  network: 'polygon' | 'polygon-mumbai';
  walletAddress: string;
}

/**
 * Initialize Greenfield client
 */
async function initClient(): Promise<Client> {
  if (!client) {
    client = Client.create(GREENFIELD_RPC_URL, GREENFIELD_CHAIN_ID);
    logger.info('🔮 Polymarket Greenfield client initialized');
  }
  return client;
}

/**
 * Get primary Storage Provider address
 */
async function getPrimarySpAddress(): Promise<string> {
  const greenfieldClient = await initClient();
  const spList = await greenfieldClient.sp.getStorageProviders();
  if (!spList || spList.length === 0) {
    throw new Error('No storage providers available');
  }
  return spList[0]?.operatorAddress || '';
}

/**
 * Ensure Polymarket bucket exists
 */
async function ensureBucketExists(): Promise<void> {
  if (!hasValidKey || !ACCOUNT_ADDRESS) {
    throw new Error('Cannot create bucket: No valid wallet configured');
  }

  try {
    const greenfieldClient = await initClient();

    // Check if bucket exists
    const headBucketRes = await greenfieldClient.bucket.headBucket(POLYMARKET_BUCKET_NAME);
    if (headBucketRes) {
      logger.info(`🔮 Polymarket bucket ${POLYMARKET_BUCKET_NAME} already exists.`);
      return;
    }
  } catch (error: any) {
    logger.info(`🔮 Polymarket bucket ${POLYMARKET_BUCKET_NAME} does not exist, creating...`);
  }

  try {
    const greenfieldClient = await initClient();

    // Create bucket for Polymarket data
    const createBucketTx = await greenfieldClient.bucket.createBucket({
      bucketName: POLYMARKET_BUCKET_NAME,
      creator: ACCOUNT_ADDRESS,
      visibility: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
      chargedReadQuota: Long.fromString('0'),
      primarySpAddress: (await getPrimarySpAddress()),
      paymentAddress: ACCOUNT_ADDRESS,
    });

    // Simulate gas
    const simulateInfo = await createBucketTx.simulate({ denom: 'BNB' });

    // Broadcast transaction
    const broadcastRes = await createBucketTx.broadcast({
      denom: 'BNB',
      gasLimit: Number(simulateInfo.gasLimit),
      gasPrice: simulateInfo.gasPrice || '5000000000',
      payer: ACCOUNT_ADDRESS,
      granter: '',
      privateKey: ACCOUNT_PRIVATE_KEY,
    });

    if (broadcastRes.code !== 0) {
      throw new Error(`Bucket creation failed: ${broadcastRes.rawLog}`);
    }

    logger.info(`🔮 Polymarket bucket ${POLYMARKET_BUCKET_NAME} created successfully. Tx Hash: ${broadcastRes.transactionHash}`);
  } catch (error) {
    logger.error('Failed to create Polymarket bucket:', error);
    throw error;
  }
}

/**
 * Initialize Polymarket storage
 */
export async function initializePolymarketStorage(): Promise<void> {
  try {
    logger.info('🔮 Initializing Polymarket Greenfield storage...');
    await ensureBucketExists();
    logger.info('✅ Polymarket Greenfield storage initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Polymarket storage:', error);
    logger.warn('Polymarket bets will not be saved to Greenfield');
    // Don't throw - allow app to continue without Greenfield storage
  }
}

/**
 * Store a Polymarket bet on Greenfield
 */
export async function storeBet(betData: PolymarketBet): Promise<string> {
  if (!hasValidKey || !ACCOUNT_ADDRESS) {
    logger.warn('🚨 Polymarket storage disabled - using local fallback (no wallet configured)');
    const fallbackId = `local_bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    logger.info(`Simulated bet storage: ${betData.marketQuestion}`);
    return fallbackId;
  }

  try {
    await ensureBucketExists();
    const greenfieldClient = await initClient();

    // Generate unique ID if not provided
    if (!betData.id) {
      betData.id = `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    const betJson = JSON.stringify(betData, null, 2);
    const objectName = `polymarket_bet_${betData.id}.json`;
    const payloadSize = betJson.length;

    // Create object transaction
    const createObjectTx = await greenfieldClient.object.createObject({
      bucketName: POLYMARKET_BUCKET_NAME,
      objectName,
      creator: ACCOUNT_ADDRESS,
      visibility: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
      contentType: 'application/json',
      redundancyType: RedundancyType.REDUNDANCY_EC_TYPE,
      payloadSize: Long.fromNumber(payloadSize),
      expectChecksums: [],
    });

    // Simulate
    const simulateInfo = await createObjectTx.simulate({ denom: 'BNB' });

    // Broadcast
    const createRes = await createObjectTx.broadcast({
      denom: 'BNB',
      gasLimit: Number(simulateInfo.gasLimit),
      gasPrice: simulateInfo.gasPrice || '5000000000',
      payer: ACCOUNT_ADDRESS,
      granter: '',
      privateKey: ACCOUNT_PRIVATE_KEY,
    });

    if (createRes.code !== 0) {
      throw new Error(`Object creation failed: ${createRes.rawLog}`);
    }

    // Upload the object content
    const uploadRes = await greenfieldClient.object.uploadObject(
      {
        bucketName: POLYMARKET_BUCKET_NAME,
        objectName,
        body: new File([betJson], objectName, { type: 'application/json' }),
        txnHash: createRes.transactionHash,
      },
      {
        type: 'ECDSA',
        privateKey: ACCOUNT_PRIVATE_KEY,
      }
    );

    if (uploadRes.code !== 0) {
      throw new Error(`Upload failed: ${uploadRes.message}`);
    }

    logger.info(`🔮 Bet stored on Greenfield: ${betData.id}`);
    logger.info(`   Market: ${betData.marketQuestion}`);
    logger.info(`   ${betData.side} ${betData.size} USDC @ ${(betData.price * 100).toFixed(1)}%`);

    return betData.id;
  } catch (error) {
    logger.error('Failed to store bet on Greenfield:', error);
    throw error;
  }
}

/**
 * Fetch a bet by ID
 */
export async function fetchBet(betId: string): Promise<PolymarketBet | null> {
  if (!hasValidKey || !ACCOUNT_ADDRESS) {
    logger.warn('🚨 Cannot fetch bet - no valid wallet configured');
    return null;
  }

  try {
    const greenfieldClient = await initClient();
    const objectName = `polymarket_bet_${betId}.json`;

    const getRes = await greenfieldClient.object.getObject(
      {
        bucketName: POLYMARKET_BUCKET_NAME,
        objectName,
      },
      {
        type: 'ECDSA',
        privateKey: ACCOUNT_PRIVATE_KEY,
      }
    );

    if (getRes.code !== 0) {
      throw new Error(`Fetch failed: ${getRes.message}`);
    }

    // Handle response body
    let betJson: string;

    if (getRes.body instanceof Blob) {
      betJson = await getRes.body.text();
    } else if (getRes.body) {
      const body = getRes.body as unknown as ReadableStream<Uint8Array>;
      const chunks: Uint8Array[] = [];
      const reader = body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      const betBuffer = Buffer.concat(chunks);
      betJson = betBuffer.toString('utf-8');
    } else {
      throw new Error('No response body received');
    }

    return JSON.parse(betJson);
  } catch (error) {
    logger.warn(`Bet not found: ${betId}`);
    return null;
  }
}

/**
 * List all stored bets
 */
export async function fetchAllBets(): Promise<string[]> {
  if (!hasValidKey || !ACCOUNT_ADDRESS) {
    logger.warn('🚨 Cannot fetch bets - no valid wallet configured');
    return [];
  }

  try {
    const greenfieldClient = await initClient();

    const listRes = await greenfieldClient.object.listObjects({
      bucketName: POLYMARKET_BUCKET_NAME,
      endpoint: GREENFIELD_RPC_URL,
    });

    if (listRes.statusCode !== 200) {
      throw new Error(`Failed to list objects: ${listRes.statusCode}`);
    }

    const objectNames = listRes.body?.GfSpListObjectsByBucketNameResponse?.Objects?.map(
      (obj: any) => obj.ObjectInfo?.ObjectName
    ) || [];

    // Extract bet IDs from filenames
    return objectNames
      .filter((name: string) => name && name.startsWith('polymarket_bet_') && name.endsWith('.json'))
      .map((name: string) => name.replace('polymarket_bet_', '').replace('.json', ''));
  } catch (error: any) {
    logger.error('Failed to fetch all bets:', error);
    return [];
  }
}

/**
 * Update a bet (e.g., when position closes)
 */
export async function updateBet(
  betId: string,
  updates: Partial<PolymarketBet>
): Promise<boolean> {
  try {
    const existing = await fetchBet(betId);

    if (!existing) {
      logger.warn(`Cannot update non-existent bet: ${betId}`);
      return false;
    }

    const updated = { ...existing, ...updates };

    // Delete old object
    await deleteBet(betId);

    // Store updated version
    await storeBet(updated);

    logger.info(`🔮 Bet updated: ${betId}`);
    return true;
  } catch (error) {
    logger.error('Failed to update bet:', error);
    return false;
  }
}

/**
 * Delete a bet
 */
export async function deleteBet(betId: string): Promise<boolean> {
  if (!hasValidKey || !ACCOUNT_ADDRESS) {
    logger.warn('🚨 Cannot delete bet - no valid wallet configured');
    return false;
  }

  try {
    const greenfieldClient = await initClient();
    const objectName = `polymarket_bet_${betId}.json`;

    const deleteTx = await greenfieldClient.object.deleteObject({
      bucketName: POLYMARKET_BUCKET_NAME,
      objectName,
      operator: ACCOUNT_ADDRESS,
    });

    const simulateInfo = await deleteTx.simulate({ denom: 'BNB' });

    const deleteRes = await deleteTx.broadcast({
      denom: 'BNB',
      gasLimit: Number(simulateInfo.gasLimit),
      gasPrice: simulateInfo.gasPrice || '5000000000',
      payer: ACCOUNT_ADDRESS,
      granter: '',
      privateKey: ACCOUNT_PRIVATE_KEY,
    });

    if (deleteRes.code !== 0) {
      throw new Error(`Delete failed: ${deleteRes.rawLog}`);
    }

    logger.info(`🔮 Bet ${betId} deleted. Tx Hash: ${deleteRes.transactionHash}`);
    return true;
  } catch (error) {
    logger.error('Failed to delete bet:', error);
    return false;
  }
}

/**
 * Query bets by criteria
 */
export async function queryBets(filters: {
  marketId?: string;
  status?: 'OPEN' | 'CLOSED' | 'EXPIRED' | 'CANCELLED';
  outcome_result?: 'WIN' | 'LOSS' | 'PENDING';
  minProfitLoss?: number;
  fromTimestamp?: number;
  toTimestamp?: number;
  limit?: number;
}): Promise<PolymarketBet[]> {
  try {
    const allBetIds = await fetchAllBets();
    const bets: PolymarketBet[] = [];

    for (const betId of allBetIds) {
      const bet = await fetchBet(betId);

      if (!bet) continue;

      // Apply filters
      if (filters.marketId && bet.marketId !== filters.marketId) {
        continue;
      }

      if (filters.status && bet.status !== filters.status) {
        continue;
      }

      if (filters.outcome_result && bet.outcome_result !== filters.outcome_result) {
        continue;
      }

      if (
        filters.minProfitLoss !== undefined &&
        (bet.profitLoss || 0) < filters.minProfitLoss
      ) {
        continue;
      }

      if (filters.fromTimestamp && bet.timestamp < filters.fromTimestamp) {
        continue;
      }

      if (filters.toTimestamp && bet.timestamp > filters.toTimestamp) {
        continue;
      }

      bets.push(bet);
    }

    // Sort by timestamp (newest first)
    bets.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit
    if (filters.limit) {
      return bets.slice(0, filters.limit);
    }

    return bets;
  } catch (error) {
    logger.error('Failed to query bets:', error);
    return [];
  }
}

/**
 * Get betting statistics
 */
export async function getBettingStats(): Promise<{
  totalBets: number;
  openBets: number;
  closedBets: number;
  winRate: number;
  totalProfit: number;
  avgProfitPerBet: number;
  bestBet?: PolymarketBet;
  worstBet?: PolymarketBet;
  totalVolume: number;
}> {
  try {
    const allBetIds = await fetchAllBets();
    const bets = await Promise.all(allBetIds.map(id => fetchBet(id)));
    const validBets = bets.filter(b => b !== null) as PolymarketBet[];

    const openBets = validBets.filter(b => b.status === 'OPEN');
    const closedBets = validBets.filter(b => b.status === 'CLOSED');
    const wonBets = closedBets.filter(b => b.outcome_result === 'WIN');

    const totalProfit = closedBets.reduce((sum, b) => sum + (b.profitLoss || 0), 0);
    const totalVolume = validBets.reduce((sum, b) => sum + b.size, 0);
    const winRate = closedBets.length > 0 ? (wonBets.length / closedBets.length) * 100 : 0;
    const avgProfitPerBet = closedBets.length > 0 ? totalProfit / closedBets.length : 0;

    const bestBet = closedBets.reduce((best, b) =>
      (b.profitLoss || 0) > (best?.profitLoss || 0) ? b : best
    , closedBets[0]);

    const worstBet = closedBets.reduce((worst, b) =>
      (b.profitLoss || 0) < (worst?.profitLoss || 0) ? b : worst
    , closedBets[0]);

    return {
      totalBets: validBets.length,
      openBets: openBets.length,
      closedBets: closedBets.length,
      winRate,
      totalProfit,
      avgProfitPerBet,
      bestBet,
      worstBet,
      totalVolume,
    };
  } catch (error) {
    logger.error('Failed to get betting stats:', error);
    return {
      totalBets: 0,
      openBets: 0,
      closedBets: 0,
      winRate: 0,
      totalProfit: 0,
      avgProfitPerBet: 0,
      totalVolume: 0,
    };
  }
}

export default {
  initializePolymarketStorage,
  storeBet,
  fetchBet,
  fetchAllBets,
  updateBet,
  deleteBet,
  queryBets,
  getBettingStats,
};
