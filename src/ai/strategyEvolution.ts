// src/ai/strategyEvolution.ts
// Advanced strategy evolution system for the immortal AI agent
// Implements genetic algorithm-like approach for strategy optimization

import { logger } from '../utils/logger';
import type { AIPersonality, StrategyEvolution, ExtendedTradeMemory } from './immortalAgent';

export interface StrategyGene {
  id: string;
  name: string;
  type: 'technical' | 'sentiment' | 'momentum' | 'mean_reversion' | 'arbitrage' | 'hybrid';
  parameters: Record<string, number>;
  weights: Record<string, number>;
  conditions: string[];
  fitness: number; // Evolutionary fitness score
  generation: number;
  parentIds: string[];
}

export interface MarketRegime {
  id: string;
  name: string;
  conditions: {
    volatility: [number, number]; // Min, max range
    volume: [number, number];
    trend: 'bullish' | 'bearish' | 'sideways';
    priceChange24h: [number, number];
  };
  bestStrategies: string[];
  confidence: number;
}

export interface EvolutionMetrics {
  generation: number;
  populationSize: number;
  avgFitness: number;
  bestFitness: number;
  diversityScore: number;
  convergenceRate: number;
  mutationRate: number;
  crossoverRate: number;
}

export class StrategyEvolutionEngine {
  private strategies: Map<string, StrategyGene> = new Map();
  private marketRegimes: Map<string, MarketRegime> = new Map();
  private currentGeneration: number = 1;
  private populationSize: number = 20;
  private mutationRate: number = 0.1;
  private crossoverRate: number = 0.7;
  private eliteSize: number = 4;
  private memories: ExtendedTradeMemory[] = [];

  constructor() {
    this.initializeBaseStrategies();
    this.initializeMarketRegimes();
    logger.info('🧬 Strategy evolution engine initialized');
  }

  /**
   * Initialize base strategies that serve as genetic foundation
   */
  private initializeBaseStrategies(): void {
    // Momentum strategy
    this.strategies.set('momentum_v1', {
      id: 'momentum_v1',
      name: 'Momentum Breakout',
      type: 'momentum',
      parameters: {
        priceChangeThreshold: 5.0,
        volumeMultiplier: 2.0,
        rsiThreshold: 70.0,
        stopLoss: 5.0,
        takeProfit: 15.0
      },
      weights: {
        technical: 0.6,
        volume: 0.3,
        sentiment: 0.1
      },
      conditions: ['volume > avgVolume * 2', 'priceChange24h > 5', 'rsi < 70'],
      fitness: 0.5,
      generation: 1,
      parentIds: []
    });

    // Mean reversion strategy
    this.strategies.set('mean_reversion_v1', {
      id: 'mean_reversion_v1',
      name: 'Mean Reversion',
      type: 'mean_reversion',
      parameters: {
        oversoldThreshold: 30.0,
        overboughtThreshold: 70.0,
        meanReversionPeriod: 14,
        minLiquidity: 100000,
        maxPriceChange: -10.0
      },
      weights: {
        technical: 0.7,
        volume: 0.2,
        sentiment: 0.1
      },
      conditions: ['rsi < 30', 'priceChange24h < -5', 'liquidity > 100000'],
      fitness: 0.5,
      generation: 1,
      parentIds: []
    });

    // Arbitrage strategy
    this.strategies.set('arbitrage_v1', {
      id: 'arbitrage_v1',
      name: 'Cross-Chain Arbitrage',
      type: 'arbitrage',
      parameters: {
        minPriceDifference: 2.0,
        maxExecutionTime: 1800,
        minLiquidity: 500000,
        bridgeFeeThreshold: 1.0
      },
      weights: {
        priceDifference: 0.5,
        executionTime: 0.3,
        liquidity: 0.2
      },
      conditions: ['priceDifference > 2', 'executionTime < 1800', 'liquidity > 500000'],
      fitness: 0.5,
      generation: 1,
      parentIds: []
    });

    // Sentiment-based strategy
    this.strategies.set('sentiment_v1', {
      id: 'sentiment_v1',
      name: 'Social Sentiment Trading',
      type: 'sentiment',
      parameters: {
        sentimentThreshold: 0.7,
        socialVolumeMultiplier: 3.0,
        newsImpactWeight: 0.4,
        twitterMentions: 1000
      },
      weights: {
        sentiment: 0.6,
        social: 0.25,
        technical: 0.15
      },
      conditions: ['sentiment > 0.7', 'socialVolume > baseline * 3', 'newsImpact > 0.3'],
      fitness: 0.5,
      generation: 1,
      parentIds: []
    });

    // Hybrid adaptive strategy
    this.strategies.set('hybrid_v1', {
      id: 'hybrid_v1',
      name: 'Adaptive Multi-Strategy',
      type: 'hybrid',
      parameters: {
        momentumWeight: 0.3,
        meanReversionWeight: 0.3,
        arbitrageWeight: 0.2,
        sentimentWeight: 0.2,
        adaptationRate: 0.1
      },
      weights: {
        momentum: 0.3,
        meanReversion: 0.3,
        arbitrage: 0.2,
        sentiment: 0.2
      },
      conditions: ['marketRegime != "unknown"', 'confidence > 0.6'],
      fitness: 0.5,
      generation: 1,
      parentIds: []
    });
  }

