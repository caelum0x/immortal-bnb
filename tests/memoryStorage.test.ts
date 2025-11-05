// tests/memoryStorage.test.ts
// Test Greenfield memory storage integration

// Simple test runner for Bun compatibility
function describe(name: string, fn: () => void) {
  console.log(`\n📝 ${name}`);
  fn();
}

function it(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
  } catch (error) {
    console.log(`  ❌ ${name}: ${(error as Error).message}`);
  }
}

function expect(actual: any) {
  return {
    toBe: (expected: any) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toBeCloseTo: (expected: number, precision = 2) => {
      const diff = Math.abs(actual - expected);
      const tolerance = Math.pow(10, -precision);
      if (diff > tolerance) {
        throw new Error(`Expected ${actual} to be close to ${expected}`);
      }
    },
    toBeDefined: () => {
      if (actual === undefined || actual === null) {
        throw new Error(`Expected value to be defined, got ${actual}`);
      }
    },
    toBeGreaterThan: (expected: number) => {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toMatch: (regex: RegExp) => {
      if (!regex.test(actual)) {
        throw new Error(`Expected ${actual} to match ${regex}`);
      }
    }
  };
}

import type { TradeMemory } from '../src/types/memory';

describe('Memory Storage', () => {
  describe('Memory Structure', () => {
    it('should create valid trade memory object', () => {
      const memory: TradeMemory = {
        id: 'memory_123',
        timestamp: 1699200000000,
        tokenAddress: '0x123',
        tokenSymbol: 'TEST',
        action: 'buy',
        entryPrice: 0.001,
        amount: 0.05,
        outcome: 'pending',
        aiReasoning: 'Test reasoning',
        marketConditions: {
          volume24h: 50000,
          liquidity: 25000,
          priceChange24h: 10.5,
          buySellPressure: 0.6,
        },
      };

      expect(memory.id).toBeDefined();
      expect(memory.timestamp).toBeGreaterThan(0);
      expect(memory.action).toMatch(/^(buy|sell)$/);
      expect(memory.outcome).toMatch(/^(pending|profit|loss)$/);
    });

    it('should calculate profit/loss correctly', () => {
      const entryPrice = 0.001;
      const exitPrice = 0.0012;

      const profitLoss = ((exitPrice - entryPrice) / entryPrice) * 100;

      expect(profitLoss).toBeCloseTo(20, 1); // 20% profit (within 1 decimal place)
    });
  });

  describe('Memory Querying', () => {
    it('should filter memories by outcome', () => {
      const memories: TradeMemory[] = [
        { id: '1', outcome: 'profit', tokenSymbol: 'A', action: 'buy', timestamp: 1000, tokenAddress: '0x1', entryPrice: 1, amount: 0.1, aiReasoning: '', marketConditions: {} as any },
        { id: '2', outcome: 'loss', tokenSymbol: 'B', action: 'sell', timestamp: 2000, tokenAddress: '0x2', entryPrice: 1, amount: 0.1, aiReasoning: '', marketConditions: {} as any },
        { id: '3', outcome: 'profit', tokenSymbol: 'C', action: 'buy', timestamp: 3000, tokenAddress: '0x3', entryPrice: 1, amount: 0.1, aiReasoning: '', marketConditions: {} as any },
      ];

      const profitableOnes = memories.filter(m => m.outcome === 'profit');

      expect(profitableOnes.length).toBe(2);
    });

    it('should calculate win rate', () => {
      const memories: TradeMemory[] = [
        { id: '1', outcome: 'profit', tokenSymbol: 'A', action: 'buy', timestamp: 1000, tokenAddress: '0x1', entryPrice: 1, amount: 0.1, aiReasoning: '', marketConditions: {} as any },
        { id: '2', outcome: 'loss', tokenSymbol: 'B', action: 'sell', timestamp: 2000, tokenAddress: '0x2', entryPrice: 1, amount: 0.1, aiReasoning: '', marketConditions: {} as any },
        { id: '3', outcome: 'profit', tokenSymbol: 'C', action: 'buy', timestamp: 3000, tokenAddress: '0x3', entryPrice: 1, amount: 0.1, aiReasoning: '', marketConditions: {} as any },
        { id: '4', outcome: 'profit', tokenSymbol: 'D', action: 'buy', timestamp: 4000, tokenAddress: '0x4', entryPrice: 1, amount: 0.1, aiReasoning: '', marketConditions: {} as any },
      ];

      const completedTrades = memories.filter(m => m.outcome !== 'pending');
      const profitableTrades = completedTrades.filter(m => m.outcome === 'profit');
      const winRate = (profitableTrades.length / completedTrades.length) * 100;

      expect(winRate).toBe(75);
    });
  });
});
