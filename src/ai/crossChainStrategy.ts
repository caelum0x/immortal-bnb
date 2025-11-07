// src/ai/crossChainStrategy.ts
// Cross-chain arbitrage and interoperability for BNB-Solana and other chains
// Part of the immortal AI agent system targeting Unibase sponsor challenge

import { logger } from '../utils/logger';
import { CONFIG } from '../config';
import type { AIPersonality, StrategyEvolution } from './immortalAgent';

export interface CrossChainOpportunity {
  id: string;
  sourceChain: string;
  targetChain: string;
  tokenSymbol: string;
  sourcePrice: number;
  targetPrice: number;
  priceDifference: number; // Percentage difference
  profitPotential: number; // After fees and slippage
  volume24h: number;
  liquidity: {
    source: number;
    target: number;
  };
  bridgeFee: number;
  gasCosts: {
    source: number;
    target: number;
  };
  executionTime: number; // Estimated time in seconds
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
}

export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  dexRouter: string;
  wrapToken: string;
  bridgeContract?: string;
  gasToken: string;
  avgBlockTime: number; // seconds
  avgGasPrice: number; // in native token
}

export class CrossChainArbitrageEngine {
  private chains: Map<string, ChainConfig> = new Map();
  private opportunities: CrossChainOpportunity[] = [];
  private activeArbitrage: Map<string, any> = new Map();

  constructor() {
    this.initializeChains();
    logger.info('🌐 Cross-chain arbitrage engine initialized');
  }

  /**
   * Initialize supported chains for arbitrage
   */
  private initializeChains(): void {
    // BNB Smart Chain
    this.chains.set('bnb', {
      chainId: 56,
      name: 'BNB Smart Chain',
      rpcUrl: 'https://bsc-dataseed.bnbchain.org',
      dexRouter: '0x10ED43C718714eb63d5aA57B78B54704E256024E', // PancakeSwap
      wrapToken: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
      bridgeContract: '0x4B0F1812e5Df2A09796481Ff14017e6005508003', // Example bridge
      gasToken: 'BNB',
      avgBlockTime: 3,
      avgGasPrice: 0.000005 // ~5 gwei
    });

    // opBNB (L2)
    this.chains.set('opbnb', {
      chainId: 204,
      name: 'opBNB',
      rpcUrl: 'https://opbnb-mainnet-rpc.bnbchain.org',
      dexRouter: '0x1b81D678ffb9C0263b24A97847620C99d213eB14',
      wrapToken: '0x4200000000000000000000000000000000000006', // WBNB
      gasToken: 'BNB',
      avgBlockTime: 1,
      avgGasPrice: 0.000001 // Very low gas
    });

    // Solana (for cross-chain arb)
    this.chains.set('solana', {
      chainId: 101,
      name: 'Solana',
      rpcUrl: 'https://api.mainnet-beta.solana.com',
      dexRouter: 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB', // Jupiter
      wrapToken: 'So11111111111111111111111111111111111111112', // SOL
      gasToken: 'SOL',
      avgBlockTime: 0.4,
      avgGasPrice: 0.000005
    });

    // Ethereum (for high-value arb)
    this.chains.set('ethereum', {
      chainId: 1,
      name: 'Ethereum',
      rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
      dexRouter: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3
      wrapToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      gasToken: 'ETH',
      avgBlockTime: 12,
      avgGasPrice: 0.00001 // Varies significantly
    });
  }

  /**
   * Discover cross-chain arbitrage opportunities
   */
  async discoverArbitrageOpportunities(): Promise<CrossChainOpportunity[]> {
    try {
      logger.info('🔍 Scanning cross-chain arbitrage opportunities...');
      
      const opportunities: CrossChainOpportunity[] = [];
      const commonTokens = await this.getCommonTokens();

      for (const token of commonTokens) {
        const chainPrices = await this.getTokenPricesAcrossChains(token);
        
        // Compare all chain pairs
        for (const [sourceChain, sourcePrice] of chainPrices) {
          for (const [targetChain, targetPrice] of chainPrices) {
            if (sourceChain === targetChain) continue;
            
            const opportunity = await this.analyzeArbitrageOpportunity(
              token,
              sourceChain,
              targetChain,
              sourcePrice,
              targetPrice
            );
            
            if (opportunity && opportunity.profitPotential > 2) {
              opportunities.push(opportunity);
            }
          }
        }
      }

      this.opportunities = opportunities.sort((a, b) => b.profitPotential - a.profitPotential);
      
      logger.info(`💰 Found ${opportunities.length} cross-chain arbitrage opportunities`);
      return this.opportunities;
      
    } catch (error) {
      logger.error('Failed to discover arbitrage opportunities:', error);
      return [];
    }
  }

