/**
 * Risk Management Service
 *
 * Provides risk assessment and management tools:
 * - Portfolio risk metrics (exposure, concentration, VaR)
 * - Position sizing calculations
 * - Stop-loss recommendations
 * - Risk/reward analysis
 * - Diversification metrics
 */

import { PrismaClient } from '../../generated/prisma';
import { logger } from '../utils/logger';
import { BotState } from '../bot-state';

const prisma = new PrismaClient();

export interface PositionRisk {
  tokenId: string;
  tokenSymbol: string;
  currentValue: number;
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  riskAmount: number; // Amount at risk if stop-loss hit
  suggestedStopLoss: number;
  riskRewardRatio: number;
  positionSizePercent: number; // % of total portfolio
}

export interface PortfolioRisk {
  totalValue: number;
  totalExposure: number;
  totalUnrealizedPnL: number;
  portfolioVaR: number; // Value at Risk (95% confidence)
  sharpeRatio: number;
  beta: number; // Market correlation
  maxDrawdown: number;
  concentrationRisk: number; // 0-100, higher = more concentrated
  diversificationScore: number; // 0-100, higher = more diversified
  positions: PositionRisk[];
}

export interface RiskRecommendation {
  type: 'REDUCE_POSITION' | 'ADD_STOP_LOSS' | 'REBALANCE' | 'DIVERSIFY' | 'TAKE_PROFIT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  tokenId?: string;
  action?: string;
}

export interface PositionSizingResult {
  recommendedSize: number; // USD amount
  recommendedQuantity: number; // Number of tokens
  maxRisk: number; // USD amount willing to risk
  stopLossPrice: number;
  takeProfitPrice: number;
  riskRewardRatio: number;
  reasoning: string;
}

export class RiskManagementService {
  private readonly DEFAULT_RISK_PER_TRADE = 0.02; // 2% of portfolio per trade
  private readonly MAX_POSITION_SIZE = 0.20; // Max 20% of portfolio in single position
  private readonly MIN_RISK_REWARD_RATIO = 2; // Minimum 2:1 R:R
  private readonly CONCENTRATION_THRESHOLD = 0.25; // Alert if any position > 25%

  /**
   * Get comprehensive portfolio risk analysis
   */
  async getPortfolioRisk(userId?: string): Promise<PortfolioRisk> {
    try {
      // Get current positions from BotState
      const positions = BotState.getPositions();

      if (positions.length === 0) {
        return this.getEmptyPortfolioRisk();
      }

      // Calculate position-level risks
      const positionRisks = positions.map(pos => this.calculatePositionRisk(pos));

      // Calculate portfolio-level metrics
      const totalValue = positions.reduce((sum, p) => sum + p.value, 0);
      const totalExposure = totalValue;
      const totalUnrealizedPnL = positions.reduce((sum, p) => sum + p.pnl, 0);

      // Value at Risk (VaR) - simplified historical method
      const portfolioVaR = this.calculateVaR(positions);

      // Sharpe Ratio - need historical returns
      const sharpeRatio = await this.calculatePortfolioSharpeRatio(userId);

      // Beta - market correlation (simplified)
      const beta = 1.0; // Simplified - would need market data

      // Max Drawdown
      const maxDrawdown = await this.calculateMaxDrawdown(userId);

      // Concentration Risk
      const concentrationRisk = this.calculateConcentrationRisk(positions, totalValue);

      // Diversification Score
      const diversificationScore = this.calculateDiversificationScore(positions);

      return {
        totalValue,
        totalExposure,
        totalUnrealizedPnL,
        portfolioVaR,
        sharpeRatio,
        beta,
        maxDrawdown,
        concentrationRisk,
        diversificationScore,
        positions: positionRisks,
      };

    } catch (error) {
      logger.error('Failed to calculate portfolio risk:', error);
      throw error;
    }
  }

