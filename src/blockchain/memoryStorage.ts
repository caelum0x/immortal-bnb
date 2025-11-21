// src/blockchain/memoryStorage.ts
// Handles decentralized storage of trade memories on BNB Greenfield for "immortality".
// Memories are JSON objects stored as files, verifiable on-chain.
// Adapted from official SDK docs: https://docs.bnbchain.org/bnb-greenfield/for-developers/apis-and-sdks/sdk-js/

import { Client } from '@bnb-chain/greenfield-js-sdk'; // Main SDK for Greenfield client
import { VisibilityType, RedundancyType } from '@bnb-chain/greenfield-js-sdk'; // Enums for visibility/redundancy
import Long from 'long'; // For handling large numbers (required by SDK)
import { ethers } from 'ethers'; // For wallet utilities (e.g., signer from private key)
import { logger, logMemory, logError } from '../utils/logger';
import type { TradeMemory, StorageStats } from '../types/memory';
import { CONFIG } from '../config';

// Constants from centralized config
const GREENFIELD_RPC_URL = CONFIG.GREENFIELD_RPC_URL;
const GREENFIELD_CHAIN_ID = CONFIG.GREENFIELD_CHAIN_ID;
const BUCKET_NAME = CONFIG.GREENFIELD_BUCKET_NAME;
const ACCOUNT_PRIVATE_KEY = CONFIG.WALLET_PRIVATE_KEY;

// Check if we have a valid private key for actual wallet operations
const hasValidKey = ACCOUNT_PRIVATE_KEY && 
  ACCOUNT_PRIVATE_KEY !== 'your_test_wallet_private_key_here' &&
  ACCOUNT_PRIVATE_KEY !== 'your_wallet_private_key_here' &&
  ACCOUNT_PRIVATE_KEY.length > 20 &&
  ACCOUNT_PRIVATE_KEY.startsWith('0x');

if (!hasValidKey) {
  logger.warn('⚠️  No valid WALLET_PRIVATE_KEY configured. Memory storage will be disabled.');
  logger.warn('   Add a real private key to .env to enable immortal memory features.');
  if (ACCOUNT_PRIVATE_KEY && ACCOUNT_PRIVATE_KEY.length > 20) {
    logger.info('   Detected potential test wallet - will attempt operations (may fail without funds)');
  }
}

// Defer wallet creation to avoid Bun/ethers v6 compatibility issues during module load
const ACCOUNT_ADDRESS = (() => {
  if (!ACCOUNT_PRIVATE_KEY || ACCOUNT_PRIVATE_KEY.length <= 20 || !ACCOUNT_PRIVATE_KEY.startsWith('0x')) {
    return null;
  }
  
  // Try to create wallet, but don't fail if there's a compatibility issue
  try {
    return new ethers.Wallet(ACCOUNT_PRIVATE_KEY).address;
  } catch (error) {
    // Silently fail - wallet will be created later when needed
    console.warn('⚠️  Could not create wallet during module load (will retry later):', (error as Error).message);
    return null;
  }
})();

// Initialize Greenfield client
let client: Client;

/**
 * Initialize the Greenfield client
 */
async function initClient(): Promise<Client> {
  if (!client) {
    client = Client.create(GREENFIELD_RPC_URL, GREENFIELD_CHAIN_ID);
    logger.info('Greenfield client initialized');
  }
  return client;
}

/**
 * Get account address (lazy initialization)
 */
function getAccountAddress(): string | null {
  if (ACCOUNT_ADDRESS) {
    return ACCOUNT_ADDRESS;
  }
  
  // Try to create wallet if we have a valid key
  const isTestWallet = ACCOUNT_PRIVATE_KEY && ACCOUNT_PRIVATE_KEY.length > 20 && ACCOUNT_PRIVATE_KEY.startsWith('0x');
  if (!isTestWallet) {
    return null;
  }
  
  try {
    const normalizedKey = ACCOUNT_PRIVATE_KEY.startsWith('0x') ? ACCOUNT_PRIVATE_KEY : `0x${ACCOUNT_PRIVATE_KEY}`;
    const wallet = new ethers.Wallet(normalizedKey);
    return wallet.address;
  } catch (error) {
    logger.warn(`⚠️  Could not create wallet for memory storage: ${(error as Error).message}`);
    return null;
  }
}