  /**
   * Initialize market regimes for strategy selection
   */
  private initializeMarketRegimes(): void {
    // Bull market regime
    this.marketRegimes.set('bull_market', {
      id: 'bull_market',
      name: 'Bull Market',
      conditions: {
        volatility: [0.02, 0.08],
        volume: [1000000, Number.MAX_VALUE],
        trend: 'bullish',
        priceChange24h: [3, 50]
      },
      bestStrategies: ['momentum_v1', 'hybrid_v1'],
      confidence: 0.8
    });

    // Bear market regime
    this.marketRegimes.set('bear_market', {
      id: 'bear_market',
      name: 'Bear Market',
      conditions: {
        volatility: [0.03, 0.15],
        volume: [500000, Number.MAX_VALUE],
        trend: 'bearish',
        priceChange24h: [-50, -3]
      },
      bestStrategies: ['mean_reversion_v1', 'arbitrage_v1'],
      confidence: 0.8
    });

    // Sideways/ranging market
    this.marketRegimes.set('sideways_market', {
      id: 'sideways_market',
      name: 'Sideways Market',
      conditions: {
        volatility: [0.01, 0.05],
        volume: [100000, 2000000],
        trend: 'sideways',
        priceChange24h: [-3, 3]
      },
      bestStrategies: ['mean_reversion_v1', 'arbitrage_v1', 'sentiment_v1'],
      confidence: 0.7
    });

    // High volatility regime
    this.marketRegimes.set('high_volatility', {
      id: 'high_volatility',
      name: 'High Volatility',
      conditions: {
        volatility: [0.1, Number.MAX_VALUE],
        volume: [2000000, Number.MAX_VALUE],
        trend: 'bullish', // Can be any trend
        priceChange24h: [-50, 50]
      },
      bestStrategies: ['arbitrage_v1', 'momentum_v1'],
      confidence: 0.6
    });
  }

  /**
   * Add trading memory for strategy evolution
   */
  addMemory(memory: ExtendedTradeMemory): void {
    this.memories.push(memory);
    
    // Keep only recent memories for evolution (last 1000 trades)
    if (this.memories.length > 1000) {
      this.memories = this.memories.slice(-1000);
    }
    
    // Update strategy fitness based on new memory
    this.updateStrategyFitness(memory);
  }

  /**
   * Evolve strategies using genetic algorithm principles
   */
  async evolveStrategies(): Promise<EvolutionMetrics> {
    try {
      logger.info(`🧬 Evolving strategies - Generation ${this.currentGeneration}`);
      
      const currentStrategies = Array.from(this.strategies.values());
      
      // Calculate fitness for all strategies
      await this.calculateFitnessScores();
      
      // Select elite strategies (best performers)
      const elite = this.selectElite(currentStrategies);
      
      // Generate new strategies through crossover and mutation
      const offspring = await this.generateOffspring(elite);
      
      // Merge elite and offspring for new generation
      const newGeneration = [...elite, ...offspring];
      
      // Update strategy population
      this.updateStrategyPopulation(newGeneration);
      
      this.currentGeneration++;
      
      const metrics = this.calculateEvolutionMetrics();
      logger.info(`📈 Evolution metrics - Avg fitness: ${metrics.avgFitness.toFixed(3)}, Best: ${metrics.bestFitness.toFixed(3)}`);
      
      return metrics;
      
    } catch (error) {
      logger.error('Strategy evolution failed:', error);
      return this.calculateEvolutionMetrics();
    }
  }

