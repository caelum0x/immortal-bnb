/**
 * Risk Management System
 * Implements comprehensive risk checks for all trades:
 * - Position sizing
 * - Stop-loss management
 * - Confidence thresholds
 * - Portfolio diversification
 * - Liquidity checks
 * - Slippage protection
 */

import { logger } from '../utils/logger';
import { CONFIG } from '../config';
import { getWalletBalance, getTokenBalance } from '../blockchain/tradeExecutor';

export interface TradeRiskAssessment {
  approved: boolean;
  reason?: string;
  riskScore: number; // 0-100 scale
  adjustedAmount?: number;
  warnings: string[];
  checks: {
    positionSize: boolean;
    liquidityCheck: boolean;
    confidenceCheck: boolean;
    balanceCheck: boolean;
    diversificationCheck: boolean;
    volatilityCheck: boolean;
  };
}

export interface TradeRequest {
  tokenAddress: string;
  action: 'BUY' | 'SELL';
  amount: number;
  confidence: number;
  currentBalance: number;
  tokenData: {
    symbol: string;
    liquidity: number;
    volume24h: number;
    priceChange24h: number;
    marketCap?: number;
  };
}

export interface RiskProfile {
  maxPositionSizePercent: number; // Max % of portfolio per trade
  maxTotalExposurePercent: number; // Max % of portfolio in active trades
  minConfidenceThreshold: number; // Min AI confidence
  maxPriceImpactPercent: number; // Max acceptable price impact
  minLiquidityUSD: number; // Min liquidity for trading
  maxVolatility: number; // Max 24h price change
  stopLossPercent: number; // Stop-loss threshold
  takeProfitPercent: number; // Take-profit threshold
}

export interface ActivePosition {
  tokenAddress: string;
  tokenSymbol: string;
  entryPrice: number;
  amount: number;
  currentPrice: number;
  unrealizedPnL: number;
  timestamp: number;
}

export class RiskManager {
  private riskProfile: RiskProfile;
  private activePositions: Map<string, ActivePosition> = new Map();
  private totalExposure: number = 0;
  private maxDrawdown: number = 0;
  private initialBalance: number = 0;

  constructor(customProfile?: Partial<RiskProfile>) {
    this.riskProfile = {
      maxPositionSizePercent: 10, // Max 10% per trade
      maxTotalExposurePercent: 50, // Max 50% total exposure
      minConfidenceThreshold: CONFIG.MIN_CONFIDENCE_THRESHOLD || 0.6,
      maxPriceImpactPercent: 5, // Max 5% price impact
      minLiquidityUSD: 10000, // Min $10k liquidity
      maxVolatility: 50, // Max 50% 24h change
      stopLossPercent: CONFIG.STOP_LOSS_PERCENTAGE || 10,
      takeProfitPercent: 20, // 20% take-profit
      ...customProfile,
    };

    logger.info('🛡️ Risk Manager initialized');
    logger.info(`   - Max Position Size: ${this.riskProfile.maxPositionSizePercent}%`);
    logger.info(`   - Max Total Exposure: ${this.riskProfile.maxTotalExposurePercent}%`);
    logger.info(`   - Min Confidence: ${this.riskProfile.minConfidenceThreshold * 100}%`);
    logger.info(`   - Stop Loss: ${this.riskProfile.stopLossPercent}%`);

    this.initializeBalance();
  }

  /**
   * Initialize balance tracking
   */
  private async initializeBalance(): Promise<void> {
    try {
      this.initialBalance = await getWalletBalance();
      logger.info(`   - Initial Balance: ${this.initialBalance.toFixed(4)} BNB`);
    } catch (error) {
      logger.error('Failed to initialize balance:', error);
    }
  }

