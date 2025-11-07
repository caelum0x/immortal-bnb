// src/ai/immortalAgent.ts
// Core immortal AI agent that learns and evolves trading strategies
// Uses decentralized memory (BNB Greenfield) and AI models for decision making

import { logger } from '../utils/logger';
import { CONFIG } from '../config';
import { fetchAllMemories, fetchMemory, storeMemory } from '../blockchain/memoryStorage';
import DynamicTokenDiscovery from '../blockchain/dynamicTokenDiscovery';
import type { TradeMemory } from '../types/memory';
import { getAIDecision } from './llmInterface';

export interface ExtendedTradeMemory {
  id: string;
  timestamp: number;
  tokenSymbol: string;
  tokenAddress: string;
  action: 'BUY' | 'SELL';
  amount: number;
  entryPrice: number;
  exitPrice?: number;
  outcome: 'profit' | 'loss' | 'pending';
  profitLoss?: number;
  confidence: number;
  strategy: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  lessons: string[];
  aiReasoning: string;
  marketConditions: {
    volume24h: number;
    liquidity: number;
    priceChange24h: number;
    marketTrend: 'bullish' | 'bearish' | 'sideways';
    buySellPressure: number;
  };
}

export interface AIPersonality {
  riskTolerance: number; // 0-1 scale
  aggressiveness: number; // 0-1 scale
  learningRate: number; // How quickly to adapt strategies
  memoryWeight: number; // How much to weight past experiences
  explorationRate: number; // How much to try new strategies vs exploit known good ones
  confidenceThreshold: number; // Minimum confidence to execute trades
}

export interface StrategyEvolution {
  strategyId: string;
  name: string;
  successRate: number;
  avgReturn: number;
  totalTrades: number;
  lastUsed: number;
  conditions: string; // Market conditions where this strategy works
  parameters: Record<string, number>;
  performance: {
    shortTerm: number; // 7-day performance
    mediumTerm: number; // 30-day performance
    longTerm: number; // 90-day performance
  };
}

export class ImmortalAIAgent {
  private personality: AIPersonality;
  private memories: Map<string, ExtendedTradeMemory> = new Map();
  private strategies: Map<string, StrategyEvolution> = new Map();
  private discovery: DynamicTokenDiscovery;
  private totalTrades: number = 0;
  private successfulTrades: number = 0;
  private currentStrategies: string[] = [];

  constructor() {
    this.personality = this.initializePersonality();
    this.discovery = new DynamicTokenDiscovery();
    logger.info('🤖 Immortal AI Agent initialized');
  }

  /**
   * Initialize AI personality with default values that evolve over time
   */
  private initializePersonality(): AIPersonality {
    return {
      riskTolerance: 0.5,
      aggressiveness: 0.3,
      learningRate: 0.1,
      memoryWeight: 0.7,
      explorationRate: 0.2,
      confidenceThreshold: 0.6
    };
  }

  /**
   * Load all memories from decentralized storage (BNB Greenfield)
   */
  async loadMemories(): Promise<void> {
    try {
      logger.info('🧠 Loading immortal memories from Greenfield...');
      
      const memoryIds = await fetchAllMemories();
      let loadedCount = 0;

      for (const id of memoryIds) {
        const memory = await fetchMemory(id);
        if (memory) {
          const tradeMemory: ExtendedTradeMemory = {
            id,
            timestamp: memory.timestamp,
            tokenSymbol: memory.tokenSymbol,
            tokenAddress: memory.tokenAddress || '',
            action: memory.action.toUpperCase() as 'BUY' | 'SELL',
            amount: memory.amount,
            entryPrice: memory.entryPrice,
            exitPrice: memory.exitPrice,
            outcome: memory.outcome || 'pending',
            profitLoss: memory.profitLoss,
            confidence: 0.5, // Default confidence for legacy memories
            marketConditions: {
              ...memory.marketConditions,
              marketTrend: 'sideways' // Default trend for legacy memories
            },
            aiReasoning: memory.aiReasoning || '',
            strategy: 'legacy', // Default strategy for legacy memories
            riskLevel: 'MEDIUM', // Default risk level for legacy memories
            lessons: typeof memory.lessons === 'string' ? [memory.lessons] : []
          };
          
          this.memories.set(id, tradeMemory);
          loadedCount++;
        }
      }

      this.totalTrades = this.memories.size;
      this.successfulTrades = Array.from(this.memories.values())
        .filter(m => m.outcome === 'profit').length;

      logger.info(`✅ Loaded ${loadedCount} immortal memories`);
      logger.info(`📊 Success rate: ${this.getSuccessRate().toFixed(1)}%`);
      
      // Evolve personality based on past performance
      await this.evolvePersonality();
      
    } catch (error) {
      logger.error('Failed to load memories:', error);
    }
  }