/**
 * Helper: Create bucket if it doesn't exist (public read for simplicity)
 */
async function ensureBucketExists(): Promise<void> {
  const accountAddress = getAccountAddress();
  
  if (!accountAddress) {
    throw new Error('Cannot create bucket: No valid wallet configured');
  }

  try {
    const greenfieldClient = await initClient();

    // Check if bucket exists
    const headBucketRes = await greenfieldClient.bucket.headBucket(BUCKET_NAME);
    if (headBucketRes) {
      logger.info(`Bucket ${BUCKET_NAME} already exists.`);
      return;
    }
  } catch (error: any) {
    // If bucket doesn't exist, we'll create it below
    logger.info(`Bucket ${BUCKET_NAME} does not exist, creating...`);
  }

  try {
    const greenfieldClient = await initClient();

    // If not exists, create bucket
    const accountAddress = getAccountAddress();
    if (!accountAddress) {
      throw new Error('Cannot create bucket: No valid wallet configured');
    }
    
    const createBucketTx = await greenfieldClient.bucket.createBucket({
      bucketName: BUCKET_NAME,
      creator: accountAddress,
      visibility: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ, // Public for easy access
      chargedReadQuota: Long.fromString('0'), // Free read quota
      primarySpAddress: (await getPrimarySpAddress()), // Get SP from list
      paymentAddress: accountAddress,
    });

    // Simulate gas
    const simulateInfo = await createBucketTx.simulate({ denom: 'BNB' });

    // Broadcast transaction
    const broadcastRes = await createBucketTx.broadcast({
      denom: 'BNB',
      gasLimit: Number(simulateInfo.gasLimit),
      gasPrice: simulateInfo.gasPrice || '5000000000',
      payer: accountAddress,
      granter: '',
      privateKey: ACCOUNT_PRIVATE_KEY,
    });

    if (broadcastRes.code !== 0) {
      throw new Error(`Bucket creation failed: ${broadcastRes.rawLog}`);
    }

    logger.info(`Bucket ${BUCKET_NAME} created successfully. Tx Hash: ${broadcastRes.transactionHash}`);
  } catch (error) {
    logError('ensureBucketExists', error as Error);
    throw error;
  }
}

/**
 * Helper: Get primary Storage Provider (SP) address
 */
async function getPrimarySpAddress(): Promise<string> {
  const greenfieldClient = await initClient();
  const spList = await greenfieldClient.sp.getStorageProviders();
  if (!spList || spList.length === 0) {
    throw new Error('No storage providers available');
  }
  return spList[0]?.operatorAddress || ''; // Use the first SP with null check
}

/**
 * Initialize storage (create bucket if needed)
 */
export async function initializeStorage(): Promise<void> {
  try {
    logger.info('Initializing Greenfield memory storage...');
    await ensureBucketExists();
    logger.info('Greenfield memory storage initialized successfully');
  } catch (error) {
    logError('initializeStorage', error as Error);
    logger.warn('Failed to initialize Greenfield storage');
    logger.warn('   Storage will work in fallback mode (local only)');
    logger.warn('   Fix WALLET_PRIVATE_KEY in .env to enable full storage features');
    // Don't throw - allow app to continue without storage
  }
}

/**
 * Store memory (trade data as JSON) on Greenfield
 */