  /**
   * Execute cross-chain arbitrage opportunity
   */
  async executeArbitrage(
    opportunity: CrossChainOpportunity,
    amount: number,
    personality: AIPersonality
  ): Promise<{
    success: boolean;
    txHash?: string;
    profit?: number;
    error?: string;
  }> {
    try {
      logger.info(`🚀 Executing arbitrage: ${opportunity.tokenSymbol} ${opportunity.sourceChain} → ${opportunity.targetChain}`);
      
      // Risk management checks
      if (!this.validateArbitrageRisk(opportunity, amount, personality)) {
        return {
          success: false,
          error: 'Risk validation failed'
        };
      }

      const arbId = `${opportunity.id}_${Date.now()}`;
      this.activeArbitrage.set(arbId, {
        opportunity,
        amount,
        startTime: Date.now(),
        status: 'executing'
      });

      // Step 1: Buy on source chain
      const buyResult = await this.executeTrade(
        opportunity.sourceChain,
        'BUY',
        opportunity.tokenSymbol,
        amount
      );

      if (!buyResult.success) {
        this.activeArbitrage.delete(arbId);
        return {
          success: false,
          error: `Buy failed on ${opportunity.sourceChain}: ${buyResult.error}`
        };
      }

      // Step 2: Bridge tokens to target chain
      const bridgeResult = await this.bridgeTokens(
        opportunity.sourceChain,
        opportunity.targetChain,
        opportunity.tokenSymbol,
        buyResult.amount
      );

      if (!bridgeResult.success) {
        // TODO: Handle failed bridge - may need to sell back on source chain
        this.activeArbitrage.delete(arbId);
        return {
          success: false,
          error: `Bridge failed: ${bridgeResult.error}`
        };
      }

      // Step 3: Sell on target chain
      const sellResult = await this.executeTrade(
        opportunity.targetChain,
        'SELL',
        opportunity.tokenSymbol,
        bridgeResult.amount
      );

      if (!sellResult.success) {
        // TODO: Handle failed sell - tokens stuck on target chain
        this.activeArbitrage.delete(arbId);
        return {
          success: false,
          error: `Sell failed on ${opportunity.targetChain}: ${sellResult.error}`
        };
      }

      const totalProfit = sellResult.amount - amount - opportunity.bridgeFee - 
                         opportunity.gasCosts.source - opportunity.gasCosts.target;

      this.activeArbitrage.delete(arbId);

      logger.info(`✅ Arbitrage completed! Profit: ${totalProfit.toFixed(4)}`);
      
      return {
        success: true,
        txHash: sellResult.txHash,
        profit: totalProfit
      };

    } catch (error) {
      logger.error('Arbitrage execution failed:', error);
      return {
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * Get tokens that exist on multiple chains
   */
  private async getCommonTokens(): Promise<string[]> {
    // Common tokens across chains
    return [
      'USDT',
      'USDC', 
      'ETH',
      'BTC',
      'BNB',
      'CAKE',
      'ADA',
      'MATIC',
      'AVAX',
      'DOT'
    ];
  }

  /**
   * Get token prices across all supported chains
   */
  private async getTokenPricesAcrossChains(token: string): Promise<Map<string, number>> {
    const prices = new Map<string, number>();
    
    for (const [chainName, config] of this.chains) {
      try {
        const price = await this.getTokenPrice(token, chainName);
        if (price > 0) {
          prices.set(chainName, price);
        }
      } catch (error) {
        logger.warn(`Failed to get ${token} price on ${chainName}:`, error);
      }
    }
    
    return prices;
  }

  /**
   * Get token price on specific chain
   */
  private async getTokenPrice(token: string, chain: string): Promise<number> {
    // This would integrate with chain-specific price feeds
    // For now, return mock data with slight variations
    const basePrice = this.getMockBasePrice(token);
    const variation = (Math.random() - 0.5) * 0.05; // ±2.5% variation
    
    return basePrice * (1 + variation);
  }

  /**
   * Mock base prices for testing
   */
  private getMockBasePrice(token: string): number {
    const prices: Record<string, number> = {
      'USDT': 1.0,
      'USDC': 1.0,
      'ETH': 2500,
      'BTC': 45000,
      'BNB': 300,
      'CAKE': 2.5,
      'ADA': 0.5,
      'MATIC': 0.8,
      'AVAX': 25,
      'DOT': 7
    };
    
    return prices[token] || 1;
  }

  /**
   * Analyze arbitrage opportunity between two chains
   */
  private async analyzeArbitrageOpportunity(
    token: string,
    sourceChain: string,
    targetChain: string,
    sourcePrice: number,
    targetPrice: number
  ): Promise<CrossChainOpportunity | null> {
    try {
      const priceDifference = ((targetPrice - sourcePrice) / sourcePrice) * 100;
      
      // Only consider if target price is higher (profit opportunity)
      if (priceDifference <= 0.5) return null; // Minimum 0.5% difference
      
      const sourceConfig = this.chains.get(sourceChain)!;
      const targetConfig = this.chains.get(targetChain)!;
      
      // Estimate costs
      const bridgeFee = this.estimateBridgeFee(sourceChain, targetChain, 1000); // $1000 worth
      const gasCosts = {
        source: sourceConfig.avgGasPrice * 2, // Buy + approve
        target: targetConfig.avgGasPrice * 1  // Sell
      };
      
      const totalCosts = bridgeFee + gasCosts.source + gasCosts.target;
      const grossProfit = priceDifference;
      const netProfit = grossProfit - (totalCosts / 1000) * 100; // Convert to percentage
      
      if (netProfit <= 1) return null; // Minimum 1% net profit
      
      const executionTime = this.estimateExecutionTime(sourceChain, targetChain);
      const riskLevel = this.assessArbitrageRisk(priceDifference, executionTime);
      
      return {
        id: `arb_${token}_${sourceChain}_${targetChain}_${Date.now()}`,
        sourceChain,
        targetChain,
        tokenSymbol: token,
        sourcePrice,
        targetPrice,
        priceDifference,
        profitPotential: netProfit,
        volume24h: 1000000, // Mock volume
        liquidity: {
          source: 500000,
          target: 500000
        },
        bridgeFee,
        gasCosts,
        executionTime,
        riskLevel,
        confidence: this.calculateArbitrageConfidence(priceDifference, executionTime, riskLevel)
      };
      
    } catch (error) {
      logger.warn(`Failed to analyze arbitrage for ${token}:`, error);
      return null;
    }
  }

  /**
   * Estimate bridge fee between chains
   */
  private estimateBridgeFee(sourceChain: string, targetChain: string, amount: number): number {
    // Bridge fees vary by chain pair and amount
    const baseFees: Record<string, Record<string, number>> = {
      'bnb': {
        'ethereum': 0.002, // 0.2%
        'solana': 0.005,   // 0.5%
        'opbnb': 0.0005    // 0.05%
      },
      'ethereum': {
        'bnb': 0.002,
        'solana': 0.008,
        'opbnb': 0.003
      },
      'solana': {
        'bnb': 0.005,
        'ethereum': 0.008,
        'opbnb': 0.006
      },
      'opbnb': {
        'bnb': 0.0005,
        'ethereum': 0.003,
        'solana': 0.006
      }
    };
    
    const feeRate = baseFees[sourceChain]?.[targetChain] || 0.01;
    return amount * feeRate;
  }

  /**
   * Estimate total execution time
   */
  private estimateExecutionTime(sourceChain: string, targetChain: string): number {
    const sourceConfig = this.chains.get(sourceChain)!;
    const targetConfig = this.chains.get(targetChain)!;
    
    // Trade time + bridge time + trade time
    const tradeTime1 = sourceConfig.avgBlockTime * 3; // 3 blocks to confirm
    const bridgeTime = this.estimateBridgeTime(sourceChain, targetChain);
    const tradeTime2 = targetConfig.avgBlockTime * 3;
    
    return tradeTime1 + bridgeTime + tradeTime2;
  }

  /**
   * Estimate bridge time between chains
   */
  private estimateBridgeTime(sourceChain: string, targetChain: string): number {
    // Bridge times in seconds
    const bridgeTimes: Record<string, Record<string, number>> = {
      'bnb': {
        'ethereum': 1800,  // 30 minutes
        'solana': 600,     // 10 minutes
        'opbnb': 60        // 1 minute
      },
      'ethereum': {
        'bnb': 1800,
        'solana': 2400,    // 40 minutes
        'opbnb': 900       // 15 minutes
      },
      'solana': {
        'bnb': 600,
        'ethereum': 2400,
        'opbnb': 900
      },
      'opbnb': {
        'bnb': 60,
        'ethereum': 900,
        'solana': 900
      }
    };
    
    return bridgeTimes[sourceChain]?.[targetChain] || 3600; // Default 1 hour
  }

  /**
   * Assess arbitrage risk level
   */
  private assessArbitrageRisk(priceDifference: number, executionTime: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (executionTime > 3600 || priceDifference < 2) return 'HIGH';
    if (executionTime > 1800 || priceDifference < 5) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Calculate arbitrage confidence score
   */
  private calculateArbitrageConfidence(
    priceDifference: number, 
    executionTime: number, 
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  ): number {
    let confidence = 0.5;
    
    // Price difference factor
    if (priceDifference > 10) confidence += 0.3;
    else if (priceDifference > 5) confidence += 0.2;
    else if (priceDifference > 2) confidence += 0.1;
    
    // Execution time factor
    if (executionTime < 300) confidence += 0.2; // 5 minutes
    else if (executionTime < 900) confidence += 0.1; // 15 minutes
    else if (executionTime > 3600) confidence -= 0.2; // 1 hour
    
    // Risk factor
    if (riskLevel === 'LOW') confidence += 0.1;
    else if (riskLevel === 'HIGH') confidence -= 0.2;
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Validate arbitrage risk against AI personality
   */
  private validateArbitrageRisk(
    opportunity: CrossChainOpportunity, 
    amount: number, 
    personality: AIPersonality
  ): boolean {
    // Check risk tolerance
    const riskScore = {
      'LOW': 0.3,
      'MEDIUM': 0.6,
      'HIGH': 0.9
    }[opportunity.riskLevel];
    
    if (riskScore > personality.riskTolerance) {
      logger.info(`Arbitrage rejected: Risk ${riskScore} > tolerance ${personality.riskTolerance}`);
      return false;
    }
    
    // Check confidence threshold
    if (opportunity.confidence < personality.confidenceThreshold) {
      logger.info(`Arbitrage rejected: Confidence ${opportunity.confidence} < threshold ${personality.confidenceThreshold}`);
      return false;
    }
    
    // Check execution time vs aggressiveness
    const maxExecutionTime = 3600 / (personality.aggressiveness + 0.1); // More aggressive = shorter time tolerance
    if (opportunity.executionTime > maxExecutionTime) {
      logger.info(`Arbitrage rejected: Execution time ${opportunity.executionTime}s > max ${maxExecutionTime}s`);
      return false;
    }
    
    return true;
  }

  /**
   * Execute trade on specific chain (mock implementation)
   */
  private async executeTrade(
    chain: string,
    action: 'BUY' | 'SELL',
    token: string,
    amount: number
  ): Promise<{ success: boolean; amount: number; txHash?: string; error?: string }> {
    try {
      // Mock trade execution
      logger.info(`Executing ${action} ${amount} ${token} on ${chain}`);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate slippage
      const slippage = Math.random() * 0.02; // 0-2%
      const finalAmount = action === 'BUY' ? 
        amount * (1 - slippage) : 
        amount * (1 + slippage);
      
      return {
        success: true,
        amount: finalAmount,
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`
      };
      
    } catch (error) {
      return {
        success: false,
        amount: 0,
        error: String(error)
      };
    }
  }

  /**
   * Bridge tokens between chains (mock implementation)
   */
  private async bridgeTokens(
    sourceChain: string,
    targetChain: string,
    token: string,
    amount: number
  ): Promise<{ success: boolean; amount: number; txHash?: string; error?: string }> {
    try {
      logger.info(`Bridging ${amount} ${token} from ${sourceChain} to ${targetChain}`);
      
      const bridgeTime = this.estimateBridgeTime(sourceChain, targetChain);
      
      // Simulate bridge delay
      await new Promise(resolve => setTimeout(resolve, Math.min(bridgeTime * 10, 10000))); // Max 10s for demo
      
      // Simulate bridge fee
      const bridgeFee = this.estimateBridgeFee(sourceChain, targetChain, amount * 1000) / 1000;
      const finalAmount = amount * (1 - bridgeFee);
      
      return {
        success: true,
        amount: finalAmount,
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`
      };
      
    } catch (error) {
      return {
        success: false,
        amount: 0,
        error: String(error)
      };
    }
  }

  /**
   * Get current arbitrage opportunities
   */
  getOpportunities(): CrossChainOpportunity[] {
    return [...this.opportunities];
  }

  /**
   * Get active arbitrage trades
   */
  getActiveArbitrage(): any[] {
    return Array.from(this.activeArbitrage.values());
  }

  /**
   * Get supported chains
   */
  getSupportedChains(): string[] {
    return Array.from(this.chains.keys());
  }
}

export default CrossChainArbitrageEngine;
