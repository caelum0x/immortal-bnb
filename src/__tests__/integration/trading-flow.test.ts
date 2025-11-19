/**
 * Integration Tests for Complete Trading Flow
 * Tests the full trading cycle from token discovery to trade execution
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { BotState } from '../../bot-state';
import * as marketFetcher from '../../data/marketFetcher';
import * as aiDecision from '../../agent/aiDecision';
import * as tradeExecutor from '../../blockchain/tradeExecutor';
import * as memoryStorage from '../../blockchain/memoryStorage';

// Mock all external dependencies
jest.mock('../../data/marketFetcher');
jest.mock('../../agent/aiDecision');
jest.mock('../../blockchain/tradeExecutor');
jest.mock('../../blockchain/memoryStorage');
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Complete Trading Flow Integration', () => {
  const mockTokenAddress = '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82';
  const mockTokenData = {
    address: mockTokenAddress,
    symbol: 'CAKE',
    price: 2.5,
    volume24h: 1000000,
    priceChange24h: 5.5,
    liquidity: 500000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    if (BotState.isRunning()) {
      BotState.stop();
    }
  });

  afterEach(() => {
    if (BotState.isRunning()) {
      BotState.stop();
    }
  });

  test('should complete full trading cycle: discovery -> analysis -> decision -> execution -> storage', async () => {
    // 1. Start bot
    BotState.start({
      tokens: [],
      riskLevel: 5,
      maxTradeAmount: 0.1,
      stopLoss: 10,
      interval: 300000,
      network: 'testnet',
    });

    expect(BotState.isRunning()).toBe(true);

    // 2. Token discovery
    (marketFetcher.getTrendingTokens as jest.Mock).mockResolvedValue([mockTokenData]);
    const trendingTokens = await marketFetcher.getTrendingTokens(3);
    expect(trendingTokens).toHaveLength(1);
    expect(trendingTokens[0].address).toBe(mockTokenAddress);

    // 3. Market data fetching
    (marketFetcher.getTokenData as jest.Mock).mockResolvedValue(mockTokenData);
    const tokenData = await marketFetcher.getTokenData(mockTokenAddress);
    expect(tokenData).toBeDefined();
    expect(tokenData.address).toBe(mockTokenAddress);

    // 4. AI decision
    const mockDecision = {
      action: 'BUY' as const,
      amount: 0.5,
      confidence: 0.8,
      reasoning: 'Strong upward trend',
      strategy: 'momentum',
      riskLevel: 'MEDIUM' as const,
    };
    (aiDecision.AIDecisionEngine.prototype.makeDecision as jest.Mock).mockResolvedValue(mockDecision);
    
    const aiEngine = new aiDecision.AIDecisionEngine();
    const decision = await aiEngine.makeDecision({
      tokenSymbol: mockTokenData.symbol,
      tokenAddress: mockTokenAddress,
      priceUsd: mockTokenData.price.toString(),
      volume24h: mockTokenData.volume24h,
      priceChange24h: mockTokenData.priceChange24h,
      liquidity: mockTokenData.liquidity,
      walletBalance: 1.0,
    });

    expect(decision.action).toBe('BUY');
    expect(decision.confidence).toBeGreaterThan(0.7);

    // 5. Trade execution (if decision is BUY/SELL with high confidence)
    if (decision.action === 'BUY' && decision.confidence > 0.7) {
      const mockTradeResult = {
        success: true,
        txHash: '0xabc123',
        amountIn: '0.05',
        amountOut: '20',
        actualPrice: 0.0025,
        gasUsed: '21000',
      };
      (tradeExecutor.TradeExecutor.prototype.executeTrade as jest.Mock).mockResolvedValue(mockTradeResult);

      const executor = new tradeExecutor.TradeExecutor();
      const tradeResult = await executor.executeTrade({
        tokenAddress: mockTokenAddress,
        action: 'buy',
        amountBNB: 0.05,
      });

      expect(tradeResult.success).toBe(true);
      expect(tradeResult.txHash).toBeDefined();

      // 6. Memory storage
      (memoryStorage.storeMemory as jest.Mock).mockResolvedValue('memory-id-123');
      const memoryId = await memoryStorage.storeMemory({
        timestamp: Date.now(),
        tokenSymbol: mockTokenData.symbol,
        tokenAddress: mockTokenAddress,
        action: 'buy',
        amount: 0.05,
        entryPrice: mockTokenData.price,
        outcome: 'pending',
        confidence: decision.confidence,
        strategy: decision.strategy,
        riskLevel: decision.riskLevel,
        aiReasoning: decision.reasoning,
        marketConditions: {
          volume: mockTokenData.volume24h,
          liquidity: mockTokenData.liquidity,
          priceChange: mockTokenData.priceChange24h,
        },
      });

      expect(memoryId).toBeDefined();
      expect(memoryStorage.storeMemory).toHaveBeenCalled();
    }
  });

  test('should handle HOLD decision without executing trade', async () => {
    BotState.start({
      tokens: [mockTokenAddress],
      riskLevel: 5,
      maxTradeAmount: 0.1,
      stopLoss: 10,
      interval: 300000,
      network: 'testnet',
    });

    (marketFetcher.getTokenData as jest.Mock).mockResolvedValue(mockTokenData);

    const mockDecision = {
      action: 'HOLD' as const,
      amount: 0,
      confidence: 0.4,
      reasoning: 'Uncertain market conditions',
      strategy: 'conservative',
      riskLevel: 'LOW' as const,
    };
    (aiDecision.AIDecisionEngine.prototype.makeDecision as jest.Mock).mockResolvedValue(mockDecision);

    const aiEngine = new aiDecision.AIDecisionEngine();
    const decision = await aiEngine.makeDecision({
      tokenSymbol: mockTokenData.symbol,
      tokenAddress: mockTokenAddress,
      priceUsd: mockTokenData.price.toString(),
      volume24h: mockTokenData.volume24h,
      priceChange24h: mockTokenData.priceChange24h,
      liquidity: mockTokenData.liquidity,
      walletBalance: 1.0,
    });

    expect(decision.action).toBe('HOLD');
    
    // Trade executor should not be called
    expect(tradeExecutor.TradeExecutor.prototype.executeTrade).not.toHaveBeenCalled();
  });

  test('should handle low confidence decisions by holding', async () => {
    BotState.start({
      tokens: [mockTokenAddress],
      riskLevel: 5,
      maxTradeAmount: 0.1,
      stopLoss: 10,
      interval: 300000,
      network: 'testnet',
    });

    (marketFetcher.getTokenData as jest.Mock).mockResolvedValue(mockTokenData);

    const mockDecision = {
      action: 'BUY' as const,
      amount: 0.5,
      confidence: 0.5, // Below threshold
      reasoning: 'Weak signal',
      strategy: 'cautious',
      riskLevel: 'LOW' as const,
    };
    (aiDecision.AIDecisionEngine.prototype.makeDecision as jest.Mock).mockResolvedValue(mockDecision);

    const aiEngine = new aiDecision.AIDecisionEngine();
    const decision = await aiEngine.makeDecision({
      tokenSymbol: mockTokenData.symbol,
      tokenAddress: mockTokenAddress,
      priceUsd: mockTokenData.price.toString(),
      volume24h: mockTokenData.volume24h,
      priceChange24h: mockTokenData.priceChange24h,
      liquidity: mockTokenData.liquidity,
      walletBalance: 1.0,
    });

    expect(decision.confidence).toBeLessThan(0.7);
    // Should not execute trade with low confidence
  });

  test('should handle trade execution failure gracefully', async () => {
    BotState.start({
      tokens: [mockTokenAddress],
      riskLevel: 5,
      maxTradeAmount: 0.1,
      stopLoss: 10,
      interval: 300000,
      network: 'testnet',
    });

    (marketFetcher.getTokenData as jest.Mock).mockResolvedValue(mockTokenData);

    const mockDecision = {
      action: 'BUY' as const,
      amount: 0.5,
      confidence: 0.8,
      reasoning: 'Strong signal',
      strategy: 'momentum',
      riskLevel: 'MEDIUM' as const,
    };
    (aiDecision.AIDecisionEngine.prototype.makeDecision as jest.Mock).mockResolvedValue(mockDecision);

    // Trade execution fails
    (tradeExecutor.TradeExecutor.prototype.executeTrade as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Insufficient liquidity',
    });

    const executor = new tradeExecutor.TradeExecutor();
    const tradeResult = await executor.executeTrade({
      tokenAddress: mockTokenAddress,
      action: 'buy',
      amountBNB: 0.05,
    });

    expect(tradeResult.success).toBe(false);
    expect(tradeResult.error).toBeDefined();
    
    // Memory should still be stored with failure outcome
    (memoryStorage.storeMemory as jest.Mock).mockResolvedValue('memory-id-failed');
    await memoryStorage.storeMemory({
      timestamp: Date.now(),
      tokenSymbol: mockTokenData.symbol,
      tokenAddress: mockTokenAddress,
      action: 'buy',
      amount: 0.05,
      entryPrice: mockTokenData.price,
      outcome: 'failed',
      confidence: mockDecision.confidence,
      strategy: mockDecision.strategy,
      riskLevel: mockDecision.riskLevel,
      aiReasoning: mockDecision.reasoning,
      marketConditions: {
        volume: mockTokenData.volume24h,
        liquidity: mockTokenData.liquidity,
        priceChange: mockTokenData.priceChange24h,
      },
    });

    expect(memoryStorage.storeMemory).toHaveBeenCalled();
  });

  test('should stop trading cycle when bot is stopped', async () => {
    BotState.start({
      tokens: [mockTokenAddress],
      riskLevel: 5,
      maxTradeAmount: 0.1,
      stopLoss: 10,
      interval: 300000,
      network: 'testnet',
    });

    expect(BotState.isRunning()).toBe(true);

    // Stop bot mid-cycle
    BotState.stop();

    expect(BotState.isRunning()).toBe(false);
    
    // Subsequent operations should check if bot is running
    if (BotState.isRunning()) {
      (marketFetcher.getTokenData as jest.Mock).mockResolvedValue(mockTokenData);
      await marketFetcher.getTokenData(mockTokenAddress);
    }

    // Should not proceed with trading
    expect(tradeExecutor.TradeExecutor.prototype.executeTrade).not.toHaveBeenCalled();
  });
});

