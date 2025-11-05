import { logger, logMemory, logError } from '../utils/logger';
import { CONFIG } from '../config';
import { TradeMemory } from '../agent/learningLoop';
import { withRetry } from '../utils/errorHandler';

/**
 * NOTE: This is a simplified implementation of BNB Greenfield storage.
 * For production, you'll need to:
 * 1. Install: @bnb-chain/greenfield-js-sdk
 * 2. Set up Greenfield account and bucket
 * 3. Configure proper authentication
 *
 * For now, we'll use local file storage as fallback for development
 */

interface StorageMetadata {
  id: string;
  timestamp: number;
  type: 'trade_memory';
  version: string;
}

// In-memory store for development (replace with Greenfield in production)
const memoryStore = new Map<string, TradeMemory>();
let memoryIndex: string[] = [];

/**
 * Initialize storage (create bucket if needed)
 */
export async function initializeStorage(): Promise<void> {
  try {
    logger.info('Initializing memory storage...');

    // TODO: Initialize Greenfield client
    // const client = await Client.create(CONFIG.GREENFIELD_RPC, String(CHAIN_ID));
    // Check if bucket exists, create if not

    logger.info('Memory storage initialized (using local fallback for development)');
  } catch (error) {
    logError('initializeStorage', error as Error);
    logger.warn('Falling back to local memory storage');
  }
}

/**
 * Store a trade memory on Greenfield (or fallback)
 */
export async function storeMemory(memory: TradeMemory): Promise<string> {
  try {
    const memoryId = `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const memoryWithId = { ...memory, id: memoryId };

    // Serialize memory
    const memoryJson = JSON.stringify(memoryWithId, null, 2);

    // TODO: Upload to Greenfield
    /*
    const uploadResult = await greenfieldClient.object.uploadObject({
      bucketName: CONFIG.GREENFIELD_BUCKET_NAME,
      objectName: `${memoryId}.json`,
      body: memoryJson,
      txnOption: {
        gasLimit: 300000,
        gasPrice: '5000000000',
      },
    });
    */

    // Fallback: Store locally
    memoryStore.set(memoryId, memoryWithId);
    memoryIndex.push(memoryId);

    // Keep only last 100 memories in local storage
    if (memoryIndex.length > 100) {
      const toRemove = memoryIndex.shift();
      if (toRemove) {
        memoryStore.delete(toRemove);
      }
    }

    logMemory(memoryId, 'store');
    logger.info(`Memory stored: ${memoryId} (${memory.tokenSymbol} ${memory.action})`);

    return memoryId;
  } catch (error) {
    logError('storeMemory', error as Error);
    throw error;
  }
}

/**
 * Fetch a specific memory by ID
 */
export async function fetchMemory(memoryId: string): Promise<TradeMemory | null> {
  try {
    // TODO: Fetch from Greenfield
    /*
    const downloadResult = await greenfieldClient.object.getObject({
      bucketName: CONFIG.GREENFIELD_BUCKET_NAME,
      objectName: `${memoryId}.json`,
    });
    const memoryJson = await downloadResult.body.text();
    return JSON.parse(memoryJson);
    */

    // Fallback: Get from local store
    const memory = memoryStore.get(memoryId);

    if (memory) {
      logMemory(memoryId, 'fetch');
      return memory;
    }

    logger.warn(`Memory not found: ${memoryId}`);
    return null;
  } catch (error) {
    logError('fetchMemory', error as Error);
    return null;
  }
}

/**
 * Fetch all memory IDs (for indexing)
 */
export async function fetchAllMemories(): Promise<string[]> {
  try {
    // TODO: List objects in Greenfield bucket
    /*
    const listResult = await greenfieldClient.object.listObjects({
      bucketName: CONFIG.GREENFIELD_BUCKET_NAME,
    });
    return listResult.objects.map(obj => obj.objectName.replace('.json', ''));
    */

    // Fallback: Return local index
    return [...memoryIndex];
  } catch (error) {
    logError('fetchAllMemories', error as Error);
    return [];
  }
}

/**
 * Update an existing memory (e.g., when trade completes)
 */
export async function updateMemory(
  memoryId: string,
  updates: Partial<TradeMemory>
): Promise<boolean> {
  try {
    const existing = await fetchMemory(memoryId);

    if (!existing) {
      logger.warn(`Cannot update non-existent memory: ${memoryId}`);
      return false;
    }

    const updated = { ...existing, ...updates };

    // TODO: Update on Greenfield (delete old, upload new)
    // For now, just update local store
    memoryStore.set(memoryId, updated);

    logger.info(`Memory updated: ${memoryId}`);

    return true;
  } catch (error) {
    logError('updateMemory', error as Error);
    return false;
  }
}

/**
 * Delete a memory (cleanup)
 */
export async function deleteMemory(memoryId: string): Promise<boolean> {
  try {
    // TODO: Delete from Greenfield
    /*
    await greenfieldClient.object.deleteObject({
      bucketName: CONFIG.GREENFIELD_BUCKET_NAME,
      objectName: `${memoryId}.json`,
    });
    */

    // Fallback: Delete from local store
    memoryStore.delete(memoryId);
    memoryIndex = memoryIndex.filter(id => id !== memoryId);

    logger.info(`Memory deleted: ${memoryId}`);

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
    const allIds = await fetchAllMemories();
    const memories: TradeMemory[] = [];

    for (const id of allIds) {
      const memory = await fetchMemory(id);

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
export async function getStorageStats(): Promise<{
  totalMemories: number;
  oldestMemory: number | null;
  newestMemory: number | null;
  totalSize: number;
}> {
  const allIds = await fetchAllMemories();
  const memories = await Promise.all(allIds.map(id => fetchMemory(id)));

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
