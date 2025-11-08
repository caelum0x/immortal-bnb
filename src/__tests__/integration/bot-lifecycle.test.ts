/**
 * Bot Lifecycle Integration Tests
 * Tests the complete bot lifecycle: start, status, logs, stop
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { BotState } from '../../bot-state';

describe('Bot Lifecycle Integration', () => {
  // Clean up after each test
  afterEach(() => {
    if (BotState.isRunning()) {
      BotState.stop();
    }
  });

  describe('Bot State Management', () => {
    test('should start bot with valid configuration', () => {
      expect(BotState.isRunning()).toBe(false);

      BotState.start({
        tokens: [],
        riskLevel: 5,
        maxTradeAmount: 1.0,
        stopLoss: 10,
        interval: 300000,
        network: 'testnet',
      });

      expect(BotState.isRunning()).toBe(true);

      const status = BotState.getStatus();
      expect(status.running).toBe(true);
      expect(status.riskLevel).toBe(5);
      expect(status.config?.network).toBe('testnet');
    });

    test('should prevent double start', () => {
      BotState.start({
        tokens: [],
        riskLevel: 5,
        maxTradeAmount: 1.0,
        stopLoss: 10,
        interval: 300000,
        network: 'testnet',
      });

      expect(() => {
        BotState.start({
          tokens: [],
          riskLevel: 3,
          maxTradeAmount: 0.5,
          stopLoss: 5,
          interval: 300000,
          network: 'testnet',
        });
      }).toThrow('Bot is already running');
    });

    test('should stop running bot', () => {
      BotState.start({
        tokens: [],
        riskLevel: 5,
        maxTradeAmount: 1.0,
        stopLoss: 10,
        interval: 300000,
        network: 'testnet',
      });

      expect(BotState.isRunning()).toBe(true);

      BotState.stop();

      expect(BotState.isRunning()).toBe(false);
    });

    test('should throw error when stopping non-running bot', () => {
      expect(BotState.isRunning()).toBe(false);

      expect(() => {
        BotState.stop();
      }).toThrow('Bot is not running');
    });

    test('should accept token watchlist', () => {
      const tokens = [
        '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
        '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
      ];

      BotState.start({
        tokens,
        riskLevel: 7,
        maxTradeAmount: 2.0,
        stopLoss: 15,
        interval: 600000,
        network: 'testnet',
      });

      const status = BotState.getStatus();
      expect(status.watchlist).toEqual(tokens);
      expect(status.riskLevel).toBe(7);
    });

    test('should handle different risk levels', () => {
      for (let risk = 1; risk <= 10; risk++) {
        if (BotState.isRunning()) {
          BotState.stop();
        }

        BotState.start({
          tokens: [],
          riskLevel: risk,
          maxTradeAmount: 1.0,
          stopLoss: 10,
          interval: 300000,
          network: 'testnet',
        });

        const status = BotState.getStatus();
        expect(status.riskLevel).toBe(risk);

        BotState.stop();
      }
    });
  });

  describe('Trade Logging', () => {
    beforeEach(() => {
      if (BotState.isRunning()) {
        BotState.stop();
      }
    });

    test('should add trade log', () => {
      const tradeLog = {
        id: 'test-trade-1',
        timestamp: Date.now(),
        token: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
        tokenSymbol: 'CAKE',
        action: 'buy' as const,
        amount: 0.5,
        price: 2.5,
        status: 'success' as const,
        txHash: '0xabc123',
      };

      BotState.addTradeLog(tradeLog);

      const logs = BotState.getTradeLogs(10);
      expect(logs.length).toBe(1);
      expect(logs[0].id).toBe('test-trade-1');
      expect(logs[0].tokenSymbol).toBe('CAKE');
    });

    test('should limit trade logs to specified count', () => {
      // Add 150 trade logs
      for (let i = 0; i < 150; i++) {
        BotState.addTradeLog({
          id: `trade-${i}`,
          timestamp: Date.now(),
          token: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
          tokenSymbol: 'CAKE',
          action: 'buy',
          amount: 0.1,
          price: 2.5,
          status: 'success',
          txHash: `0x${i}`,
        });
      }

      const logs = BotState.getTradeLogs(50);
      expect(logs.length).toBe(50);
    });

    test('should update statistics on successful trade', () => {
      BotState.addTradeLog({
        id: 'trade-win',
        timestamp: Date.now(),
        token: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
        tokenSymbol: 'CAKE',
        action: 'sell',
        amount: 0.5,
        price: 2.5,
        status: 'success',
        txHash: '0xabc',
        profitLoss: 0.1, // Profit
      });

      const stats = BotState.getStats();
      expect(stats.totalTrades).toBe(1);
      expect(stats.wins).toBe(1);
      expect(stats.losses).toBe(0);
      expect(stats.winRate).toBe(100);
      expect(stats.totalPL).toBe(0.1);
    });

    test('should update statistics on losing trade', () => {
      BotState.addTradeLog({
        id: 'trade-loss',
        timestamp: Date.now(),
        token: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
        tokenSymbol: 'CAKE',
        action: 'sell',
        amount: 0.5,
        price: 2.5,
        status: 'success',
        txHash: '0xabc',
        profitLoss: -0.05, // Loss
      });

      const stats = BotState.getStats();
      expect(stats.totalTrades).toBe(1);
      expect(stats.wins).toBe(0);
      expect(stats.losses).toBe(1);
      expect(stats.winRate).toBe(0);
      expect(stats.totalPL).toBe(-0.05);
    });

    test('should calculate correct win rate', () => {
      // Add 3 wins
      for (let i = 0; i < 3; i++) {
        BotState.addTradeLog({
          id: `trade-win-${i}`,
          timestamp: Date.now(),
          token: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
          tokenSymbol: 'CAKE',
          action: 'sell',
          amount: 0.5,
          price: 2.5,
          status: 'success',
          txHash: `0x${i}`,
          profitLoss: 0.1,
        });
      }

      // Add 1 loss
      BotState.addTradeLog({
        id: 'trade-loss',
        timestamp: Date.now(),
        token: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
        tokenSymbol: 'CAKE',
        action: 'sell',
        amount: 0.5,
        price: 2.5,
        status: 'success',
        txHash: '0xloss',
        profitLoss: -0.05,
      });

      const stats = BotState.getStats();
      expect(stats.totalTrades).toBe(4);
      expect(stats.wins).toBe(3);
      expect(stats.losses).toBe(1);
      expect(stats.winRate).toBe(75); // 3/4 = 75%
    });
  });

  describe('Configuration Validation', () => {
    test('should accept all valid network types', () => {
      BotState.start({
        tokens: [],
        riskLevel: 5,
        maxTradeAmount: 1.0,
        stopLoss: 10,
        interval: 300000,
        network: 'testnet',
      });
      expect(BotState.getConfig()?.network).toBe('testnet');
      BotState.stop();

      BotState.start({
        tokens: [],
        riskLevel: 5,
        maxTradeAmount: 1.0,
        stopLoss: 10,
        interval: 300000,
        network: 'mainnet',
      });
      expect(BotState.getConfig()?.network).toBe('mainnet');
      BotState.stop();
    });

    test('should store complete configuration', () => {
      const config = {
        tokens: ['0x123', '0x456'],
        riskLevel: 8,
        maxTradeAmount: 5.0,
        stopLoss: 20,
        interval: 900000,
        network: 'mainnet' as const,
      };

      BotState.start(config);

      const storedConfig = BotState.getConfig();
      expect(storedConfig).toMatchObject(config);
    });
  });

  describe('Status Reporting', () => {
    test('should return correct status when stopped', () => {
      const status = BotState.getStatus();

      expect(status.running).toBe(false);
      expect(status.watchlist).toEqual([]);
      expect(status.riskLevel).toBe(5); // Default
      expect(status.config).toBeNull();
    });

    test('should return correct status when running', () => {
      BotState.start({
        tokens: ['0xAAA', '0xBBB'],
        riskLevel: 7,
        maxTradeAmount: 2.0,
        stopLoss: 12,
        interval: 450000,
        network: 'testnet',
      });

      const status = BotState.getStatus();

      expect(status.running).toBe(true);
      expect(status.watchlist).toEqual(['0xAAA', '0xBBB']);
      expect(status.riskLevel).toBe(7);
      expect(status.config).not.toBeNull();
      expect(status.config?.maxTradeAmount).toBe(2.0);
    });
  });
});