  /**
   * Assess a trade request for risk
   */
  async assessTrade(request: TradeRequest): Promise<TradeRiskAssessment> {
    const warnings: string[] = [];
    let riskScore = 0;

    const checks = {
      positionSize: false,
      liquidityCheck: false,
      confidenceCheck: false,
      balanceCheck: false,
      diversificationCheck: false,
      volatilityCheck: false,
    };

    // ═══════════════════════════════════════════════════════════
    // CHECK 1: Position Size
    // ═══════════════════════════════════════════════════════════
    const maxAllowedAmount =
      (request.currentBalance * this.riskProfile.maxPositionSizePercent) / 100;

    if (request.amount > maxAllowedAmount) {
      warnings.push(
        `Position size too large: ${request.amount.toFixed(4)} > ${maxAllowedAmount.toFixed(4)} BNB`
      );
      riskScore += 30;
    } else {
      checks.positionSize = true;
    }

    // Auto-adjust amount if needed
    const adjustedAmount = Math.min(request.amount, maxAllowedAmount);

    // ═══════════════════════════════════════════════════════════
    // CHECK 2: Liquidity
    // ═══════════════════════════════════════════════════════════
    if (request.tokenData.liquidity < this.riskProfile.minLiquidityUSD) {
      warnings.push(
        `Low liquidity: $${request.tokenData.liquidity} < $${this.riskProfile.minLiquidityUSD}`
      );
      riskScore += 25;
    } else {
      checks.liquidityCheck = true;
    }

    // ═══════════════════════════════════════════════════════════
    // CHECK 3: Confidence Threshold
    // ═══════════════════════════════════════════════════════════
    if (request.confidence < this.riskProfile.minConfidenceThreshold) {
      return {
        approved: false,
        reason: `Confidence too low: ${(request.confidence * 100).toFixed(1)}% < ${(this.riskProfile.minConfidenceThreshold * 100).toFixed(1)}%`,
        riskScore: 100,
        warnings,
        checks,
      };
    } else {
      checks.confidenceCheck = true;
    }

    // ═══════════════════════════════════════════════════════════
    // CHECK 4: Balance Check
    // ═══════════════════════════════════════════════════════════
    const minBalanceRequired = request.amount * 1.05; // +5% for gas

    if (request.currentBalance < minBalanceRequired) {
      return {
        approved: false,
        reason: `Insufficient balance: ${request.currentBalance.toFixed(4)} < ${minBalanceRequired.toFixed(4)} BNB`,
        riskScore: 100,
        warnings,
        checks,
      };
    } else {
      checks.balanceCheck = true;
    }

    // ═══════════════════════════════════════════════════════════
    // CHECK 5: Total Exposure
    // ═══════════════════════════════════════════════════════════
    const currentExposurePercent = (this.totalExposure / request.currentBalance) * 100;
    const newExposurePercent = ((this.totalExposure + request.amount) / request.currentBalance) * 100;

    if (newExposurePercent > this.riskProfile.maxTotalExposurePercent) {
      warnings.push(
        `Total exposure too high: ${newExposurePercent.toFixed(1)}% > ${this.riskProfile.maxTotalExposurePercent}%`
      );
      riskScore += 20;
    } else {
      checks.diversificationCheck = true;
    }

    // ═══════════════════════════════════════════════════════════
    // CHECK 6: Volatility
    // ═══════════════════════════════════════════════════════════
    const volatility = Math.abs(request.tokenData.priceChange24h);

    if (volatility > this.riskProfile.maxVolatility) {
      warnings.push(
        `High volatility: ${volatility.toFixed(1)}% > ${this.riskProfile.maxVolatility}%`
      );
      riskScore += 15;
    } else {
      checks.volatilityCheck = true;
    }

    // ═══════════════════════════════════════════════════════════
    // CHECK 7: Price Impact
    // ═══════════════════════════════════════════════════════════
    const estimatedPriceImpact =
      (request.amount / (request.tokenData.liquidity / 1000)) * 100;

    if (estimatedPriceImpact > this.riskProfile.maxPriceImpactPercent) {
      warnings.push(
        `High price impact: ${estimatedPriceImpact.toFixed(2)}% > ${this.riskProfile.maxPriceImpactPercent}%`
      );
      riskScore += 20;
    }

    // ═══════════════════════════════════════════════════════════
    // CHECK 8: Drawdown Protection
    // ═══════════════════════════════════════════════════════════
    const currentDrawdown =
      ((this.initialBalance - request.currentBalance) / this.initialBalance) * 100;

    if (currentDrawdown > 25) {
      // 25% max drawdown
      warnings.push(
        `High drawdown: ${currentDrawdown.toFixed(1)}% - Consider reducing risk`
      );
      riskScore += 25;
    }

    // ═══════════════════════════════════════════════════════════
    // FINAL DECISION
    // ═══════════════════════════════════════════════════════════
    const approved = riskScore < 80; // Reject if risk score > 80

    if (approved) {
      logger.info(`   ✅ Risk assessment passed (score: ${riskScore}/100)`);
      if (warnings.length > 0) {
        logger.warn(`   ⚠️ Warnings: ${warnings.join(', ')}`);
      }
    } else {
      logger.error(`   ❌ Risk assessment failed (score: ${riskScore}/100)`);
      logger.error(`   ❌ Warnings: ${warnings.join(', ')}`);
    }

    return {
      approved,
      reason: approved ? undefined : warnings[0],
      riskScore,
      adjustedAmount: adjustedAmount !== request.amount ? adjustedAmount : undefined,
      warnings,
      checks,
    };
  }

