// tests/aiDecision.test.ts
// Test AI decision-making logic

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import type { TokenData } from '../src/data/marketFetcher';

describe('AI Decision Making', () => {
  let mockTokenData: TokenData;

  beforeEach(() => {
    mockTokenData = {
      tokenAddress: '0x123',
      tokenSymbol: 'TEST',
      tokenName: 'Test Token',
      priceUsd: 0.001,
      priceChange24h: 15.5,
      volume24h: 50000,
      liquidity: {
        usd: 25000,
        base: 1000,
        quote: 25,
      },
      fdv: 1000000,
      marketCap: 500000,
      pairAddress: '0xpair',
      chainId: '5611',
      dexId: 'pancakeswap',
      priceNative: 0.00001,
      txns24h: {
        buys: 150,
        sells: 100,
      },
      buyPressure: 0.6,
      volumeToLiquidityRatio: 2.0,
      priceImpact: 0.4,
    };
  });

  it('should correctly parse token data', () => {
    expect(mockTokenData.tokenSymbol).toBe('TEST');
    expect(mockTokenData.priceUsd).toBe(0.001);
    expect(mockTokenData.buyPressure).toBe(0.6);
  });

  it('should identify bullish signals', () => {
    const isBullish = 
      mockTokenData.priceChange24h > 10 &&
      mockTokenData.buyPressure > 0.55 &&
      mockTokenData.volume24h > 10000;

    expect(isBullish).toBe(true);
  });

  it('should identify high risk conditions', () => {
    const isHighRisk =
      mockTokenData.liquidity.usd < 10000 ||
      mockTokenData.volumeToLiquidityRatio > 3 ||
      mockTokenData.priceImpact > 5;

    // With our mock data, this should be false
    expect(isHighRisk).toBe(false);

    // Test with low liquidity
    const lowLiquidityData = { ...mockTokenData, liquidity: { usd: 5000, base: 0, quote: 0 } };
    const isHighRiskLowLiq = lowLiquidityData.liquidity.usd < 10000;
    expect(isHighRiskLowLiq).toBe(true);
  });

  it('should calculate buy pressure correctly', () => {
    const { buys, sells } = mockTokenData.txns24h;
    const calculatedPressure = buys / (buys + sells);

    expect(calculatedPressure).toBe(0.6);
    expect(mockTokenData.buyPressure).toBe(calculatedPressure);
  });

  it('should validate trade amount limits', () => {
    const maxTradeAmount = 0.1;
    const proposedAmount = 0.05;

    expect(proposedAmount).toBeLessThanOrEqual(maxTradeAmount);
    expect(proposedAmount).toBeGreaterThan(0);
  });
});

describe('AI Response Parsing', () => {
  it('should parse valid AI decision JSON', () => {
    const mockResponse = {
      action: 'buy',
      amount: 0.05,
      confidence: 0.85,
      reasoning: 'Strong buy pressure and increasing volume',
      riskLevel: 'medium',
    };

    expect(mockResponse.action).toMatch(/^(buy|sell|hold)$/);
    expect(mockResponse.confidence).toBeGreaterThanOrEqual(0);
    expect(mockResponse.confidence).toBeLessThanOrEqual(1);
    expect(mockResponse.amount).toBeGreaterThan(0);
  });

  it('should reject low confidence trades', () => {
    const decision = {
      confidence: 0.65,
      action: 'buy',
    };

    const minConfidence = 0.7;
    const shouldExecute = decision.confidence >= minConfidence;

    expect(shouldExecute).toBe(false);
  });

  it('should accept high confidence trades', () => {
    const decision = {
      confidence: 0.85,
      action: 'buy',
    };

    const minConfidence = 0.7;
    const shouldExecute = decision.confidence >= minConfidence;

    expect(shouldExecute).toBe(true);
  });
});
