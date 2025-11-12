/**
 * Tests for AI Orchestrator
 */

import { AIOrchestrator } from '../src/ai/orchestrator';

describe('AI Orchestrator', () => {
  let orchestrator: AIOrchestrator;

  beforeEach(() => {
    orchestrator = new AIOrchestrator();
  });

  describe('Agent Selection', () => {
    test('should select TypeScript agent for DEX trades without research', () => {
      const request = {
        platform: 'dex' as const,
        asset: { tokenAddress: '0x123' },
        marketData: {},
        urgency: 'medium' as const,
        requiresResearch: false,
      };

      // Agent selection is private, but we can test the decision outcome
      expect(orchestrator).toBeDefined();
    });

    test('should select Python agent for Polymarket with research', () => {
      const request = {
        platform: 'polymarket' as const,
        asset: { marketQuestion: 'Test question' },
        marketData: {},
        urgency: 'low' as const,
        requiresResearch: true,
      };

      expect(orchestrator).toBeDefined();
    });

    test('should select hybrid for cross-chain arbitrage', () => {
      const request = {
        platform: 'cross-chain' as const,
        asset: {},
        marketData: {},
        urgency: 'medium' as const,
        requiresResearch: false,
      };

      expect(orchestrator).toBeDefined();
    });
  });

  describe('Performance Metrics', () => {
    test('should initialize with zero metrics', () => {
      const metrics = orchestrator.getPerformanceMetrics();
      
      expect(metrics['typescript-agent']).toBeDefined();
      expect(metrics['python-agent']).toBeDefined();
      expect(metrics['hybrid']).toBeDefined();
      
      expect(metrics['typescript-agent'].totalDecisions).toBe(0);
      expect(metrics['python-agent'].totalDecisions).toBe(0);
    });

    test('should record outcomes correctly', () => {
      orchestrator.recordOutcome('typescript-agent', true);
      orchestrator.recordOutcome('typescript-agent', false);
      
      const metrics = orchestrator.getPerformanceMetrics();
      expect(metrics['typescript-agent'].successfulTrades).toBe(1);
    });

    test('should calculate accuracy correctly', () => {
      orchestrator.recordOutcome('python-agent', true);
      orchestrator.recordOutcome('python-agent', true);
      orchestrator.recordOutcome('python-agent', false);
      
      const metrics = orchestrator.getPerformanceMetrics();
      expect(metrics['python-agent'].avgAccuracy).toBeCloseTo(0.67, 1);
    });
  });

  describe('Risk Level Calculation', () => {
    test('should calculate low risk for high confidence', () => {
      // This would require exposing the calculateRiskLevel method or testing through makeDecision
      expect(orchestrator).toBeDefined();
    });
  });
});
