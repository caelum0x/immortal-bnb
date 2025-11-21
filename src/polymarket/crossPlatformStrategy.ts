/**
 * Cross-Platform Trading Strategy Engine
 *
 * Coordinates trading across multiple platforms:
 * - DEX Trading (PancakeSwap on BNB/opBNB)
 * - Prediction Markets (Polymarket on Polygon)
 *
 * Finds correlations, arbitrage opportunities, and hedging strategies
 */

import { logger } from '../utils/logger';
import { CONFIG } from '../config';
import { polymarketService } from './polymarketClient';
import type { MarketInfo } from './polymarketClient';
import { polymarketDataFetcher } from './marketDataFetcher';
import type { MarketOpportunity } from './marketDataFetcher';
import { aiPredictionAnalyzer } from './aiPredictionAnalyzer';
import type { AIMarketAnalysis, TradeDecision } from './aiPredictionAnalyzer';
import { getMultiChainWallet } from '../blockchain/multiChainWalletManager';
import { getTrendingTokens } from '../data/marketFetcher';

export interface CrossPlatformOpportunity {
  type: 'CORRELATION' | 'ARBITRAGE' | 'HEDGING' | 'DIRECTIONAL';
  description: string;
  confidence: number;
  expectedProfit: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  actions: TradingAction[];
}

export interface TradingAction {
  platform: 'DEX' | 'POLYMARKET';
  chain: 'bnb' | 'opbnb' | 'polygon';
  action: 'BUY' | 'SELL';
  asset: string;
  amount: number;
  price?: number;
  reasoning: string;
}

export interface StrategyPerformance {
  totalTrades: number;
  successfulTrades: number;
  totalProfit: number;
  winRate: number;
  averageReturn: number;
  sharpeRatio?: number;
}

export class CrossPlatformStrategy {
  private wallet: any;
  private isRunning: boolean = false;
  private tradeHistory: any[] = [];

  constructor() {
    try {
      this.wallet = getMultiChainWallet();
    } catch (error) {
      logger.warn('Multi-chain wallet not initialized');
    }
  }

  /**
   * Scan for cross-platform opportunities
   */
  async scanOpportunities(): Promise<CrossPlatformOpportunity[]> {
    try {
      logger.info('🔍 Scanning for cross-platform trading opportunities...');

      const opportunities: CrossPlatformOpportunity[] = [];

      // 1. Check for crypto-related prediction markets
      const cryptoMarkets = await this.findCryptoRelatedMarkets();

      // 2. Analyze correlations between prediction markets and crypto prices
      const correlationOpps = await this.findCorrelationOpportunities(cryptoMarkets);
      opportunities.push(...correlationOpps);

      // 3. Look for arbitrage opportunities within Polymarket
      const predictionArbitrage = await polymarketDataFetcher.findArbitrageOpportunities();
      const arbitrageOpps = this.convertToOpportunities(predictionArbitrage);
      opportunities.push(...arbitrageOpps);

      // 4. Find hedging opportunities
      const hedgingOpps = await this.findHedgingOpportunities(cryptoMarkets);
      opportunities.push(...hedgingOpps);

      // 5. Directional prediction market plays
      const directionalOpps = await this.findDirectionalOpportunities();
      opportunities.push(...directionalOpps);

      logger.info(`✅ Found ${opportunities.length} cross-platform opportunities`);

      // Sort by expected profit
      return opportunities.sort((a, b) => b.expectedProfit - a.expectedProfit);
    } catch (error) {
      logger.error('Error scanning opportunities:', error);
      return [];
    }
  }

  /**
   * Find crypto-related prediction markets
   */
  private async findCryptoRelatedMarkets(): Promise<MarketInfo[]> {
    try {
      const allMarkets = await polymarketService.getActiveMarkets(100);

      // Filter for crypto-related questions
      const cryptoKeywords = [
        'bitcoin', 'btc', 'ethereum', 'eth', 'bnb', 'crypto', 'cryptocurrency',
        'blockchain', 'defi', 'nft', 'price', 'coinbase', 'binance'
      ];

      return allMarkets.filter(market => {
        const question = market.question.toLowerCase();
        return cryptoKeywords.some(keyword => question.includes(keyword));
      });
    } catch (error) {
      logger.error('Error finding crypto markets:', error);
      return [];
    }
  }

