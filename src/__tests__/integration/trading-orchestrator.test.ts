/**
 * Trading Orchestrator Integration Tests
 * Tests the complete 8-step trading loop, risk management, and performance tracking
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { getTradingOrchestrator, resetTradingOrchestrator } from '../../ai/tradingOrchestrator';
import { RiskManager } from '../../ai/riskManager';
import { PerformanceTracker } from '../../monitoring/performanceTracker';

describe('Trading Orchestrator Integration', () => {
  beforeEach(() => {
    // Reset singleton instance before each test
    resetTradingOrchestrator();
  });

  afterEach(async () => {
    // Clean up after each test
    const orchestrator = getTradingOrchestrator();
    if (orchestrator) {
      try {
        await orchestrator.stop();
      } catch (e) {
        // Ignore if not running
      }
    }
  });

  describe('Orchestrator Lifecycle', () => {
    test('should create singleton instance', () => {
      const orchestrator1 = getTradingOrchestrator();
      const orchestrator2 = getTradingOrchestrator();

      expect(orchestrator1).toBe(orchestrator2);
    });

    test('should start orchestrator successfully', async () => {
      const orchestrator = getTradingOrchestrator();

      // Start with test config
      await orchestrator.start();

      const status = await orchestrator.getCycleStatus();
      expect(status.isRunning).toBe(true);
      expect(status.config.enabled).toBe(true);
    });

    test('should stop orchestrator successfully', async () => {
      const orchestrator = getTradingOrchestrator();

      await orchestrator.start();
      expect((await orchestrator.getCycleStatus()).isRunning).toBe(true);

      await orchestrator.stop();
      expect((await orchestrator.getCycleStatus()).isRunning).toBe(false);
    });

    test('should update configuration', async () => {
      const orchestrator = getTradingOrchestrator();

      const newConfig = {
        intervalMs: 600000, // 10 minutes
        maxTradesPerCycle: 5,
        minConfidence: 0.7,
      };

      await orchestrator.updateConfig(newConfig);

      const status = await orchestrator.getCycleStatus();
      expect(status.config.intervalMs).toBe(600000);
      expect(status.config.maxTradesPerCycle).toBe(5);
      expect(status.config.minConfidence).toBe(0.7);
    });

    test('should track uptime correctly', async () => {
      const orchestrator = getTradingOrchestrator();

      await orchestrator.start();

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      const status = await orchestrator.getCycleStatus();
      expect(status.uptime).toBeGreaterThan(0);
      expect(status.uptime).toBeLessThan(200);
    });
  });

  describe('Risk Management Integration', () => {
    test('should create risk manager with default profile', () => {
      const riskManager = new RiskManager();
      const profile = riskManager.getRiskProfile();

      expect(profile.maxPositionSizePercent).toBe(10);
      expect(profile.maxTotalExposurePercent).toBe(50);
      expect(profile.stopLossPercent).toBe(10);
      expect(profile.takeProfitPercent).toBe(20);
    });

    test('should assess trade risk correctly', async () => {
      const riskManager = new RiskManager(100); // 100 BNB initial balance

      const assessment = await riskManager.assessTrade({
        tokenAddress: '0xtest',
        action: 'BUY',
        amount: 5, // 5 BNB (5% of balance)
        confidence: 0.8,
        currentBalance: 100,
        tokenData: {
          liquidity: 100000,
          volume24h: 50000,
          priceChange24h: 10,
        },
      });

      expect(assessment.approved).toBe(true);
      expect(assessment.riskScore).toBeLessThan(80);
      expect(assessment.checks.positionSize.passed).toBe(true);
      expect(assessment.checks.balance.passed).toBe(true);
    });

    test('should reject trades exceeding position size limit', async () => {
      const riskManager = new RiskManager(100);

      const assessment = await riskManager.assessTrade({
        tokenAddress: '0xtest',
        action: 'BUY',
        amount: 15, // 15 BNB (15% of balance, exceeds 10% limit)
        confidence: 0.9,
        currentBalance: 100,
        tokenData: {
          liquidity: 100000,
          volume24h: 50000,
          priceChange24h: 5,
        },
      });

      expect(assessment.approved).toBe(false);
      expect(assessment.checks.positionSize.passed).toBe(false);
      expect(assessment.warnings.length).toBeGreaterThan(0);
    });

    test('should reject trades with low confidence', async () => {
      const riskManager = new RiskManager(100);

      const assessment = await riskManager.assessTrade({
        tokenAddress: '0xtest',
        action: 'BUY',
        amount: 5,
        confidence: 0.4, // Below 0.6 threshold
        currentBalance: 100,
        tokenData: {
          liquidity: 100000,
          volume24h: 50000,
          priceChange24h: 5,
        },
      });

      expect(assessment.approved).toBe(false);
      expect(assessment.checks.confidence.passed).toBe(false);
    });

    test('should track open positions', async () => {
      const riskManager = new RiskManager(100);

      await riskManager.openPosition({
        tokenAddress: '0xtest1',
        tokenSymbol: 'TEST1',
        action: 'BUY',
        amount: 5,
        entryPrice: 1.5,
      });

      const positions = riskManager.getOpenPositions();
      expect(positions.length).toBe(1);
      expect(positions[0].tokenSymbol).toBe('TEST1');
      expect(positions[0].amount).toBe(5);
    });

    test('should calculate portfolio risk', async () => {
      const riskManager = new RiskManager(100);

      await riskManager.openPosition({
        tokenAddress: '0xtest1',
        tokenSymbol: 'TEST1',
        action: 'BUY',
        amount: 10,
        entryPrice: 1.0,
      });

      const portfolioRisk = await riskManager.getPortfolioRisk();

      expect(portfolioRisk.totalExposure).toBe(10);
      expect(portfolioRisk.exposurePercent).toBe(10);
      expect(portfolioRisk.activePositions).toBe(1);
      expect(portfolioRisk.riskLevel).toBe('LOW');
    });

    test('should trigger stop-loss', async () => {
      const riskManager = new RiskManager(100);

      await riskManager.openPosition({
        tokenAddress: '0xtest',
        tokenSymbol: 'TEST',
        action: 'BUY',
        amount: 10,
        entryPrice: 10.0,
      });

      // Price drops 11% (below 10% stop-loss)
      const result = await riskManager.updatePosition('0xtest', 8.9);

      expect(result.shouldClose).toBe(true);
      expect(result.reason).toContain('Stop-loss');
    });

    test('should trigger take-profit', async () => {
      const riskManager = new RiskManager(100);

      await riskManager.openPosition({
        tokenAddress: '0xtest',
        tokenSymbol: 'TEST',
        action: 'BUY',
        amount: 10,
        entryPrice: 10.0,
      });

      // Price rises 21% (above 20% take-profit)
      const result = await riskManager.updatePosition('0xtest', 12.1);

      expect(result.shouldClose).toBe(true);
      expect(result.reason).toContain('Take-profit');
    });
  });

  describe('Performance Tracking Integration', () => {
    test('should track successful trades', () => {
      const tracker = new PerformanceTracker(100);

      tracker.recordTrade({
        timestamp: Date.now(),
        token: '0xtest',
        action: 'BUY',
        amount: 5,
        price: 1.5,
        success: true,
        confidence: 0.8,
        profitLoss: 0.5,
        strategy: 'momentum',
      });

      const summary = tracker.getSummary();
      expect(summary.totalTrades).toBe(1);
      expect(summary.successfulTrades).toBe(1);
      expect(summary.successRate).toBe(1);
      expect(summary.totalProfit).toBe(0.5);
    });

    test('should track failed trades', () => {
      const tracker = new PerformanceTracker(100);

      tracker.recordTrade({
        timestamp: Date.now(),
        token: '0xtest',
        action: 'BUY',
        amount: 5,
        price: 1.5,
        success: false,
        confidence: 0.6,
      });

      const summary = tracker.getSummary();
      expect(summary.totalTrades).toBe(1);
      expect(summary.failedTrades).toBe(1);
      expect(summary.successRate).toBe(0);
    });

    test('should calculate win rate correctly', () => {
      const tracker = new PerformanceTracker(100);

      // 3 wins
      for (let i = 0; i < 3; i++) {
        tracker.recordTrade({
          timestamp: Date.now(),
          token: '0xtest',
          action: 'SELL',
          amount: 5,
          price: 1.5,
          success: true,
          confidence: 0.8,
          profitLoss: 0.2,
        });
      }

      // 1 loss
      tracker.recordTrade({
        timestamp: Date.now(),
        token: '0xtest',
        action: 'SELL',
        amount: 5,
        price: 1.5,
        success: true,
        confidence: 0.7,
        profitLoss: -0.1,
      });

      const summary = tracker.getSummary();
      expect(summary.totalTrades).toBe(4);
      expect(summary.successRate).toBe(1); // All executed successfully
      expect(summary.netProfit).toBeCloseTo(0.5); // 0.6 profit - 0.1 loss
    });

    test('should calculate profit factor', () => {
      const tracker = new PerformanceTracker(100);

      // Total profit: 0.9
      for (let i = 0; i < 3; i++) {
        tracker.recordTrade({
          timestamp: Date.now(),
          token: '0xtest',
          action: 'SELL',
          amount: 5,
          price: 1.5,
          success: true,
          confidence: 0.8,
          profitLoss: 0.3,
        });
      }

      // Total loss: 0.3
      for (let i = 0; i < 3; i++) {
        tracker.recordTrade({
          timestamp: Date.now(),
          token: '0xtest',
          action: 'SELL',
          amount: 5,
          price: 1.5,
          success: true,
          confidence: 0.7,
          profitLoss: -0.1,
        });
      }

      const summary = tracker.getSummary();
      expect(summary.profitFactor).toBeCloseTo(3.0); // 0.9 / 0.3 = 3.0
    });

    test('should calculate Sharpe ratio', () => {
      const tracker = new PerformanceTracker(100);

      const returns = [0.05, -0.02, 0.03, 0.08, -0.01, 0.04];
      returns.forEach(r => {
        tracker.recordTrade({
          timestamp: Date.now(),
          token: '0xtest',
          action: 'SELL',
          amount: 5,
          price: 1.5,
          success: true,
          confidence: 0.8,
          profitLoss: r,
        });
      });

      const summary = tracker.getSummary();
      expect(summary.sharpeRatio).toBeGreaterThan(0);
    });

    test('should track strategy performance', () => {
      const tracker = new PerformanceTracker(100);

      tracker.recordTrade({
        timestamp: Date.now(),
        token: '0xtest',
        action: 'BUY',
        amount: 5,
        price: 1.5,
        success: true,
        confidence: 0.8,
        profitLoss: 0.5,
        strategy: 'momentum',
      });

      tracker.recordTrade({
        timestamp: Date.now(),
        token: '0xtest',
        action: 'BUY',
        amount: 5,
        price: 1.5,
        success: true,
        confidence: 0.9,
        profitLoss: 0.3,
        strategy: 'momentum',
      });

      const strategies = tracker.getStrategyPerformance();
      expect(strategies.length).toBe(1);
      expect(strategies[0].strategyName).toBe('momentum');
      expect(strategies[0].trades).toBe(2);
      expect(strategies[0].successRate).toBe(100);
      expect(strategies[0].totalProfit).toBe(0.8);
    });

    test('should get best performing tokens', () => {
      const tracker = new PerformanceTracker(100);

      // Token 1: 2 trades, 0.6 profit
      tracker.recordTrade({
        timestamp: Date.now(),
        token: '0xtoken1',
        action: 'SELL',
        amount: 5,
        price: 1.5,
        success: true,
        confidence: 0.8,
        profitLoss: 0.3,
      });

      tracker.recordTrade({
        timestamp: Date.now(),
        token: '0xtoken1',
        action: 'SELL',
        amount: 5,
        price: 1.5,
        success: true,
        confidence: 0.8,
        profitLoss: 0.3,
      });

      // Token 2: 1 trade, 0.2 profit
      tracker.recordTrade({
        timestamp: Date.now(),
        token: '0xtoken2',
        action: 'SELL',
        amount: 5,
        price: 1.5,
        success: true,
        confidence: 0.7,
        profitLoss: 0.2,
      });

      const bestTokens = tracker.getBestTokens(10);
      expect(bestTokens.length).toBe(2);
      expect(bestTokens[0].token).toBe('0xtoken1');
      expect(bestTokens[0].totalProfit).toBe(0.6);
      expect(bestTokens[1].token).toBe('0xtoken2');
    });
  });

  describe('Performance Metrics', () => {
    test('should get comprehensive performance data', async () => {
      const orchestrator = getTradingOrchestrator();

      const performance = await orchestrator.getPerformance();

      expect(performance).toHaveProperty('summary');
      expect(performance).toHaveProperty('recentTrades');
      expect(performance).toHaveProperty('strategies');
      expect(performance).toHaveProperty('timeSeries');
      expect(performance).toHaveProperty('bestTokens');
    });

    test('should get risk status', async () => {
      const orchestrator = getTradingOrchestrator();

      const riskStatus = await orchestrator.getRiskStatus();

      expect(riskStatus).toHaveProperty('openPositions');
      expect(riskStatus).toHaveProperty('totalExposure');
      expect(riskStatus).toHaveProperty('portfolioRisk');
      expect(riskStatus).toHaveProperty('riskProfile');

      expect(Array.isArray(riskStatus.openPositions)).toBe(true);
      expect(typeof riskStatus.totalExposure).toBe('number');
    });

    test('should get cycle status', async () => {
      const orchestrator = getTradingOrchestrator();

      const cycleStatus = await orchestrator.getCycleStatus();

      expect(cycleStatus).toHaveProperty('isRunning');
      expect(cycleStatus).toHaveProperty('config');
      expect(cycleStatus).toHaveProperty('lastCycleResult');
      expect(cycleStatus).toHaveProperty('uptime');

      expect(typeof cycleStatus.isRunning).toBe('boolean');
      expect(typeof cycleStatus.uptime).toBe('number');
    });
  });

  describe('Configuration Management', () => {
    test('should have default configuration', async () => {
      const orchestrator = getTradingOrchestrator();
      const status = await orchestrator.getCycleStatus();

      expect(status.config.intervalMs).toBe(300000); // 5 minutes
      expect(status.config.maxTradesPerCycle).toBe(3);
      expect(status.config.minConfidence).toBe(0.6);
      expect(status.config.enableRiskManagement).toBe(true);
    });

    test('should update config while running', async () => {
      const orchestrator = getTradingOrchestrator();

      await orchestrator.start();

      await orchestrator.updateConfig({
        maxTradesPerCycle: 10,
        minConfidence: 0.8,
      });

      const status = await orchestrator.getCycleStatus();
      expect(status.config.maxTradesPerCycle).toBe(10);
      expect(status.config.minConfidence).toBe(0.8);
    });
  });
});