  /**
   * Calculate fitness scores for all strategies
   */
  private async calculateFitnessScores(): Promise<void> {
    for (const strategy of this.strategies.values()) {
      const fitness = this.calculateStrategyFitness(strategy);
      strategy.fitness = fitness;
    }
  }

  /**
   * Calculate fitness score for a specific strategy
   */
  private calculateStrategyFitness(strategy: StrategyGene): number {
    const relevantMemories = this.memories.filter(m => m.strategy === strategy.id);
    
    if (relevantMemories.length === 0) {
      return 0.5; // Neutral fitness for untested strategies
    }

    let totalScore = 0;
    let weightedCount = 0;

    for (const memory of relevantMemories) {
      const profitLoss = memory.profitLoss || 0;
      const timeWeight = this.getTimeDecayWeight(memory.timestamp);
      
      // Fitness components
      let tradeScore = 0;
      
      // Profit/loss component (most important)
      if (profitLoss > 0) {
        tradeScore += Math.min(profitLoss / 10, 1.0); // Max 1.0 for 10%+ profit
      } else {
        tradeScore += Math.max(profitLoss / 20, -0.5); // Max -0.5 for 20%+ loss
      }
      
      // Risk-adjusted component
      const riskAdjustment = this.calculateRiskAdjustment(memory);
      tradeScore += riskAdjustment * 0.3;
      
      // Execution quality component
      const executionQuality = this.calculateExecutionQuality(memory);
      tradeScore += executionQuality * 0.2;
      
      totalScore += tradeScore * timeWeight;
      weightedCount += timeWeight;
    }

    const avgScore = weightedCount > 0 ? totalScore / weightedCount : 0.5;
    
    // Normalize to 0-1 range
    return Math.max(0, Math.min(1, (avgScore + 1) / 2));
  }

  /**
   * Calculate time decay weight (recent trades matter more)
   */
  private getTimeDecayWeight(timestamp: number): number {
    const ageInDays = (Date.now() - timestamp) / (24 * 60 * 60 * 1000);
    return Math.exp(-ageInDays / 30); // Exponential decay with 30-day half-life
  }

  /**
   * Calculate risk adjustment factor
   */
  private calculateRiskAdjustment(memory: ExtendedTradeMemory): number {
    const riskScore = {
      'LOW': 0.3,
      'MEDIUM': 0.0,
      'HIGH': -0.3
    }[memory.riskLevel];

    const confidenceBonus = (memory.confidence - 0.5) * 0.4;
    
    return riskScore + confidenceBonus;
  }

  /**
   * Calculate execution quality score
   */
  private calculateExecutionQuality(memory: ExtendedTradeMemory): number {
    let quality = 0.5;
    
    // Liquidity factor
    if (memory.marketConditions.liquidity > 1000000) quality += 0.2;
    else if (memory.marketConditions.liquidity < 100000) quality -= 0.2;
    
    // Volume factor
    if (memory.marketConditions.volume24h > 5000000) quality += 0.1;
    else if (memory.marketConditions.volume24h < 500000) quality -= 0.1;
    
    // Market trend alignment
    const priceChange = memory.marketConditions.priceChange24h;
    if ((memory.action === 'BUY' && priceChange > 0) || 
        (memory.action === 'SELL' && priceChange < 0)) {
      quality += 0.2;
    }
    
    return Math.max(0, Math.min(1, quality));
  }

  /**
   * Select elite strategies for breeding
   */
  private selectElite(strategies: StrategyGene[]): StrategyGene[] {
    return strategies
      .sort((a, b) => b.fitness - a.fitness)
      .slice(0, this.eliteSize);
  }

