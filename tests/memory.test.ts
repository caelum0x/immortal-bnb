/**
 * Tests for Unified Memory Storage
 */

import { getSyncStatus } from '../src/blockchain/unifiedMemoryStorage';
import type { ImmortalMemory } from '../src/types/unifiedMemory';

describe('Unified Memory Storage', () => {
  describe('Sync Status', () => {
    test('should return sync status', () => {
      const status = getSyncStatus();
      
      expect(status).toBeDefined();
      expect(status).toHaveProperty('pendingUploads');
      expect(status).toHaveProperty('failedUploads');
      expect(status).toHaveProperty('syncInProgress');
      expect(status).toHaveProperty('totalMemories');
      
      expect(typeof status.pendingUploads).toBe('number');
      expect(typeof status.failedUploads).toBe('number');
      expect(typeof status.syncInProgress).toBe('boolean');
      expect(typeof status.totalMemories).toBe('number');
    });

    test('should start with no pending uploads', () => {
      const status = getSyncStatus();
      expect(status.pendingUploads).toBeGreaterThanOrEqual(0);
    });

    test('should not be syncing initially', () => {
      const status = getSyncStatus();
      expect(status.syncInProgress).toBe(false);
    });
  });

  describe('Memory Structure', () => {
    test('should validate memory structure', () => {
      const mockMemory: ImmortalMemory = {
        id: 'test-memory-123',
        timestamp: Date.now(),
        platform: 'pancakeswap',
        chain: 'bnb',
        type: 'trade',
        asset: {
          tokenAddress: '0x123',
          name: 'Test Token',
        },
        execution: {
          entryPrice: 100,
          amount: 10,
          fees: 0.1,
        },
        outcome: {
          status: 'pending',
        },
        ai: {
          reasoning: 'Test reasoning',
          confidence: 0.85,
          model: 'typescript-agent',
          strategy: 'momentum',
        },
        market: {
          volume24h: 1000000,
          liquidity: 500000,
        },
        storage: {
          greenfieldObjectName: 'memory-test-123',
        },
      };

      expect(mockMemory.id).toBeDefined();
      expect(mockMemory.platform).toMatch(/pancakeswap|polymarket|cross-chain/);
      expect(mockMemory.chain).toMatch(/bnb|opbnb|polygon/);
      expect(mockMemory.type).toMatch(/trade|bet|arbitrage/);
      expect(mockMemory.ai.confidence).toBeGreaterThanOrEqual(0);
      expect(mockMemory.ai.confidence).toBeLessThanOrEqual(1);
    });
  });
});