  /**
   * Track a new active position
   */
  async trackPosition(position: Omit<ActivePosition, 'currentPrice' | 'unrealizedPnL'>): Promise<void> {
    const activePosition: ActivePosition = {
      ...position,
      currentPrice: position.entryPrice,
      unrealizedPnL: 0,
    };

    this.activePositions.set(position.tokenAddress, activePosition);
    this.totalExposure += position.amount;

    logger.info(
      `   📊 Tracking position: ${position.tokenSymbol} (${position.amount.toFixed(4)} BNB)`
    );
  }

  /**
   * Update position with current price and check stop-loss/take-profit
   */
  async updatePosition(tokenAddress: string, currentPrice: number): Promise<{
    shouldClose: boolean;
    reason?: string;
  }> {
    const position = this.activePositions.get(tokenAddress);

    if (!position) {
      return { shouldClose: false };
    }

    // Update current price
    position.currentPrice = currentPrice;

    // Calculate P&L
    const priceChange = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
    position.unrealizedPnL = (currentPrice - position.entryPrice) * position.amount;

    // Check stop-loss
    if (priceChange <= -this.riskProfile.stopLossPercent) {
      logger.warn(
        `   ⚠️ Stop-loss triggered for ${position.tokenSymbol}: ${priceChange.toFixed(2)}%`
      );
      return {
        shouldClose: true,
        reason: `Stop-loss triggered: ${priceChange.toFixed(2)}%`,
      };
    }

    // Check take-profit
    if (priceChange >= this.riskProfile.takeProfitPercent) {
      logger.info(
        `   ✅ Take-profit triggered for ${position.tokenSymbol}: ${priceChange.toFixed(2)}%`
      );
      return {
        shouldClose: true,
        reason: `Take-profit triggered: ${priceChange.toFixed(2)}%`,
      };
    }

    return { shouldClose: false };
  }

  /**
   * Close a position
   */
  async closePosition(tokenAddress: string): Promise<void> {
    const position = this.activePositions.get(tokenAddress);

    if (!position) {
      logger.warn(`   ⚠️ Position not found: ${tokenAddress}`);
      return;
    }

    this.totalExposure -= position.amount;
    this.activePositions.delete(tokenAddress);

    logger.info(
      `   🔒 Position closed: ${position.tokenSymbol} (P&L: ${position.unrealizedPnL.toFixed(4)} BNB)`
    );
  }

  /**
   * Get all active positions
   */
  getActivePositions(): ActivePosition[] {
    return Array.from(this.activePositions.values());
  }

  /**
   * Alias for getActivePositions for API compatibility
   */
  getOpenPositions(): ActivePosition[] {
    return this.getActivePositions();
  }

  /**
   * Get current risk profile
   */
  getRiskProfile(): RiskProfile {
    return this.riskProfile;
  }

  /**
   * Get portfolio-wide risk metrics
   */
  async getPortfolioRisk(): Promise<{
    totalExposure: number;
    exposurePercent: number;
    activePositions: number;
    maxDrawdown: number;
    currentDrawdown: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }> {
    const currentBalance = this.initialBalance - this.maxDrawdown;
    const exposurePercent = this.initialBalance > 0
      ? (this.totalExposure / this.initialBalance) * 100
      : 0;
    const currentDrawdown = this.initialBalance > 0
      ? ((this.initialBalance - currentBalance) / this.initialBalance) * 100
      : 0;

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (exposurePercent > 70 || currentDrawdown > 20) {
      riskLevel = 'CRITICAL';
    } else if (exposurePercent > 50 || currentDrawdown > 15) {
      riskLevel = 'HIGH';
    } else if (exposurePercent > 30 || currentDrawdown > 10) {
      riskLevel = 'MEDIUM';
    }

    return {
      totalExposure: this.totalExposure,
      exposurePercent,
      activePositions: this.activePositions.size,
      maxDrawdown: this.maxDrawdown,
      currentDrawdown,
      riskLevel,
    };
  }

  /**
   * Get risk manager status
   */
  getStatus() {
    return {
      riskProfile: this.riskProfile,
      activePositions: this.getActivePositions().length,
      totalExposure: this.totalExposure,
      maxDrawdown: this.maxDrawdown,
      initialBalance: this.initialBalance,
    };
  }

  /**
   * Update risk profile
   */
  updateRiskProfile(updates: Partial<RiskProfile>): void {
    this.riskProfile = { ...this.riskProfile, ...updates };
    logger.info('⚙️ Risk profile updated:', updates);
  }
}