  /**
   * Get risk recommendations based on current portfolio
   */
  async getRiskRecommendations(userId?: string): Promise<RiskRecommendation[]> {
    try {
      const risk = await this.getPortfolioRisk(userId);
      const recommendations: RiskRecommendation[] = [];

      // Check for over-concentrated positions
      risk.positions.forEach(pos => {
        if (pos.positionSizePercent > this.CONCENTRATION_THRESHOLD * 100) {
          recommendations.push({
            type: 'REDUCE_POSITION',
            severity: 'HIGH',
            message: `Position ${pos.tokenSymbol} represents ${pos.positionSizePercent.toFixed(1)}% of portfolio. Consider reducing to below 25%.`,
            tokenId: pos.tokenId,
            action: `Reduce ${pos.tokenSymbol} position size`,
          });
        }

        // Check for missing stop-losses on losing positions
        if (pos.unrealizedPnLPercent < -5 && !pos.suggestedStopLoss) {
          recommendations.push({
            type: 'ADD_STOP_LOSS',
            severity: 'MEDIUM',
            message: `Position ${pos.tokenSymbol} is down ${Math.abs(pos.unrealizedPnLPercent).toFixed(1)}%. Consider adding stop-loss at $${pos.suggestedStopLoss.toFixed(4)}.`,
            tokenId: pos.tokenId,
            action: `Add stop-loss for ${pos.tokenSymbol}`,
          });
        }

        // Check for take-profit opportunities
        if (pos.unrealizedPnLPercent > 20) {
          recommendations.push({
            type: 'TAKE_PROFIT',
            severity: 'LOW',
            message: `Position ${pos.tokenSymbol} is up ${pos.unrealizedPnLPercent.toFixed(1)}%. Consider taking partial profits.`,
            tokenId: pos.tokenId,
            action: `Take profit on ${pos.tokenSymbol}`,
          });
        }
      });

      // Check for poor diversification
      if (risk.diversificationScore < 50) {
        recommendations.push({
          type: 'DIVERSIFY',
          severity: 'MEDIUM',
          message: `Portfolio diversification score is low (${risk.diversificationScore.toFixed(0)}/100). Consider spreading investments across more assets.`,
          action: 'Increase portfolio diversification',
        });
      }

      // Check for high overall portfolio risk
      if (risk.totalUnrealizedPnL < -(risk.totalValue * 0.10)) {
        recommendations.push({
          type: 'REBALANCE',
          severity: 'CRITICAL',
          message: `Portfolio is down ${Math.abs((risk.totalUnrealizedPnL / risk.totalValue) * 100).toFixed(1)}%. Consider rebalancing or reducing exposure.`,
          action: 'Rebalance portfolio',
        });
      }

      return recommendations;

    } catch (error) {
      logger.error('Failed to generate risk recommendations:', error);
      throw error;
    }
  }

  /**
   * Calculate optimal position size for a new trade
   */
  calculatePositionSize(
    portfolioValue: number,
    entryPrice: number,
    stopLossPrice: number,
    riskPercent: number = this.DEFAULT_RISK_PER_TRADE
  ): PositionSizingResult {
    // Calculate risk per share
    const riskPerShare = Math.abs(entryPrice - stopLossPrice);

    // Calculate maximum risk amount
    const maxRisk = portfolioValue * riskPercent;

    // Calculate position size
    const recommendedQuantity = maxRisk / riskPerShare;
    const recommendedSize = recommendedQuantity * entryPrice;

    // Ensure position doesn't exceed max size
    const maxPositionSize = portfolioValue * this.MAX_POSITION_SIZE;
    const finalSize = Math.min(recommendedSize, maxPositionSize);
    const finalQuantity = finalSize / entryPrice;

    // Calculate take-profit (2:1 R:R minimum)
    const riskDistance = Math.abs(entryPrice - stopLossPrice);
    const takeProfitPrice = entryPrice > stopLossPrice
      ? entryPrice + (riskDistance * this.MIN_RISK_REWARD_RATIO)
      : entryPrice - (riskDistance * this.MIN_RISK_REWARD_RATIO);

    const riskRewardRatio = this.MIN_RISK_REWARD_RATIO;

    return {
      recommendedSize: finalSize,
      recommendedQuantity: finalQuantity,
      maxRisk,
      stopLossPrice,
      takeProfitPrice,
      riskRewardRatio,
      reasoning: `Risk ${(riskPercent * 100).toFixed(1)}% ($${ maxRisk.toFixed(2)}) of portfolio. Position size limited to ${(this.MAX_POSITION_SIZE * 100).toFixed(0)}% of portfolio.`,
    };
  }

  /**
   * Calculate risk metrics for a single position
   */
  private calculatePositionRisk(position: any): PositionRisk {
    const unrealizedPnL = position.pnl || 0;
    const unrealizedPnLPercent = position.entryPrice > 0
      ? ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100
      : 0;

    // Suggest stop-loss at 5% below current price for longs
    const suggestedStopLoss = position.currentPrice * 0.95;

    // Risk amount if stop-loss is hit
    const riskAmount = (position.currentPrice - suggestedStopLoss) * position.amount;

    // Risk/reward ratio (simplified)
    const potentialReward = position.currentPrice * 0.10; // Assume 10% target
    const potentialRisk = position.currentPrice - suggestedStopLoss;
    const riskRewardRatio = potentialRisk > 0 ? potentialReward / potentialRisk : 0;

    return {
      tokenId: position.tokenAddress,
      tokenSymbol: position.tokenSymbol,
      currentValue: position.value,
      entryPrice: position.entryPrice,
      currentPrice: position.currentPrice,
      quantity: position.amount,
      unrealizedPnL,
      unrealizedPnLPercent,
      riskAmount,
      suggestedStopLoss,
      riskRewardRatio,
      positionSizePercent: 0, // Will be set later
    };
  }