  /**
   * Make an intelligent trading decision using AI and past memories
   */
  async makeDecision(
    tokenAddress: string, 
    marketData: any,
    availableAmount: number
  ): Promise<{
    action: 'BUY' | 'SELL' | 'HOLD';
    amount: number;
    confidence: number;
    reasoning: string;
    strategy: string;
  }> {
    try {
      // Analyze similar past trades
      const similarMemories = this.findSimilarSituations(tokenAddress, marketData);
      
      // Get current token analysis
      const tokenAnalysis = await this.analyzeToken(tokenAddress, marketData);
      
      // Build context for AI decision
      const context = this.buildDecisionContext(tokenAnalysis, similarMemories, marketData);
      
      // Get AI decision using LLM
      const aiDecision = await getAIDecision(context, this.personality);
      
      // Apply personality and risk management
      const finalDecision = this.applyPersonalityFilter(aiDecision, availableAmount);
      
      logger.info(`🧠 AI Decision: ${finalDecision.action} ${finalDecision.amount} (${finalDecision.confidence}%)`);
      logger.info(`📝 Reasoning: ${finalDecision.reasoning}`);
      
      return finalDecision;
      
    } catch (error) {
      logger.error('AI decision failed:', error);
      return {
        action: 'HOLD',
        amount: 0,
        confidence: 0,
        reasoning: 'Error in AI decision process',
        strategy: 'error'
      };
    }
  }

  /**
   * Learn from a completed trade and store in immortal memory
   */
  async learnFromTrade(
    tokenSymbol: string,
    tokenAddress: string,
    action: 'BUY' | 'SELL',
    amount: number,
    entryPrice: number,
    exitPrice: number,
    marketConditions: any,
    strategy: string
  ): Promise<void> {
    try {
      const outcome = exitPrice > entryPrice ? 'profit' : 'loss';
      const profitLoss = ((exitPrice - entryPrice) / entryPrice) * 100;
      
      // Extract lessons from this trade
      const lessons = await this.extractLessons(
        outcome, profitLoss, marketConditions, strategy
      );
      
      const extendedMemory: ExtendedTradeMemory = {
        id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        tokenSymbol,
        tokenAddress,
        action,
        amount,
        entryPrice,
        exitPrice,
        outcome,
        profitLoss,
        confidence: 0.8, // Will be calculated based on decision confidence
        marketConditions: {
          ...marketConditions,
          marketTrend: marketConditions.marketTrend || 'sideways',
          buySellPressure: marketConditions.buySellPressure || 0
        },
        aiReasoning: `AI executed ${action} based on ${strategy} strategy`,
        strategy,
        riskLevel: this.classifyRiskLevel(amount, profitLoss),
        lessons
      };
      
      // Store in local memory
      this.memories.set(extendedMemory.id, extendedMemory);
      
      // Store in immortal decentralized memory (BNB Greenfield)
      const basicMemory: TradeMemory = {
        id: extendedMemory.id,
        timestamp: extendedMemory.timestamp,
        tokenAddress: extendedMemory.tokenAddress,
        tokenSymbol: extendedMemory.tokenSymbol,
        action: action.toLowerCase() as 'buy' | 'sell',
        entryPrice: extendedMemory.entryPrice,
        exitPrice: extendedMemory.exitPrice,
        amount: extendedMemory.amount,
        outcome: extendedMemory.outcome,
        profitLoss: extendedMemory.profitLoss,
        aiReasoning: extendedMemory.aiReasoning,
        marketConditions: {
          volume24h: marketConditions.volume24h || 0,
          liquidity: marketConditions.liquidity || 0,
          priceChange24h: marketConditions.priceChange24h || 0,
          buySellPressure: marketConditions.buySellPressure || 0
        },
        lessons: lessons.join('; ')
      };
      
      await storeMemory(basicMemory);
      
      // Update statistics
      this.totalTrades++;
      if (outcome === 'profit') {
        this.successfulTrades++;
      }
      
      // Evolve strategies based on new data
      await this.evolveStrategies(extendedMemory);
      
      logger.info(`🧠 Learned from ${outcome} trade: ${profitLoss.toFixed(2)}%`);
      logger.info(`📚 Lessons: ${lessons.join(', ')}`);
      
    } catch (error) {
      logger.error('Failed to learn from trade:', error);
    }
  }

