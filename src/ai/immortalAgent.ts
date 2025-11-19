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
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
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
        strategy: 'error',
        riskLevel: 'MEDIUM'
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
    
    // Calculate volatility of returns
    const returnVariance = recentTrades.reduce((sum, trade) => {
      const deviation = (trade.profitLoss || 0) - avgReturn;
      return sum + (deviation * deviation);
    }, 0) / recentTrades.length;
    const volatility = Math.sqrt(returnVariance);
    
    // Advanced risk tolerance adjustment based on Sharpe-like ratio
    const riskAdjustedReturn = avgReturn / (volatility || 1);
    
    // Adjust risk tolerance based on performance
    if (successRate > 70 && avgReturn > 5 && riskAdjustedReturn > 1) {
      // Great performance with good risk management
      this.personality.riskTolerance = Math.min(0.8, this.personality.riskTolerance + 0.1);
      this.personality.aggressiveness = Math.min(0.7, this.personality.aggressiveness + 0.05);
      logger.info('📈 Increasing risk tolerance due to strong performance');
    } else if (successRate < 40 || avgReturn < -5 || riskAdjustedReturn < -0.5) {
      // Poor performance or high risk
      this.personality.riskTolerance = Math.max(0.2, this.personality.riskTolerance - 0.1);
      this.personality.aggressiveness = Math.max(0.1, this.personality.aggressiveness - 0.05);
      logger.info('📉 Decreasing risk tolerance due to poor performance');
    }
    
    // Adjust learning rate based on consistency
    if (volatility < 5) {
      // Low volatility = consistent performance = can learn faster
      this.personality.learningRate = Math.min(0.3, this.personality.learningRate + 0.05);
    } else if (volatility > 15) {
      // High volatility = inconsistent = learn slower
      this.personality.learningRate = Math.max(0.05, this.personality.learningRate - 0.05);
    }
    
    // Adjust exploration vs exploitation
    if (this.strategies.size < 5 || successRate < 50) {
      // Need more strategies or current ones aren't working
      this.personality.explorationRate = Math.min(0.4, this.personality.explorationRate + 0.05);
    } else if (successRate > 65) {
      // Good strategies exist, exploit them more
      this.personality.explorationRate = Math.max(0.1, this.personality.explorationRate - 0.05);
    }
    
    // Adjust confidence threshold dynamically
    if (successRate > 70) {
      // Can be more lenient with confidence
      this.personality.confidenceThreshold = Math.max(0.5, this.personality.confidenceThreshold - 0.05);
    } else if (successRate < 50) {
      // Need higher confidence to trade
      this.personality.confidenceThreshold = Math.min(0.8, this.personality.confidenceThreshold + 0.05);
    }
    
    logger.info('🧬 Enhanced AI personality evolution:');
    logger.info(`  Risk Tolerance: ${this.personality.riskTolerance.toFixed(2)} (${riskAdjustedReturn > 1 ? '↑' : '↓'})`);
    logger.info(`  Aggressiveness: ${this.personality.aggressiveness.toFixed(2)}`);
    logger.info(`  Learning Rate: ${this.personality.learningRate.toFixed(2)}`);
    logger.info(`  Exploration Rate: ${this.personality.explorationRate.toFixed(2)}`);
    logger.info(`  Confidence Threshold: ${this.personality.confidenceThreshold.toFixed(2)}`);
    logger.info(`  Risk-Adjusted Return: ${riskAdjustedReturn.toFixed(2)}`);
  }

  /**
   * Advanced RAG-based decision making with retrieval augmented generation
   * Retrieves similar past experiences and augments AI decision with this context
   */
  async makeDecisionWithRAG(
    tokenAddress: string,
    marketData: any,
    availableAmount: number,
    externalContext?: {
      news?: string[];
      socialSentiment?: number;
      onChainMetrics?: any;
    }
  ): Promise<{
    action: 'BUY' | 'SELL' | 'HOLD';
    amount: number;
    confidence: number;
    reasoning: string;
    strategy: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    retrievedContext: ExtendedTradeMemory[];
  }> {
    try {
      logger.info('🔍 Starting RAG-based decision making...');
      
      // RETRIEVAL: Find similar past situations
      const similarMemories = this.findSimilarSituations(tokenAddress, marketData);
      logger.info(`📚 Retrieved ${similarMemories.length} similar memories`);
      
      // Analyze patterns in retrieved memories
      const memoryInsights = this.analyzeRetrievedMemories(similarMemories);
      
      // Get current token analysis
      const tokenAnalysis = await this.analyzeToken(tokenAddress, marketData);
      
      // AUGMENTATION: Build enhanced context with retrieved memories
      const augmentedContext = this.buildRAGContext(
        tokenAnalysis,
        similarMemories,
        memoryInsights,
        marketData,
        externalContext
      );
      
      // GENERATION: Get AI decision using augmented context
      const aiDecision = await getAIDecision(augmentedContext, this.personality);
      
      // Calculate confidence based on memory patterns
      const enhancedConfidence = this.calculateRAGConfidence(
        aiDecision,
        similarMemories,
        memoryInsights
      );
      
      // Apply personality and risk management
      const finalDecision = this.applyPersonalityFilter(
        { ...aiDecision, confidence: enhancedConfidence },
        availableAmount
      );
      
      logger.info(`🧠 RAG Decision: ${finalDecision.action} ${finalDecision.amount} (${finalDecision.confidence.toFixed(2)})`);
      logger.info(`📝 Strategy: ${finalDecision.strategy} | Risk: ${finalDecision.riskLevel}`);
      logger.info(`🎯 Memory-Enhanced Confidence: ${enhancedConfidence.toFixed(2)}`);
      
      return {
        ...finalDecision,
        retrievedContext: similarMemories
      };
      
    } catch (error) {
      logger.error('RAG decision failed:', error);
      return {
        action: 'HOLD',
        amount: 0,
        confidence: 0,
        reasoning: 'Error in RAG decision process',
        strategy: 'error',
        riskLevel: 'MEDIUM',
        retrievedContext: []
      };
    }
  }

  /**
   * Analyze patterns in retrieved memories for insights
   */
  private analyzeRetrievedMemories(memories: ExtendedTradeMemory[]): {
    successRate: number;
    avgReturn: number;
    dominantStrategy: string;
    riskDistribution: Record<string, number>;
    marketTrendSuccess: Record<string, number>;
    confidenceCorrelation: number;
  } {
    if (memories.length === 0) {
      return {
        successRate: 0,
        avgReturn: 0,
        dominantStrategy: 'unknown',
        riskDistribution: {},
        marketTrendSuccess: {},
        confidenceCorrelation: 0
      };
    }
    
    const profitable = memories.filter(m => m.outcome === 'profit');
    const successRate = profitable.length / memories.length;
    const avgReturn = memories.reduce((sum, m) => sum + (m.profitLoss || 0), 0) / memories.length;
    
    // Find dominant strategy
    const strategyCounts = new Map<string, number>();
    memories.forEach(m => {
      strategyCounts.set(m.strategy, (strategyCounts.get(m.strategy) || 0) + 1);
    });
    const dominantStrategy = Array.from(strategyCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
    
    // Risk distribution
    const riskDistribution: Record<string, number> = {};
    memories.forEach(m => {
      riskDistribution[m.riskLevel] = (riskDistribution[m.riskLevel] || 0) + 1;
    });
    
    // Market trend success rates
    const marketTrendSuccess: Record<string, number> = {};
    const trendCounts: Record<string, number> = {};
    memories.forEach(m => {
      const trend = m.marketConditions.marketTrend;
      marketTrendSuccess[trend] = (marketTrendSuccess[trend] || 0) + (m.outcome === 'profit' ? 1 : 0);
      trendCounts[trend] = (trendCounts[trend] || 0) + 1;
    });
    Object.keys(marketTrendSuccess).forEach(trend => {
      const count = trendCounts[trend];
      if (count && count > 0) {
        marketTrendSuccess[trend] = (marketTrendSuccess[trend] || 0) / count;
      }
    });
    
    // Confidence correlation with success
    const confidentTrades = memories.filter(m => m.confidence > 0.7);
    const confidenceCorrelation = confidentTrades.length > 0
      ? confidentTrades.filter(m => m.outcome === 'profit').length / confidentTrades.length
      : 0.5;
    
    return {
      successRate,
      avgReturn,
      dominantStrategy,
      riskDistribution,
      marketTrendSuccess,
      confidenceCorrelation
    };
  }

  /**
   * Build RAG-enhanced context for AI decision making
   */
  private buildRAGContext(
    tokenAnalysis: any,
    similarMemories: ExtendedTradeMemory[],
    memoryInsights: any,
    marketData: any,
    externalContext?: any
  ): string {
    const context = `
# Advanced Market Analysis with Historical Context

## Current Token Analysis
- Symbol: ${tokenAnalysis.symbol || 'Unknown'}
- Address: ${marketData.address || 'Unknown'}
- Current Price: $${marketData.price || 0}
- 24h Change: ${marketData.priceChange24h || 0}%
- Volume 24h: $${marketData.volume24h || 0}
- Liquidity: $${marketData.liquidity || 0}
- Technical Score: ${tokenAnalysis.technicalScore?.toFixed(2) || 0.5}
- Sentiment Score: ${tokenAnalysis.sentimentScore?.toFixed(2) || 0.5}
- AI Confidence: ${tokenAnalysis.aiConfidence?.toFixed(2) || 0.5}

## Retrieved Historical Context (RAG)
Retrieved ${similarMemories.length} similar past trading situations:

### Memory Insights
- Historical Success Rate: ${(memoryInsights.successRate * 100).toFixed(1)}%
- Average Return: ${memoryInsights.avgReturn.toFixed(2)}%
- Dominant Strategy: ${memoryInsights.dominantStrategy}
- Confidence Correlation: ${(memoryInsights.confidenceCorrelation * 100).toFixed(1)}%

### Similar Past Trades
${similarMemories.slice(0, 3).map((m, i) => `
${i + 1}. ${m.tokenSymbol} (${new Date(m.timestamp).toLocaleDateString()})
   - Action: ${m.action} | Outcome: ${m.outcome}
   - P&L: ${m.profitLoss?.toFixed(2) || 0}%
   - Strategy: ${m.strategy}
   - Market: ${m.marketConditions.marketTrend}
   - Lessons: ${m.lessons.join('; ') || 'None'}
`).join('')}

### Market Trend Performance
${Object.entries(memoryInsights.marketTrendSuccess).map(([trend, rate]) => 
  `- ${trend}: ${((rate as number) * 100).toFixed(1)}% success rate`
).join('\n')}

## Current Market Conditions
- Trend: ${marketData.marketTrend || 'Unknown'}
- Buy/Sell Pressure: ${marketData.buySellPressure || 0}
- Volatility: ${this.calculateVolatility(similarMemories)}

## AI Personality
- Risk Tolerance: ${this.personality.riskTolerance.toFixed(2)}
- Aggressiveness: ${this.personality.aggressiveness.toFixed(2)}
- Confidence Threshold: ${this.personality.confidenceThreshold.toFixed(2)}
- Exploration Rate: ${this.personality.explorationRate.toFixed(2)}

## Performance Stats
- Total Trades: ${this.totalTrades}
- Current Success Rate: ${this.getSuccessRate().toFixed(1)}%
- Active Strategies: ${this.strategies.size}

${externalContext?.news ? `
## External News Context
${externalContext.news.slice(0, 3).map((n: string, i: number) => `${i + 1}. ${n}`).join('\n')}
` : ''}

${externalContext?.socialSentiment ? `
## Social Sentiment
- Score: ${externalContext.socialSentiment.toFixed(2)}/1.0
` : ''}

Based on this comprehensive analysis, provide a trading decision (BUY/SELL/HOLD) with:
1. Action and recommended amount
2. Confidence level (0-1)
3. Detailed reasoning
4. Strategy name
5. Risk level (LOW/MEDIUM/HIGH)
`;
    
    return context;
  }

  /**
   * Calculate confidence using RAG insights
   */
  private calculateRAGConfidence(
    aiDecision: any,
    similarMemories: ExtendedTradeMemory[],
    memoryInsights: any
  ): number {
    let confidence = aiDecision.confidence || 0.5;
    
    // Boost confidence if similar situations were successful
    if (memoryInsights.successRate > 0.7 && similarMemories.length >= 3) {
      confidence *= 1.2;
      logger.info('✅ Confidence boosted by strong historical performance');
    }
    
    // Reduce confidence if similar situations failed
    if (memoryInsights.successRate < 0.3 && similarMemories.length >= 3) {
      confidence *= 0.7;
      logger.warn('⚠️  Confidence reduced by poor historical performance');
    }
    
    // Adjust based on average returns
    if (memoryInsights.avgReturn > 10) {
      confidence *= 1.1;
    } else if (memoryInsights.avgReturn < -10) {
      confidence *= 0.8;
    }
    
    // Factor in confidence correlation
    confidence *= (0.7 + (memoryInsights.confidenceCorrelation * 0.3));
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calculate volatility from historical memories
   */
  private calculateVolatility(memories: ExtendedTradeMemory[]): string {
    if (memories.length === 0) return 'Unknown';
    
    const returns = memories.map(m => m.profitLoss || 0);
    const avg = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);
    
    if (volatility < 5) return 'Low';
    if (volatility < 15) return 'Medium';
    return 'High';
  }

  /**
   * Implement continuous learning loop
   * Periodically analyzes performance and adjusts strategies
   */
  async runLearningLoop(): Promise<{
    personalityUpdated: boolean;
    strategiesOptimized: number;
    insights: string[];
  }> {
    logger.info('🔄 Starting learning loop...');
    
    try {
      // Load latest memories
      await this.loadMemories();
      
      const initialPersonality = { ...this.personality };
      const initialStrategies = this.strategies.size;
      
      // Analyze recent performance
      const recentMemories = Array.from(this.memories.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 50);
      
      // Update personality based on performance
      await this.evolvePersonality();
      
      const personalityUpdated = JSON.stringify(initialPersonality) !== JSON.stringify(this.personality);
      
      // Optimize strategies
      const optimizedStrategies = await this.optimizeStrategies(recentMemories);
      
      // Generate insights
      const insights = await this.generateLearningInsights(recentMemories);
      
      logger.info('✅ Learning loop complete');
      logger.info(`  Personality Updated: ${personalityUpdated}`);
      logger.info(`  Strategies Optimized: ${optimizedStrategies}`);
      logger.info(`  Insights Generated: ${insights.length}`);
      
      return {
        personalityUpdated,
        strategiesOptimized: optimizedStrategies,
        insights
      };
      
    } catch (error) {
      logger.error('Learning loop failed:', error);
      return {
        personalityUpdated: false,
        strategiesOptimized: 0,
        insights: ['Learning loop encountered an error']
      };
    }
  }

  /**
   * Optimize trading strategies based on performance
   */
  private async optimizeStrategies(recentMemories: ExtendedTradeMemory[]): Promise<number> {
    let optimizedCount = 0;
    
    // Analyze each strategy's recent performance
    const strategyPerformance = new Map<string, {
      trades: ExtendedTradeMemory[];
      winRate: number;
      avgReturn: number;
    }>();
    
    recentMemories.forEach(memory => {
      if (!strategyPerformance.has(memory.strategy)) {
        strategyPerformance.set(memory.strategy, {
          trades: [],
          winRate: 0,
          avgReturn: 0
        });
      }
      strategyPerformance.get(memory.strategy)!.trades.push(memory);
    });
    
    // Calculate performance metrics for each strategy
    for (const [strategyId, data] of strategyPerformance) {
      const profitable = data.trades.filter(t => t.outcome === 'profit');
      data.winRate = profitable.length / data.trades.length;
      data.avgReturn = data.trades.reduce((sum, t) => sum + (t.profitLoss || 0), 0) / data.trades.length;
      
      if (this.strategies.has(strategyId)) {
        const strategy = this.strategies.get(strategyId)!;
        
        // Update performance metrics
        strategy.performance.shortTerm = data.avgReturn;
        
        // Prune underperforming strategies
        if (data.winRate < 0.3 && data.trades.length >= 10) {
          logger.warn(`🗑️  Pruning underperforming strategy: ${strategyId}`);
          this.strategies.delete(strategyId);
          optimizedCount++;
        } else {
          // Update strategy parameters based on successful patterns
          this.strategies.set(strategyId, strategy);
          optimizedCount++;
        }
      }
    }
    
    return optimizedCount;
  }

  /**
   * Generate actionable insights from learning
   */
  private async generateLearningInsights(recentMemories: ExtendedTradeMemory[]): Promise<string[]> {
    const insights: string[] = [];
    
    if (recentMemories.length === 0) {
      return ['Insufficient data for insights. Continue trading to build experience.'];
    }
    
    // Win rate analysis
    const profitable = recentMemories.filter(m => m.outcome === 'profit');
    const winRate = profitable.length / recentMemories.length;
    
    if (winRate > 0.7) {
      insights.push(`✨ Excellent recent performance! Win rate: ${(winRate * 100).toFixed(1)}%`);
    } else if (winRate < 0.4) {
      insights.push(`⚠️  Recent win rate ${(winRate * 100).toFixed(1)}% is below target. Consider strategy review.`);
    }
    
    // Return analysis
    const avgReturn = recentMemories.reduce((sum, m) => sum + (m.profitLoss || 0), 0) / recentMemories.length;
    if (avgReturn > 5) {
      insights.push(`📈 Strong average returns: ${avgReturn.toFixed(2)}%. Current approach is effective.`);
    } else if (avgReturn < 0) {
      insights.push(`📉 Negative average returns: ${avgReturn.toFixed(2)}%. Risk management needs adjustment.`);
    }
    
    // Strategy insights
    const strategyStats = new Map<string, { count: number; winRate: number }>();
    recentMemories.forEach(m => {
      if (!strategyStats.has(m.strategy)) {
        strategyStats.set(m.strategy, { count: 0, winRate: 0 });
      }
      const stats = strategyStats.get(m.strategy)!;
      stats.count++;
      if (m.outcome === 'profit') stats.winRate++;
    });
    
    strategyStats.forEach((stats, strategy) => {
      stats.winRate = stats.winRate / stats.count;
      if (stats.winRate > 0.75 && stats.count >= 5) {
        insights.push(`🎯 Strategy "${strategy}" performing exceptionally well (${(stats.winRate * 100).toFixed(1)}% win rate)`);
      } else if (stats.winRate < 0.3 && stats.count >= 5) {
        insights.push(`⛔ Strategy "${strategy}" underperforming (${(stats.winRate * 100).toFixed(1)}% win rate). Consider alternatives.`);
      }
    });
    
    // Market condition insights
    const trendPerformance = new Map<string, { count: number; avgReturn: number }>();
    recentMemories.forEach(m => {
      const trend = m.marketConditions.marketTrend;
      if (!trendPerformance.has(trend)) {
        trendPerformance.set(trend, { count: 0, avgReturn: 0 });
      }
      const perf = trendPerformance.get(trend)!;
      perf.count++;
      perf.avgReturn += m.profitLoss || 0;
    });
    
    trendPerformance.forEach((perf, trend) => {
      perf.avgReturn = perf.avgReturn / perf.count;
      if (perf.avgReturn > 5 && perf.count >= 3) {
        insights.push(`🌊 Strong performance in ${trend} markets (${perf.avgReturn.toFixed(2)}% avg)`);
      } else if (perf.avgReturn < -5 && perf.count >= 3) {
        insights.push(`🌊 Weak performance in ${trend} markets (${perf.avgReturn.toFixed(2)}% avg). Avoid or adjust strategy.`);
      }
    });
    
    // Personality recommendations
    if (this.personality.riskTolerance > 0.7 && avgReturn < 0) {
      insights.push('⚖️  High risk tolerance with negative returns. Consider reducing risk exposure.');
    }
    if (this.personality.explorationRate < 0.15 && winRate < 0.5) {
      insights.push('🔍 Low exploration rate with poor performance. Try new strategies.');
    }
    
    return insights;
  }

  /**
   * Compute dynamic thresholds from historical Greenfield data
   * Returns adaptive thresholds based on past performance
   */
  async computeDynamicThresholds(): Promise<{
    minProfitability: number;
    optimalConfidence: number;
    maxRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    suggestedTradeAmount: number;
  }> {
    if (this.memories.size < 5) {
      // Not enough data, return conservative defaults
      return {
        minProfitability: 0.60, // 60% minimum
        optimalConfidence: 0.70, // 70% confidence
        maxRiskLevel: 'LOW',
        suggestedTradeAmount: 0.1, // 0.1 BNB
      };
    }

    // Analyze profitable trades
    const profitableTrades = Array.from(this.memories.values())
      .filter(m => m.outcome === 'profit' && m.profitLoss && m.profitLoss > 0);

    const losingTrades = Array.from(this.memories.values())
      .filter(m => m.outcome === 'loss' && m.profitLoss && m.profitLoss < 0);

    // Compute average profitability from winning trades
    let avgProfitability = 0.60; // Default
    if (profitableTrades.length > 0) {
      const profits = profitableTrades.map(t => t.profitLoss || 0);
      const avgProfit = profits.reduce((sum, p) => sum + p, 0) / profits.length;

      // Convert to percentage profitability
      // Assuming entry amounts, compute percentage return
      avgProfitability = Math.max(0.50, Math.min(0.95, avgProfit / 100)); // Clamp 50-95%
    }

    // Compute optimal confidence threshold
    // Analyze confidence levels of successful vs failed trades
    let optimalConfidence = 0.70; // Default
    if (profitableTrades.length > 0) {
      const avgWinningConfidence = profitableTrades.reduce((sum, t) => sum + t.confidence, 0) / profitableTrades.length;
      const avgLosingConfidence = losingTrades.length > 0
        ? losingTrades.reduce((sum, t) => sum + t.confidence, 0) / losingTrades.length
        : 0.5;

      // Set threshold between average losing and winning confidence
      optimalConfidence = Math.max(0.60, Math.min(0.90, (avgWinningConfidence + avgLosingConfidence) / 2 + 0.1));
    }

    // Determine max risk level based on win rate
    const winRate = this.getSuccessRate();
    let maxRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (winRate > 70 && profitableTrades.length > 10) {
      maxRiskLevel = 'HIGH';
    } else if (winRate > 55 && profitableTrades.length > 5) {
      maxRiskLevel = 'MEDIUM';
    }

    // Compute suggested trade amount based on avg return
    const avgReturn = profitableTrades.length > 0
      ? profitableTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0) / profitableTrades.length
      : 0;

    let suggestedTradeAmount = 0.1; // Base amount
    if (avgReturn > 10 && winRate > 60) {
      suggestedTradeAmount = 0.5; // Increase for good performance
    } else if (avgReturn > 5 && winRate > 50) {
      suggestedTradeAmount = 0.2;
    } else if (winRate < 40) {
      suggestedTradeAmount = 0.05; // Reduce for poor performance
    }

    logger.info('📊 Dynamic thresholds computed from Greenfield data:');
    logger.info(`  Min Profitability: ${(avgProfitability * 100).toFixed(1)}%`);
    logger.info(`  Optimal Confidence: ${(optimalConfidence * 100).toFixed(1)}%`);
    logger.info(`  Max Risk Level: ${maxRiskLevel}`);
    logger.info(`  Suggested Trade: ${suggestedTradeAmount} BNB`);

    return {
      minProfitability: avgProfitability,
      optimalConfidence,
      maxRiskLevel,
      suggestedTradeAmount,
    };
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