  /**
   * Calculate Value at Risk (VaR) - 95% confidence
   */
  private calculateVaR(positions: any[]): number {
    // Simplified VaR calculation
    // Assumes normal distribution of returns
    const totalValue = positions.reduce((sum, p) => sum + p.value, 0);

    // Use 5% as potential loss at 95% confidence
    const var95 = totalValue * 0.05;

    return var95;
  }

  /**
   * Calculate portfolio Sharpe Ratio from historical trades
   */
  private async calculatePortfolioSharpeRatio(userId?: string): Promise<number> {
    try {
      const where: any = { status: 'SETTLED' };
      if (userId) where.userId = userId;

      const trades = await (prisma as any).trade.findMany({
        where,
        orderBy: { executedAt: 'desc' },
        take: 100,
      });

      if (trades.length < 10) return 0;

      // Calculate returns
      const returns = trades.map((t: any) => {
        const pnl = (t.avgFillPrice - t.price) * t.filledAmount - t.fee;
        return pnl;
      });

      const avgReturn = returns.reduce((a: number, b: number) => a + b, 0) / returns.length;
      const variance = returns.reduce((sum: number, r: number) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
      const stdDev = Math.sqrt(variance);

      const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

      return sharpeRatio;

    } catch (error) {
      logger.error('Failed to calculate Sharpe ratio:', error);
      return 0;
    }
  }

  /**
   * Calculate maximum drawdown from historical trades
   */
  private async calculateMaxDrawdown(userId?: string): Promise<number> {
    try {
      const where: any = { status: 'SETTLED' };
      if (userId) where.userId = userId;

      const trades = await (prisma as any).trade.findMany({
        where,
        orderBy: { executedAt: 'asc' },
      });

      if (trades.length === 0) return 0;

      let maxDrawdown = 0;
      let peak = 0;
      let runningPL = 0;

      trades.forEach((trade: any) => {
        const pnl = (trade.avgFillPrice - trade.price) * trade.filledAmount - trade.fee;
        runningPL += pnl;

        if (runningPL > peak) peak = runningPL;

        const drawdown = peak > 0 ? ((peak - runningPL) / peak) * 100 : 0;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      });

      return maxDrawdown;

    } catch (error) {
      logger.error('Failed to calculate max drawdown:', error);
      return 0;
    }
  }

  /**
   * Calculate concentration risk (0-100, higher = more concentrated)
   */
  private calculateConcentrationRisk(positions: any[], totalValue: number): number {
    if (positions.length === 0) return 0;
    if (totalValue === 0) return 0;

    // Calculate Herfindahl-Hirschman Index (HHI)
    const hhi = positions.reduce((sum, pos) => {
      const weight = pos.value / totalValue;
      return sum + (weight * weight);
    }, 0);

    // Convert to 0-100 scale (HHI ranges from 1/n to 1)
    const concentrationRisk = hhi * 100;

    return concentrationRisk;
  }

  /**
   * Calculate diversification score (0-100, higher = better diversified)
   */
  private calculateDiversificationScore(positions: any[]): number {
    if (positions.length === 0) return 0;

    // Base score on number of positions
    const baseScore = Math.min(positions.length * 10, 50);

    // Bonus for even distribution
    const totalValue = positions.reduce((sum, p) => sum + p.value, 0);
    const avgValue = totalValue / positions.length;

    const variance = positions.reduce((sum, p) => {
      return sum + Math.pow(p.value - avgValue, 2);
    }, 0) / positions.length;

    const stdDev = Math.sqrt(variance);
    const cvPercent = avgValue > 0 ? (stdDev / avgValue) * 100 : 0;

    // Lower CV = more even distribution = higher bonus
    const distributionBonus = Math.max(0, 50 - cvPercent);

    const score = Math.min(baseScore + distributionBonus, 100);

    return score;
  }

  /**
   * Get empty portfolio risk structure
   */
  private getEmptyPortfolioRisk(): PortfolioRisk {
    return {
      totalValue: 0,
      totalExposure: 0,
      totalUnrealizedPnL: 0,
      portfolioVaR: 0,
      sharpeRatio: 0,
      beta: 1.0,
      maxDrawdown: 0,
      concentrationRisk: 0,
      diversificationScore: 0,
      positions: [],
    };
  }
}

// Singleton instance
let riskManagementService: RiskManagementService | null = null;

/**
 * Get risk management service instance
 */
export function getRiskManagementService(): RiskManagementService {
  if (!riskManagementService) {
    riskManagementService = new RiskManagementService();
  }
  return riskManagementService;
}

export default RiskManagementService;