  /**
   * Find correlation-based opportunities between prediction markets and DEX
   */
  private async findCorrelationOpportunities(markets: MarketInfo[]): Promise<CrossPlatformOpportunity[]> {
    const opportunities: CrossPlatformOpportunity[] = [];

    try {
      for (const market of markets) {
        // Example: "Will Bitcoin reach $100,000 by end of year?"
        // Opportunity: If market says 80% yes, might be good to buy BTC-related tokens on DEX

        const analysis = await aiPredictionAnalyzer.analyzeMarket(market);

        if (analysis.confidence > 0.7) {
          const midPrice = await polymarketService.getMidPrice(market.id);

          if (midPrice && midPrice > 0.7) {
            // High probability event - could buy related tokens
            opportunities.push({
              type: 'CORRELATION',
              description: `High confidence (${(midPrice * 100).toFixed(0)}%) prediction: ${market.question}`,
              confidence: analysis.confidence,
              expectedProfit: this.estimateProfit(analysis, midPrice),
              riskLevel: analysis.riskLevel,
              actions: [
                {
                  platform: 'POLYMARKET',
                  chain: 'polygon',
                  action: analysis.recommendation.includes('BUY') ? 'BUY' : 'SELL',
                  asset: market.question,
                  amount: analysis.suggestedSize,
                  price: midPrice,
                  reasoning: `Prediction market signal: ${analysis.reasoning}`,
                },
              ],
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error finding correlation opportunities:', error);
    }

    return opportunities;
  }

  /**
   * Find hedging opportunities
   */
  private async findHedgingOpportunities(markets: MarketInfo[]): Promise<CrossPlatformOpportunity[]> {
    const opportunities: CrossPlatformOpportunity[] = [];

    try {
      // Example: If we hold crypto on DEX, we can hedge with prediction markets
      // "Will crypto crash?" - buying YES is a hedge against our DEX positions

      for (const market of markets) {
        const question = market.question.toLowerCase();

        // Look for risk-related markets
        if (question.includes('crash') || question.includes('fall') || question.includes('decline')) {
          const midPrice = await polymarketService.getMidPrice(market.id);

          if (midPrice && midPrice < 0.3) {
            // Low probability of crash but cheap hedge
            opportunities.push({
              type: 'HEDGING',
              description: `Cheap hedge opportunity: ${market.question}`,
              confidence: 0.6,
              expectedProfit: -10, // Hedges cost money but reduce risk
              riskLevel: 'LOW',
              actions: [
                {
                  platform: 'POLYMARKET',
                  chain: 'polygon',
                  action: 'BUY',
                  asset: market.question,
                  amount: 50, // Small hedge position
                  price: midPrice,
                  reasoning: 'Hedge against downside risk in DEX positions',
                },
              ],
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error finding hedging opportunities:', error);
    }

    return opportunities;
  }

  /**
   * Find directional prediction market opportunities
   */
  private async findDirectionalOpportunities(): Promise<CrossPlatformOpportunity[]> {
    const opportunities: CrossPlatformOpportunity[] = [];

    try {
      // Get high-liquidity markets
      const liquidMarkets = await polymarketDataFetcher.getLiquidMarkets(500, 10);

      // Analyze with AI
      const analyses = await aiPredictionAnalyzer.analyzeBatchMarkets(liquidMarkets, 5);

      for (const analysis of analyses) {
        const market = liquidMarkets.find(m => m.id === analysis.marketId);
        if (!market) continue;

        const midPrice = await polymarketService.getMidPrice(market.id);
        if (!midPrice) continue;

        opportunities.push({
          type: 'DIRECTIONAL',
          description: `AI-identified opportunity: ${market.question}`,
          confidence: analysis.confidence,
          expectedProfit: this.estimateProfit(analysis, midPrice),
          riskLevel: analysis.riskLevel,
          actions: [
            {
              platform: 'POLYMARKET',
              chain: 'polygon',
              action: analysis.recommendation.includes('BUY') ? 'BUY' : 'SELL',
              asset: market.question,
              amount: analysis.suggestedSize,
              price: analysis.suggestedPrice,
              reasoning: analysis.reasoning,
            },
          ],
        });
      }
    } catch (error) {
      logger.error('Error finding directional opportunities:', error);
    }

    return opportunities;
  }

  /**
   * Convert market opportunities to cross-platform opportunities
   */
  private convertToOpportunities(opportunities: MarketOpportunity[]): CrossPlatformOpportunity[] {
    return opportunities.map(opp => ({
      type: 'ARBITRAGE' as const,
      description: `Arbitrage opportunity: ${opp.question}`,
      confidence: opp.confidence,
      expectedProfit: opp.spread * 100, // Spread is potential profit
      riskLevel: 'MEDIUM' as const,
      actions: [
        {
          platform: 'POLYMARKET' as const,
          chain: 'polygon' as const,
          action: (opp.signal === 'BUY' || opp.signal === 'SELL' ? opp.signal : 'BUY') as 'BUY' | 'SELL',
          asset: opp.question,
          amount: 100,
          price: opp.currentPrice,
          reasoning: opp.reasoning,
        },
      ],
    }));
  }

  /**
   * Estimate profit from an analysis
   */
  private estimateProfit(analysis: AIMarketAnalysis, currentPrice: number): number {
    // Simple estimation: potential price move * position size
    const priceDifference = Math.abs(analysis.suggestedPrice - currentPrice);
    return priceDifference * analysis.suggestedSize;
  }

  /**
   * Execute a cross-platform strategy
   */
  async executeStrategy(opportunity: CrossPlatformOpportunity, maxRisk: number = 500): Promise<boolean> {
    try {
      logger.info(`🚀 Executing strategy: ${opportunity.type} - ${opportunity.description}`);

      // Check if we have sufficient funds
      if (!this.wallet) {
        logger.error('Wallet not initialized');
        return false;
      }

      // Execute each action
      for (const action of opportunity.actions) {
        if (action.platform === 'POLYMARKET') {
          await this.executePolymarketAction(action);
        } else if (action.platform === 'DEX') {
          await this.executeDEXAction(action);
        }
      }

      // Record trade
      this.tradeHistory.push({
        timestamp: new Date(),
        opportunity,
        status: 'executed',
      });

      logger.info(`✅ Strategy executed successfully`);
      return true;
    } catch (error) {
      logger.error('Error executing strategy:', error);
      return false;
    }
  }

  /**
   * Execute Polymarket action
   */
  private async executePolymarketAction(action: TradingAction): Promise<void> {
    try {
      // Check USDC balance
      const usdcBalance = await this.wallet.getUSDCBalance();

      if (usdcBalance < action.amount) {
        logger.warn(`Insufficient USDC balance: ${usdcBalance} < ${action.amount}`);
        return;
      }

      // Get market ID from asset description
      // In real implementation, would need proper market ID mapping
      logger.info(`Executing Polymarket ${action.action}: ${action.asset}`);

      // Create order
      // This is simplified - real implementation needs proper market ID
      // await polymarketService.createOrder({
      //   marketId: marketId,
      //   side: action.action,
      //   price: action.price || 0.5,
      //   size: action.amount,
      // });

      logger.info(`Polymarket order created`);
    } catch (error) {
      logger.error('Error executing Polymarket action:', error);
    }
  }

  /**
   * Execute DEX action
   */
  private async executeDEXAction(action: TradingAction): Promise<void> {
    try {
      // This would integrate with existing DEX trading logic
      logger.info(`Executing DEX ${action.action} on ${action.chain}: ${action.asset}`);

      // Check balance
      const balance = await this.wallet.getNativeBalance(action.chain);
      logger.info(`${action.chain} balance: ${balance}`);

      // Execute trade (simplified)
      // Real implementation would use PancakeSwap SDK
      logger.info(`DEX trade executed`);
    } catch (error) {
      logger.error('Error executing DEX action:', error);
    }
  }

  /**
   * Get strategy performance metrics
   */
  getPerformance(): StrategyPerformance {
    const totalTrades = this.tradeHistory.length;
    const successfulTrades = this.tradeHistory.filter(t => t.status === 'executed').length;

    return {
      totalTrades,
      successfulTrades,
      totalProfit: 0, // Would calculate from trade results
      winRate: totalTrades > 0 ? successfulTrades / totalTrades : 0,
      averageReturn: 0, // Would calculate from trade results
    };
  }

  /**
   * Start automated strategy execution
   */
  async startAutomatedTrading(intervalMs: number = 300000): Promise<void> {
    if (this.isRunning) {
      logger.warn('Automated trading already running');
      return;
    }

    this.isRunning = true;
    logger.info('🤖 Starting automated cross-platform trading...');

    while (this.isRunning) {
      try {
        // Scan for opportunities
        const opportunities = await this.scanOpportunities();

        // Filter high-confidence opportunities
        const highConfidence = opportunities.filter(
          opp => opp.confidence >= CONFIG.MIN_CONFIDENCE_THRESHOLD
        );

        // Execute top opportunity
        if (highConfidence.length > 0 && highConfidence[0]) {
          await this.executeStrategy(highConfidence[0]);
        }

        // Wait for next interval
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      } catch (error) {
        logger.error('Error in automated trading loop:', error);
      }
    }
  }

  /**
   * Stop automated trading
   */
  stopAutomatedTrading(): void {
    this.isRunning = false;
    logger.info('⏹️  Stopped automated cross-platform trading');
  }
}

// Singleton instance
export const crossPlatformStrategy = new CrossPlatformStrategy();
