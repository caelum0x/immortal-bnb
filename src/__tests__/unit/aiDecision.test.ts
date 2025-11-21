/**
 * Unit Tests for AI Decision Engine
 * Tests AI decision validation, confidence scoring, and reasoning
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { AIDecisionEngine, AIDecisionParams, AIDecisionResult } from '../../agent/aiDecision';
import * as memoryStorage from '../../blockchain/memoryStorage';

// Mock dependencies
jest.mock('../../blockchain/memoryStorage');
jest.mock('ai', () => ({
  generateText: jest.fn(),
}));
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('AIDecisionEngine', () => {
  let aiEngine: AIDecisionEngine;
  const mockParams: AIDecisionParams = {
    tokenSymbol: 'CAKE',
    tokenAddress: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
    priceUsd: '2.50',
    volume24h: 1000000,
    priceChange24h: 5.5,
    liquidity: 500000,
    walletBalance: 1.0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    aiEngine = new AIDecisionEngine();
  });

  describe('makeDecision', () => {
    test('should return valid decision structure', async () => {
      (memoryStorage.queryMemories as jest.Mock).mockResolvedValue([]);
      
      // Mock AI response
      const { generateText } = require('ai');
      generateText.mockResolvedValue({
        text: JSON.stringify({
          action: 'BUY',
          amount: 0.5,
          confidence: 0.8,
          reasoning: 'Strong upward trend',
          strategy: 'momentum',
          riskLevel: 'MEDIUM',
        }),
      });

      const result = await aiEngine.makeDecision(mockParams);

      expect(result).toHaveProperty('action');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('reasoning');
      expect(result).toHaveProperty('strategy');
      expect(['BUY', 'SELL', 'HOLD']).toContain(result.action);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    test('should query relevant memories', async () => {
      const mockMemories = [
        { tokenAddress: mockParams.tokenAddress, outcome: 'profit' },
      ];
      (memoryStorage.queryMemories as jest.Mock).mockResolvedValue(mockMemories);

      const { generateText } = require('ai');
      generateText.mockResolvedValue({
        text: JSON.stringify({
          action: 'BUY',
          amount: 0.5,
          confidence: 0.8,
          reasoning: 'Past success',
          strategy: 'memory-based',
          riskLevel: 'LOW',
        }),
      });

      await aiEngine.makeDecision(mockParams);

      expect(memoryStorage.queryMemories).toHaveBeenCalledWith({
        tokenAddress: mockParams.tokenAddress,
        limit: 5,
      });
    });

    test('should handle low confidence decisions', async () => {
      (memoryStorage.queryMemories as jest.Mock).mockResolvedValue([]);
      
      const { generateText } = require('ai');
      generateText.mockResolvedValue({
        text: JSON.stringify({
          action: 'HOLD',
          amount: 0,
          confidence: 0.3,
          reasoning: 'Uncertain market conditions',
          strategy: 'conservative',
          riskLevel: 'LOW',
        }),
      });

      const result = await aiEngine.makeDecision(mockParams);

      expect(result.confidence).toBeLessThan(0.5);
      expect(result.action).toBe('HOLD');
    });

    test('should handle high confidence buy decisions', async () => {
      (memoryStorage.queryMemories as jest.Mock).mockResolvedValue([
        { outcome: 'profit', profitLoss: 0.15 },
        { outcome: 'profit', profitLoss: 0.20 },
      ]);
      
      const { generateText } = require('ai');
      generateText.mockResolvedValue({
        text: JSON.stringify({
          action: 'BUY',
          amount: 0.8,
          confidence: 0.95,
          reasoning: 'Strong buy signal with historical success',
          strategy: 'aggressive',
          riskLevel: 'HIGH',
        }),
      });

      const result = await aiEngine.makeDecision(mockParams);

      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.action).toBe('BUY');
      expect(result.riskLevel).toBe('HIGH');
    });

    test('should validate confidence threshold', async () => {
      (memoryStorage.queryMemories as jest.Mock).mockResolvedValue([]);
      
      const { generateText } = require('ai');
      generateText.mockResolvedValue({
        text: JSON.stringify({
          action: 'BUY',
          amount: 0.5,
          confidence: 0.6, // Below typical threshold
          reasoning: 'Moderate confidence',
          strategy: 'balanced',
          riskLevel: 'MEDIUM',
        }),
      });

      const result = await aiEngine.makeDecision(mockParams);

      // Should still return the decision, but caller should check confidence
      expect(result.confidence).toBe(0.6);
    });

    test('should handle AI API errors gracefully', async () => {
      (memoryStorage.queryMemories as jest.Mock).mockResolvedValue([]);
      
      const { generateText } = require('ai');
      generateText.mockRejectedValue(new Error('API rate limit exceeded'));

      await expect(aiEngine.makeDecision(mockParams)).rejects.toThrow();
    });

    test('should handle invalid AI response format', async () => {
      (memoryStorage.queryMemories as jest.Mock).mockResolvedValue([]);
      
      const { generateText } = require('ai');
      generateText.mockResolvedValue({
        text: 'Invalid JSON response',
      });

      // Should handle gracefully or throw
      await expect(aiEngine.makeDecision(mockParams)).rejects.toThrow();
    });

    test('should include market sentiment in decision', async () => {
      const paramsWithSentiment: AIDecisionParams = {
        ...mockParams,
        marketSentiment: 'bullish',
      };

      (memoryStorage.queryMemories as jest.Mock).mockResolvedValue([]);
      
      const { generateText } = require('ai');
      generateText.mockResolvedValue({
        text: JSON.stringify({
          action: 'BUY',
          amount: 0.7,
          confidence: 0.85,
          reasoning: 'Bullish sentiment confirmed',
          strategy: 'sentiment-based',
          riskLevel: 'MEDIUM',
        }),
      });

      const result = await aiEngine.makeDecision(paramsWithSentiment);

      expect(result.reasoning).toContain('sentiment');
    });

    test('should handle missing optional parameters', async () => {
      const minimalParams: AIDecisionParams = {
        tokenSymbol: 'TEST',
        tokenAddress: '0x123',
        priceUsd: '1.0',
        volume24h: 0,
        priceChange24h: 0,
        liquidity: 0,
        walletBalance: 0.1,
      };

      (memoryStorage.queryMemories as jest.Mock).mockResolvedValue([]);
      
      const { generateText } = require('ai');
      generateText.mockResolvedValue({
        text: JSON.stringify({
          action: 'HOLD',
          amount: 0,
          confidence: 0.5,
          reasoning: 'Insufficient data',
          strategy: 'conservative',
          riskLevel: 'LOW',
        }),
      });

      const result = await aiEngine.makeDecision(minimalParams);

      expect(result).toBeDefined();
      expect(result.action).toBe('HOLD');
    });
  });

  describe('Decision Validation', () => {
    test('should ensure amount is between 0 and 1', async () => {
      (memoryStorage.queryMemories as jest.Mock).mockResolvedValue([]);
      
      const { generateText } = require('ai');
      generateText.mockResolvedValue({
        text: JSON.stringify({
          action: 'BUY',
          amount: 1.5, // Invalid: > 1
          confidence: 0.8,
          reasoning: 'Test',
          strategy: 'test',
          riskLevel: 'MEDIUM',
        }),
      });

      const result = await aiEngine.makeDecision(mockParams);

      // Should clamp or validate amount
      expect(result.amount).toBeLessThanOrEqual(1);
      expect(result.amount).toBeGreaterThanOrEqual(0);
    });

    test('should validate risk level', async () => {
      (memoryStorage.queryMemories as jest.Mock).mockResolvedValue([]);
      
      const { generateText } = require('ai');
      generateText.mockResolvedValue({
        text: JSON.stringify({
          action: 'BUY',
          amount: 0.5,
          confidence: 0.8,
          reasoning: 'Test',
          strategy: 'test',
          riskLevel: 'INVALID', // Invalid risk level
        }),
      });

      const result = await aiEngine.makeDecision(mockParams);

      // Should default to valid risk level or handle gracefully
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.riskLevel);
    });
  });
});