  /**
   * Generate offspring through crossover and mutation
   */
  private async generateOffspring(elite: StrategyGene[]): Promise<StrategyGene[]> {
    const offspring: StrategyGene[] = [];
    const offspringCount = this.populationSize - this.eliteSize;

    for (let i = 0; i < offspringCount; i++) {
      let child: StrategyGene;

      if (Math.random() < this.crossoverRate) {
        // Crossover: combine two parent strategies
        const parent1 = this.selectParent(elite);
        const parent2 = this.selectParent(elite);
        child = this.crossover(parent1, parent2);
      } else {
        // Asexual reproduction: mutate existing strategy
        const parent = this.selectParent(elite);
        child = this.clone(parent);
      }

      // Apply mutation
      if (Math.random() < this.mutationRate) {
        this.mutate(child);
      }

      offspring.push(child);
    }

    return offspring;
  }

  /**
   * Select parent strategy using tournament selection
   */
  private selectParent(elite: StrategyGene[]): StrategyGene {
    const tournamentSize = Math.min(3, elite.length);
    const tournament: StrategyGene[] = [];
    
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * elite.length);
      const selected = elite[randomIndex];
      if (selected) {
        tournament.push(selected);
      }
    }
    
    if (tournament.length === 0) {
      throw new Error('Elite population is empty, cannot select parent');
    }
    
    return tournament.reduce((best, current) => 
      current.fitness > best.fitness ? current : best
    );
  }

  /**
   * Crossover two parent strategies to create offspring
   */
  private crossover(parent1: StrategyGene, parent2: StrategyGene): StrategyGene {
    const childId = `${parent1.type}_gen${this.currentGeneration}_${Date.now()}`;
    
    // Blend parameters from both parents
    const childParameters: Record<string, number> = {};
    const allParams = new Set([
      ...Object.keys(parent1.parameters),
      ...Object.keys(parent2.parameters)
    ]);

    for (const param of allParams) {
      const val1 = parent1.parameters[param] || 0;
      const val2 = parent2.parameters[param] || 0;
      const alpha = Math.random(); // Blend factor
      childParameters[param] = val1 * alpha + val2 * (1 - alpha);
    }

    // Blend weights
    const childWeights: Record<string, number> = {};
    const allWeights = new Set([
      ...Object.keys(parent1.weights),
      ...Object.keys(parent2.weights)
    ]);

    for (const weight of allWeights) {
      const val1 = parent1.weights[weight] || 0;
      const val2 = parent2.weights[weight] || 0;
      const alpha = Math.random();
      childWeights[weight] = val1 * alpha + val2 * (1 - alpha);
    }

    // Normalize weights
    const totalWeight = Object.values(childWeights).reduce((sum, w) => sum + w, 0);
    if (totalWeight > 0) {
      for (const key of Object.keys(childWeights)) {
        const currentWeight = childWeights[key];
        if (currentWeight !== undefined) {
          childWeights[key] = currentWeight / totalWeight;
        }
      }
    }

    // Combine conditions
    const childConditions = [...parent1.conditions, ...parent2.conditions];
    const uniqueConditions = [...new Set(childConditions)];

    return {
      id: childId,
      name: `${parent1.name} × ${parent2.name}`,
      type: parent1.type === parent2.type ? parent1.type : 'hybrid',
      parameters: childParameters,
      weights: childWeights,
      conditions: uniqueConditions,
      fitness: 0.5, // Will be calculated after trading
      generation: this.currentGeneration,
      parentIds: [parent1.id, parent2.id]
    };
  }

  /**
   * Clone a strategy for asexual reproduction
   */
  private clone(parent: StrategyGene): StrategyGene {
    const childId = `${parent.type}_gen${this.currentGeneration}_${Date.now()}`;
    
    return {
      id: childId,
      name: `${parent.name} Clone`,
      type: parent.type,
      parameters: { ...parent.parameters },
      weights: { ...parent.weights },
      conditions: [...parent.conditions],
      fitness: 0.5,
      generation: this.currentGeneration,
      parentIds: [parent.id]
    };
  }

  /**
   * Apply random mutations to a strategy
   */
  private mutate(strategy: StrategyGene): void {
    // Mutate parameters
    for (const [param, value] of Object.entries(strategy.parameters)) {
      if (Math.random() < 0.3) { // 30% chance to mutate each parameter
        const mutationFactor = 1 + (Math.random() - 0.5) * 0.4; // ±20% mutation
        strategy.parameters[param] = value * mutationFactor;
        
        // Keep parameters within reasonable bounds
        strategy.parameters[param] = Math.max(0.1, Math.min(100, strategy.parameters[param]));
      }
    }

    // Mutate weights
    for (const [weight, value] of Object.entries(strategy.weights)) {
      if (Math.random() < 0.2) { // 20% chance to mutate each weight
        const mutationFactor = 1 + (Math.random() - 0.5) * 0.3; // ±15% mutation
        strategy.weights[weight] = value * mutationFactor;
      }
    }

    // Normalize weights after mutation
    const totalWeight = Object.values(strategy.weights).reduce((sum, w) => sum + w, 0);
    if (totalWeight > 0) {
      for (const key of Object.keys(strategy.weights)) {
        const currentWeight = strategy.weights[key];
        if (currentWeight !== undefined) {
          strategy.weights[key] = currentWeight / totalWeight;
        }
      }
    }

    // Possibly add or remove conditions
    if (Math.random() < 0.1) { // 10% chance to modify conditions
      if (strategy.conditions.length > 1 && Math.random() < 0.5) {
        // Remove a condition
        const indexToRemove = Math.floor(Math.random() * strategy.conditions.length);
        strategy.conditions.splice(indexToRemove, 1);
      } else {
        // Add a new condition (from a pool of possible conditions)
        const possibleConditions = [
          'volume > avgVolume * 1.5',
          'rsi < 80',
          'rsi > 20',
          'priceChange24h > 2',
          'priceChange24h < -2',
          'liquidity > 50000',
          'confidence > 0.7'
        ];
        
        const newCondition = possibleConditions[Math.floor(Math.random() * possibleConditions.length)];
        if (newCondition && !strategy.conditions.includes(newCondition)) {
          strategy.conditions.push(newCondition);
        }
      }
    }
  }

  /**
   * Update strategy population with new generation
   */
  private updateStrategyPopulation(newGeneration: StrategyGene[]): void {
    // Clear old strategies
    this.strategies.clear();
    
    // Add new generation
    for (const strategy of newGeneration) {
      this.strategies.set(strategy.id, strategy);
    }

    // Adjust mutation rate based on diversity
    const diversityScore = this.calculateDiversityScore();
    if (diversityScore < 0.3) {
      this.mutationRate = Math.min(0.3, this.mutationRate * 1.2); // Increase mutation
    } else if (diversityScore > 0.7) {
      this.mutationRate = Math.max(0.05, this.mutationRate * 0.9); // Decrease mutation
    }
  }

  /**
   * Calculate diversity score of current population
   */
  private calculateDiversityScore(): number {
    const strategies = Array.from(this.strategies.values());
    
    if (strategies.length < 2) return 0;

    let totalDistance = 0;
    let comparisons = 0;

    for (let i = 0; i < strategies.length; i++) {
      for (let j = i + 1; j < strategies.length; j++) {
        const strategyI = strategies[i];
        const strategyJ = strategies[j];
        if (strategyI && strategyJ) {
          const distance = this.calculateStrategyDistance(strategyI, strategyJ);
          totalDistance += distance;
          comparisons++;
        }
      }
    }

    return comparisons > 0 ? totalDistance / comparisons : 0;
  }

  /**
   * Calculate distance between two strategies
   */
  private calculateStrategyDistance(strategy1: StrategyGene, strategy2: StrategyGene): number {
    // Type difference
    let distance = strategy1.type === strategy2.type ? 0 : 0.5;

    // Parameter differences
    const allParams = new Set([
      ...Object.keys(strategy1.parameters),
      ...Object.keys(strategy2.parameters)
    ]);

    let paramDistance = 0;
    for (const param of allParams) {
      const val1 = strategy1.parameters[param] || 0;
      const val2 = strategy2.parameters[param] || 0;
      const maxVal = Math.max(Math.abs(val1), Math.abs(val2), 1);
      paramDistance += Math.abs(val1 - val2) / maxVal;
    }
    distance += paramDistance / allParams.size * 0.3;

    // Weight differences
    const allWeights = new Set([
      ...Object.keys(strategy1.weights),
      ...Object.keys(strategy2.weights)
    ]);

    let weightDistance = 0;
    for (const weight of allWeights) {
      const val1 = strategy1.weights[weight] || 0;
      const val2 = strategy2.weights[weight] || 0;
      weightDistance += Math.abs(val1 - val2);
    }
    distance += weightDistance / allWeights.size * 0.2;

    return Math.min(1, distance);
  }

  /**
   * Update strategy fitness based on new trade memory
   */
  private updateStrategyFitness(memory: ExtendedTradeMemory): void {
    const strategy = this.strategies.get(memory.strategy);
    if (!strategy) return;

    // Incremental fitness update
    const newFitness = this.calculateStrategyFitness(strategy);
    strategy.fitness = newFitness;
  }

  /**
   * Calculate evolution metrics for monitoring
   */
  private calculateEvolutionMetrics(): EvolutionMetrics {
    const strategies = Array.from(this.strategies.values());
    const fitnessValues = strategies.map(s => s.fitness);
    
    return {
      generation: this.currentGeneration,
      populationSize: strategies.length,
      avgFitness: fitnessValues.reduce((sum, f) => sum + f, 0) / fitnessValues.length,
      bestFitness: Math.max(...fitnessValues),
      diversityScore: this.calculateDiversityScore(),
      convergenceRate: this.calculateConvergenceRate(),
      mutationRate: this.mutationRate,
      crossoverRate: this.crossoverRate
    };
  }

  /**
   * Calculate convergence rate (how similar strategies are becoming)
   */
  private calculateConvergenceRate(): number {
    const strategies = Array.from(this.strategies.values());
    const fitnessValues = strategies.map(s => s.fitness);
    
    if (fitnessValues.length < 2) return 0;
    
    const mean = fitnessValues.reduce((sum, f) => sum + f, 0) / fitnessValues.length;
    const variance = fitnessValues.reduce((sum, f) => sum + Math.pow(f - mean, 2), 0) / fitnessValues.length;
    
    // Convergence is inverse of variance
    return Math.max(0, 1 - variance * 4); // Scale variance appropriately
  }

  /**
   * Detect current market regime
   */
  detectMarketRegime(marketData: {
    volatility: number;
    volume: number;
    trend: 'bullish' | 'bearish' | 'sideways';
    priceChange24h: number;
  }): MarketRegime | null {
    for (const regime of this.marketRegimes.values()) {
      const conditions = regime.conditions;
      
      if (
        marketData.volatility >= conditions.volatility[0] &&
        marketData.volatility <= conditions.volatility[1] &&
        marketData.volume >= conditions.volume[0] &&
        marketData.volume <= conditions.volume[1] &&
        marketData.trend === conditions.trend &&
        marketData.priceChange24h >= conditions.priceChange24h[0] &&
        marketData.priceChange24h <= conditions.priceChange24h[1]
      ) {
        return regime;
      }
    }
    
    return null;
  }

  /**
   * Get best strategies for current market conditions
   */
  getBestStrategiesForMarket(marketData: any): StrategyGene[] {
    const regime = this.detectMarketRegime(marketData);
    
    if (regime) {
      return regime.bestStrategies
        .map(id => this.strategies.get(id))
        .filter((s): s is StrategyGene => s !== undefined)
        .sort((a, b) => b.fitness - a.fitness);
    }

    // Fallback: return all strategies sorted by fitness
    return Array.from(this.strategies.values())
      .sort((a, b) => b.fitness - a.fitness);
  }

  /**
   * Get current strategies
   */
  getStrategies(): StrategyGene[] {
    return Array.from(this.strategies.values())
      .sort((a, b) => b.fitness - a.fitness);
  }

  /**
   * Get evolution metrics
   */
  getMetrics(): EvolutionMetrics {
    return this.calculateEvolutionMetrics();
  }

  /**
   * Get market regimes
   */
  getMarketRegimes(): MarketRegime[] {
    return Array.from(this.marketRegimes.values());
  }
}

export default StrategyEvolutionEngine;