export async function storeMemory(tradeData: TradeMemory): Promise<string> {
  const accountAddress = getAccountAddress();
  
  if (!accountAddress) {
    logger.warn('🚨 Memory storage disabled - using local fallback (no wallet configured)');
    const fallbackId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    logger.info(`Simulated memory storage: ${tradeData.tokenSymbol} ${tradeData.action}`);
    return fallbackId;
  }

  try {
    await ensureBucketExists(); // Ensure bucket ready

    const greenfieldClient = await initClient();

    // Generate unique ID
    const memoryId = `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const memoryWithId = { ...tradeData, id: memoryId };

    const memoryJson = JSON.stringify(memoryWithId, null, 2);
    const objectName = `trade_memory_${Date.now()}.json`; // Unique name
    const payloadSize = memoryJson.length;

    // Create object transaction
    const createObjectTx = await greenfieldClient.object.createObject({
      bucketName: BUCKET_NAME,
      objectName,
      creator: accountAddress,
      visibility: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
      contentType: 'application/json',
      redundancyType: RedundancyType.REDUNDANCY_EC_TYPE, // Error-correcting for reliability
      payloadSize: Long.fromNumber(payloadSize),
      expectChecksums: [], // Skip Reed-Solomon for small JSON; add if needed for larger data
    });

    // Simulate
    const simulateInfo = await createObjectTx.simulate({ denom: 'BNB' });

    // Broadcast
    const createRes = await createObjectTx.broadcast({
      denom: 'BNB',
      gasLimit: Number(simulateInfo.gasLimit),
      gasPrice: simulateInfo.gasPrice || '5000000000',
      payer: accountAddress,
      granter: '',
      privateKey: ACCOUNT_PRIVATE_KEY,
    });

    if (createRes.code !== 0) {
      throw new Error(`Object creation failed: ${createRes.rawLog}`);
    }

    // Upload the object content
    const uploadRes = await greenfieldClient.object.uploadObject(
      {
        bucketName: BUCKET_NAME,
        objectName,
        body: new File([memoryJson], objectName, { type: 'application/json' }),
        txnHash: createRes.transactionHash,
      },
      {
        type: 'ECDSA', // Private key signing
        privateKey: ACCOUNT_PRIVATE_KEY,
      }
    );

    if (uploadRes.code !== 0) {
      throw new Error(`Upload failed: ${uploadRes.message}`);
    }

    logMemory(memoryId, 'store');
    logger.info(`Memory stored on Greenfield: ${memoryId}`);
    logger.info(`Token: ${tradeData.tokenSymbol}, Action: ${tradeData.action}`);

    return memoryId;
  } catch (error) {
    logError('storeMemory', error as Error);
    throw error;
  }
}

/**
 * Fetch memory by object name (returns parsed JSON)
 */
export async function fetchMemory(objectName: string): Promise<TradeMemory | null> {
  const accountAddress = getAccountAddress();
  
  if (!accountAddress) {
    logger.warn('🚨 Cannot fetch memory - no valid wallet configured');
    return null;
  }

  try {
    const greenfieldClient = await initClient();

    const getRes = await greenfieldClient.object.getObject(
      {
        bucketName: BUCKET_NAME,
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

    // Handle response body - could be Blob or ReadableStream
    let memoryJson: string;
    
    if (getRes.body instanceof Blob) {
      memoryJson = await getRes.body.text();
    } else if (getRes.body) {
      // Assume it's a ReadableStream
      const body = getRes.body as unknown as ReadableStream<Uint8Array>;
      const chunks: Uint8Array[] = [];
      const reader = body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      const memoryBuffer = Buffer.concat(chunks);
      memoryJson = memoryBuffer.toString('utf-8');
    } else {
      throw new Error('No response body received');
    }

    logMemory(objectName, 'fetch');
    return JSON.parse(memoryJson);
  } catch (error) {
    logError('fetchMemory', error as Error);
    logger.warn(`Memory not found: ${objectName}`);
    return null;
  }
}

/**
 * List all stored memories in bucket
 */
export async function fetchAllMemories(): Promise<string[]> {
  const accountAddress = getAccountAddress();
  
  if (!accountAddress) {
    logger.warn('🚨 Cannot fetch memories - no valid wallet configured');
    return [];
  }

  try {
    const greenfieldClient = await initClient();

    const listRes = await greenfieldClient.object.listObjects({
      bucketName: BUCKET_NAME,
      endpoint: GREENFIELD_RPC_URL,
    });

    if (listRes.statusCode !== 200) {
      throw new Error(`Failed to list objects: ${listRes.statusCode}`);
    }

    // Extract object names from response
    const objectNames = listRes.body?.GfSpListObjectsByBucketNameResponse?.Objects?.map(
      (obj: any) => obj.ObjectInfo?.ObjectName
    ) || [];

    return objectNames.filter((name: string) => name && name.endsWith('.json'));
  } catch (error: any) {
    logError('fetchAllMemories', error as Error);
    return [];
  }
}

/**
 * Update an existing memory (e.g., when trade completes)
 * Note: Greenfield doesn't support in-place updates, so we delete and re-create
 */
export async function updateMemory(
  objectName: string,
  updates: Partial<TradeMemory>
): Promise<boolean> {
  try {
    const existing = await fetchMemory(objectName);

    if (!existing) {
      logger.warn(`Cannot update non-existent memory: ${objectName}`);
      return false;
    }

    const updated = { ...existing, ...updates };

    // Delete old object
    await deleteMemory(objectName);

    // Store updated version
    await storeMemory(updated);

    logger.info(`Memory updated: ${objectName}`);
    return true;
  } catch (error) {
    logError('updateMemory', error as Error);
    return false;
  }
}

/**
 * Delete a memory (optional, for cleanup)
 */
export async function deleteMemory(objectName: string): Promise<boolean> {
  const accountAddress = getAccountAddress();
  
  if (!accountAddress) {
    logger.warn('🚨 Cannot delete memory - no valid wallet configured');
    return false;
  }

  try {
    const greenfieldClient = await initClient();

    const deleteTx = await greenfieldClient.object.deleteObject({
      bucketName: BUCKET_NAME,
      objectName,
      operator: accountAddress,
    });

    const simulateInfo = await deleteTx.simulate({ denom: 'BNB' });

    const deleteRes = await deleteTx.broadcast({
      denom: 'BNB',
      gasLimit: Number(simulateInfo.gasLimit),
      gasPrice: simulateInfo.gasPrice || '5000000000',
      payer: accountAddress,
      granter: '',
      privateKey: ACCOUNT_PRIVATE_KEY,
    });

    if (deleteRes.code !== 0) {
      throw new Error(`Delete failed: ${deleteRes.rawLog}`);
    }

    logger.info(`Memory ${objectName} deleted. Tx Hash: ${deleteRes.transactionHash}`);
    return true;
  } catch (error) {
    logError('deleteMemory', error as Error);
    return false;
  }
}

/**
 * Query memories by criteria (for advanced learning)
 */
export async function queryMemories(filters: {
  tokenAddress?: string;
  outcome?: 'profit' | 'loss' | 'pending';
  minProfitLoss?: number;
  fromTimestamp?: number;
  toTimestamp?: number;
  limit?: number;
}): Promise<TradeMemory[]> {
  try {
    const allObjectNames = await fetchAllMemories();
    const memories: TradeMemory[] = [];

    for (const objectName of allObjectNames) {
      const memory = await fetchMemory(objectName);

      if (!memory) continue;

      // Apply filters
      if (filters.tokenAddress && memory.tokenAddress !== filters.tokenAddress) {
        continue;
      }

      if (filters.outcome && memory.outcome !== filters.outcome) {
        continue;
      }

      if (
        filters.minProfitLoss !== undefined &&
        (memory.profitLoss || 0) < filters.minProfitLoss
      ) {
        continue;
      }

      if (filters.fromTimestamp && memory.timestamp < filters.fromTimestamp) {
        continue;
      }

      if (filters.toTimestamp && memory.timestamp > filters.toTimestamp) {
        continue;
      }

      memories.push(memory);
    }

    // Sort by timestamp (newest first)
    memories.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit
    if (filters.limit) {
      return memories.slice(0, filters.limit);
    }

    return memories;
  } catch (error) {
    logError('queryMemories', error as Error);
    return [];
  }
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<StorageStats> {
  const allObjectNames = await fetchAllMemories();
  const memories = await Promise.all(allObjectNames.map(name => fetchMemory(name)));

  const validMemories = memories.filter(m => m !== null) as TradeMemory[];

  return {
    totalMemories: validMemories.length,
    oldestMemory:
      validMemories.length > 0
        ? Math.min(...validMemories.map(m => m.timestamp))
        : null,
    newestMemory:
      validMemories.length > 0
        ? Math.max(...validMemories.map(m => m.timestamp))
        : null,
    totalSize: new Blob([JSON.stringify(validMemories)]).size,
  };
}

export default {
  initializeStorage,
  storeMemory,
  fetchMemory,
  fetchAllMemories,
  updateMemory,
  deleteMemory,
  queryMemories,
  getStorageStats,
};