  /**
   * Find similar trading situations from past memories
   */
  private findSimilarSituations(tokenAddress: string, marketData: any): ExtendedTradeMemory[] {
    const similarities: { memory: ExtendedTradeMemory; score: number }[] = [];
    
    for (const memory of this.memories.values()) {
      let similarity = 0;
      
      // Similar market conditions (volume, liquidity, price change)
      if (marketData.volume24h && memory.marketConditions.volume24h) {
        const volumeRatio = Math.min(
          marketData.volume24h / memory.marketConditions.volume24h,
          memory.marketConditions.volume24h / marketData.volume24h
        );
        similarity += volumeRatio * 0.3;
      }
      
      if (marketData.priceChange24h && memory.marketConditions.priceChange24h) {
        const priceChangeScore = Math.max(0, 1 - Math.abs(
          marketData.priceChange24h - memory.marketConditions.priceChange24h
        ) / 100);
        similarity += priceChangeScore * 0.4;
      }
      
      // Same token gets extra weight
      if (memory.tokenAddress === tokenAddress) {
        similarity += 0.5;
      }
      
      // Recent memories are more relevant
      const age = Date.now() - memory.timestamp;
      const ageScore = Math.max(0, 1 - age / (30 * 24 * 60 * 60 * 1000)); // 30 days
      similarity += ageScore * 0.2;
      
      if (similarity > 0.3) {
        similarities.push({ memory, score: similarity });
      }
    }
    
    return similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => s.memory);
  }

  /**
   * Analyze token using AI and technical indicators
   */
  private async analyzeToken(tokenAddress: string, marketData: any): Promise<any> {
    try {
      // Use existing token discovery for detailed analysis
      const tokenAnalysis = await this.discovery.analyzeToken(tokenAddress);
      
      // Add AI-driven technical analysis
      const technicalScore = this.calculateTechnicalScore(marketData);
      const sentimentScore = await this.analyzeSentiment(tokenAddress);
      
      return {
        ...tokenAnalysis,
        technicalScore,
        sentimentScore,
        aiConfidence: (tokenAnalysis.confidence + technicalScore + sentimentScore) / 3
      };
    } catch (error) {
      logger.warn(`Token analysis failed for ${tokenAddress}:`, error);
      return { confidence: 0.3 };
    }
  }

  /**
   * Calculate technical analysis score
   */
  private calculateTechnicalScore(marketData: any): number {
    let score = 0.5; // Neutral start
    
    // Volume analysis
    if (marketData.volume24h > 1000000) score += 0.1;
    if (marketData.volume24h > 10000000) score += 0.1;
    
    // Liquidity analysis
    if (marketData.liquidity > 500000) score += 0.1;
    if (marketData.liquidity > 5000000) score += 0.1;
    
    // Price momentum
    if (marketData.priceChange24h > 5) score += 0.1;
    if (marketData.priceChange24h > 20) score += 0.1;
    if (marketData.priceChange24h < -10) score -= 0.2;
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Analyze market sentiment (placeholder for now)
   */
  private async analyzeSentiment(tokenAddress: string): Promise<number> {
    // TODO: Implement sentiment analysis using social media APIs, news, etc.
    return 0.5;
  }

  /**
   * Build context for AI decision making
   */
  private buildDecisionContext(tokenAnalysis: any, similarMemories: ExtendedTradeMemory[], marketData: any): string {
    const context = `
Market Analysis:
- Token: ${tokenAnalysis.symbol || 'Unknown'}
- Price: $${marketData.price || 0}
- 24h Change: ${marketData.priceChange24h || 0}%
- Volume: $${marketData.volume24h || 0}
- Liquidity: $${marketData.liquidity || 0}
- AI Confidence: ${tokenAnalysis.aiConfidence || 0.5}

Past Similar Trades (${similarMemories.length}):
${similarMemories.map(m => 
  `- ${m.tokenSymbol}: ${m.action} → ${m.outcome} (${m.profitLoss?.toFixed(2) || 0}%)`
).join('\n')}

Current Performance:
- Total Trades: ${this.totalTrades}
- Success Rate: ${this.getSuccessRate().toFixed(1)}%
- Risk Tolerance: ${this.personality.riskTolerance}
- Aggressiveness: ${this.personality.aggressiveness}

Market Conditions: ${marketData.marketTrend || 'Unknown'}
`;
    
    return context;
  }

  /**
   * Apply personality traits to filter AI decisions
   */
  private applyPersonalityFilter(aiDecision: any, availableAmount: number): any {
    let finalAmount = aiDecision.amount || 0;
    let finalConfidence = aiDecision.confidence || 0;
    
    // Apply risk tolerance
    finalAmount *= this.personality.riskTolerance;
    
    // Apply aggressiveness to confidence requirement
    const requiredConfidence = this.personality.confidenceThreshold * 
      (1 - this.personality.aggressiveness * 0.3);
    
    if (finalConfidence < requiredConfidence) {
      return {
        action: 'HOLD',
        amount: 0,
        confidence: finalConfidence,
        reasoning: `Confidence ${finalConfidence.toFixed(2)} below threshold ${requiredConfidence.toFixed(2)}`,
        strategy: 'conservative'
      };
    }
    
    // Limit to available amount
    finalAmount = Math.min(finalAmount, availableAmount);
    
    return {
      ...aiDecision,
      amount: finalAmount,
      confidence: finalConfidence
    };
  }

  /**
   * Extract lessons from completed trades
   */
  private async extractLessons(
    outcome: string, 
    profitLoss: number, 
    marketConditions: any, 
    strategy: string
  ): Promise<string[]> {
    const lessons: string[] = [];
    
    if (outcome === 'profit') {
      lessons.push(`${strategy} strategy worked well in ${marketConditions.marketTrend} market`);
      if (profitLoss > 10) {
        lessons.push('High profit suggests good entry timing');
      }
    } else {
      lessons.push(`${strategy} strategy failed in ${marketConditions.marketTrend} market`);
      if (profitLoss < -10) {
        lessons.push('High loss suggests poor risk management');
      }
    }
    
    if (marketConditions.volume24h > 10000000) {
      lessons.push(`High volume (${marketConditions.volume24h}) provided ${outcome === 'profit' ? 'good' : 'poor'} liquidity`);
    }
    
    return lessons;
  }

  /**
   * Classify risk level of a trade
   */
  private classifyRiskLevel(amount: number, profitLoss: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (amount < 0.01 || Math.abs(profitLoss) < 5) return 'LOW';
    if (amount < 0.1 || Math.abs(profitLoss) < 15) return 'MEDIUM';
    return 'HIGH';
  }

  /**
   * Evolve AI personality based on performance
   */
  private async evolvePersonality(): Promise<void> {
    if (this.totalTrades < 10) return; // Need enough data
    
    const successRate = this.getSuccessRate();
    const recentTrades = Array.from(this.memories.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);
    
    const avgReturn = recentTrades.reduce((sum, trade) => 
      sum + (trade.profitLoss || 0), 0) / recentTrades.length;
    
    // Adjust risk tolerance based on performance
    if (successRate > 70 && avgReturn > 5) {
      this.personality.riskTolerance = Math.min(0.8, this.personality.riskTolerance + 0.1);
    } else if (successRate < 40 || avgReturn < -5) {
      this.personality.riskTolerance = Math.max(0.2, this.personality.riskTolerance - 0.1);
    }
    
    // Adjust aggressiveness
    if (successRate > 60) {
      this.personality.aggressiveness = Math.min(0.7, this.personality.aggressiveness + 0.05);
    } else {
      this.personality.aggressiveness = Math.max(0.1, this.personality.aggressiveness - 0.05);
    }
    
    logger.info('🧬 AI personality evolved:');
    logger.info(`  Risk Tolerance: ${this.personality.riskTolerance.toFixed(2)}`);
    logger.info(`  Aggressiveness: ${this.personality.aggressiveness.toFixed(2)}`);
  }

  /**
   * Evolve trading strategies based on performance
   */
  private async evolveStrategies(newMemory: ExtendedTradeMemory): Promise<void> {
    const strategyId = newMemory.strategy;
    
    if (this.strategies.has(strategyId)) {
      const strategy = this.strategies.get(strategyId)!;
      strategy.totalTrades++;
      
      if (newMemory.outcome === 'profit') {
        strategy.successRate = (strategy.successRate * (strategy.totalTrades - 1) + 1) / strategy.totalTrades;
        strategy.avgReturn = (strategy.avgReturn * (strategy.totalTrades - 1) + (newMemory.profitLoss || 0)) / strategy.totalTrades;
      } else {
        strategy.successRate = (strategy.successRate * (strategy.totalTrades - 1)) / strategy.totalTrades;
        strategy.avgReturn = (strategy.avgReturn * (strategy.totalTrades - 1) + (newMemory.profitLoss || 0)) / strategy.totalTrades;
      }
      
      strategy.lastUsed = Date.now();
      this.strategies.set(strategyId, strategy);
    } else {
      // Create new strategy
      const strategy: StrategyEvolution = {
        strategyId,
        name: strategyId,
        successRate: newMemory.outcome === 'profit' ? 1 : 0,
        avgReturn: newMemory.profitLoss || 0,
        totalTrades: 1,
        lastUsed: Date.now(),
        conditions: `Market: ${newMemory.marketConditions.marketTrend}`,
        parameters: {},
        performance: {
          shortTerm: newMemory.profitLoss || 0,
          mediumTerm: 0,
          longTerm: 0
        }
      };
      this.strategies.set(strategyId, strategy);
    }
  }

  /**
   * Analyze all stored memories and provide insights
   */
  async analyzeMemories(): Promise<{
    totalTrades: number;
    winRate: number;
    avgProfitLoss: number;
    bestToken: string | null;
    worstToken: string | null;
    insights: string[];
  }> {
    await this.loadMemories();
    
    const memories = Array.from(this.memories.values());
    if (memories.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        avgProfitLoss: 0,
        bestToken: null,
        worstToken: null,
        insights: ['No trading memories found. Start trading to build experience.']
      };
    }

    const profits = memories.filter(m => m.outcome === 'profit');
    const losses = memories.filter(m => m.outcome === 'loss');
    const winRate = (profits.length / memories.length) * 100;
    
    const avgProfitLoss = memories.reduce((sum, m) => sum + (m.profitLoss || 0), 0) / memories.length;
    
    // Token performance analysis
    const tokenPerformance = new Map<string, { total: number; count: number }>();
    memories.forEach(memory => {
      const current = tokenPerformance.get(memory.tokenSymbol) || { total: 0, count: 0 };
      tokenPerformance.set(memory.tokenSymbol, {
        total: current.total + (memory.profitLoss || 0),
        count: current.count + 1
      });
    });
    
    let bestToken: string | null = null;
    let worstToken: string | null = null;
    let bestPerformance = -Infinity;
    let worstPerformance = Infinity;
    
    for (const [token, data] of tokenPerformance) {
      const avgPerformance = data.total / data.count;
      if (avgPerformance > bestPerformance) {
        bestPerformance = avgPerformance;
        bestToken = token;
      }
      if (avgPerformance < worstPerformance) {
        worstPerformance = avgPerformance;
        worstToken = token;
      }
    }
    
    // Generate insights
    const insights: string[] = [];
    
    if (winRate > 70) {
      insights.push('Excellent win rate! Your strategies are performing very well.');
    } else if (winRate > 50) {
      insights.push('Good win rate. Consider optimizing entry/exit timing.');
    } else {
      insights.push('Win rate below 50%. Review and adjust trading strategies.');
    }
    
    if (avgProfitLoss > 5) {
      insights.push('Strong average returns. Maintain current risk management.');
    } else if (avgProfitLoss > 0) {
      insights.push('Positive returns but room for improvement. Consider higher conviction trades.');
    } else {
      insights.push('Negative average returns. Review risk management and strategy selection.');
    }
    
    if (bestToken && bestPerformance > 10) {
      insights.push(`${bestToken} has been your most profitable token (${bestPerformance.toFixed(2)}% avg).`);
    }
    
    if (worstToken && worstPerformance < -5) {
      insights.push(`Avoid or be more cautious with ${worstToken} (${worstPerformance.toFixed(2)}% avg loss).`);
    }
    
    return {
      totalTrades: memories.length,
      winRate,
      avgProfitLoss,
      bestToken,
      worstToken,
      insights
    };
  }

  /**
   * Get current trading strategy configuration
   */
  getCurrentStrategy(): {
    riskTolerance: number;
    aggressiveness: number;
    confidenceThreshold: number;
    activeStrategies: string[];
    totalStrategies: number;
  } {
    return {
      riskTolerance: this.personality.riskTolerance,
      aggressiveness: this.personality.aggressiveness,
      confidenceThreshold: this.personality.confidenceThreshold,
      activeStrategies: this.currentStrategies,
      totalStrategies: this.strategies.size
    };
  }

  /**
   * Get current success rate
   */
  getSuccessRate(): number {
    return this.totalTrades > 0 ? (this.successfulTrades / this.totalTrades) * 100 : 0;
  }

  /**
   * Get AI personality for external access
   */
  getPersonality(): AIPersonality {
    return { ...this.personality };
  }

  /**
   * Get current strategies
   */
  getStrategies(): StrategyEvolution[] {
    return Array.from(this.strategies.values())
      .sort((a, b) => b.successRate - a.successRate);
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): {
    totalMemories: number;
    successRate: number;
    totalTrades: number;
    avgReturn: number;
    topStrategies: StrategyEvolution[];
  } {
    const memories = Array.from(this.memories.values());
    const avgReturn = memories.reduce((sum, m) => sum + (m.profitLoss || 0), 0) / memories.length;
    
    return {
      totalMemories: memories.length,
      successRate: this.getSuccessRate(),
      totalTrades: this.totalTrades,
      avgReturn: avgReturn || 0,
      topStrategies: this.getStrategies().slice(0, 5)
    };
  }
}

export default ImmortalAIAgent;
