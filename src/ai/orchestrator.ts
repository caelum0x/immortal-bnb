/**
 * AI Orchestrator
 * Routes trading decisions to TypeScript or Python agents based on task complexity
 */

import { logger } from '../utils/logger.js';
import { ImmortalAIAgent } from './immortalAgent.js';
import { getPythonBridge } from '../services/pythonBridge.js';
import type { ImmortalMemory } from '../types/unifiedMemory.js';

export interface DecisionRequest {
  platform: 'dex' | 'polymarket' | 'cross-chain';
  asset: {
    tokenAddress?: string;
    tokenSymbol?: string;
    marketId?: string;
    marketQuestion?: string;
  };
  marketData: any;
  urgency: 'low' | 'medium' | 'high';
  requiresResearch: boolean;
}

export interface DecisionResponse {
  shouldTrade: boolean;
  confidence: number;
  reasoning: string;
  strategy: string;
  signals: string[];
  model: 'typescript-agent' | 'python-agent' | 'hybrid';
  estimatedProfit?: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export class AIOrchestrator {
  private tsAgent: ImmortalAIAgent;
  private pythonBridge: ReturnType<typeof getPythonBridge>;
  private performanceMetrics: Map<string, AgentMetrics>;

  constructor() {
    this.tsAgent = new ImmortalAIAgent();
    this.pythonBridge = getPythonBridge();
    this.performanceMetrics = new Map();

    // Initialize metrics
    this.performanceMetrics.set('typescript-agent', {
      totalDecisions: 0,
      successfulTrades: 0,
      avgLatency: 0,
      avgAccuracy: 0,
    });
    this.performanceMetrics.set('python-agent', {
      totalDecisions: 0,
      successfulTrades: 0,
      avgLatency: 0,
      avgAccuracy: 0,
    });
    this.performanceMetrics.set('hybrid', {
      totalDecisions: 0,
      successfulTrades: 0,
      avgLatency: 0,
      avgAccuracy: 0,
    });

    logger.info('🤖 AI Orchestrator initialized');
  }

  /**
   * Make a trading decision using the appropriate AI agent
   */
  async makeDecision(request: DecisionRequest): Promise<DecisionResponse> {
    const startTime = Date.now();

    try {
      // Route to appropriate agent based on task characteristics
      const agentType = this.selectAgent(request);
      logger.info(`🎯 Routing decision to ${agentType}`);

      let decision: DecisionResponse;

      switch (agentType) {
        case 'typescript-agent':
          decision = await this.useTypeScriptAgent(request);
          break;

        case 'python-agent':
          decision = await this.usePythonAgent(request);
          break;

        case 'hybrid':
          decision = await this.useHybridApproach(request);
          break;

        default:
          throw new Error(`Unknown agent type: ${agentType}`);
      }

      // Record metrics
      const latency = Date.now() - startTime;
      this.recordDecision(agentType, latency);

      decision.model = agentType;
      return decision;

    } catch (error) {
      logger.error('Error making decision:', error);
      throw error;
    }
  }

  /**
   * Select the most appropriate agent for the task
   */
  private selectAgent(request: DecisionRequest): 'typescript-agent' | 'python-agent' | 'hybrid' {
    // DEX trades: Use TypeScript agent (fast, low latency)
    if (request.platform === 'dex' && !request.requiresResearch) {
      return 'typescript-agent';
    }

    // Polymarket with high urgency: Use TypeScript agent
    if (request.platform === 'polymarket' && request.urgency === 'high') {
      return 'typescript-agent';
    }

    // Polymarket with research needed: Use Python agent (RAG, news, web search)
    if (request.platform === 'polymarket' && request.requiresResearch) {
      return 'python-agent';
    }

    // Cross-chain arbitrage: Use hybrid approach
    if (request.platform === 'cross-chain') {
      return 'hybrid';
    }

    // Default to Python agent for complex analysis
    return 'python-agent';
  }

  /**
   * Use TypeScript agent for decision
   */
  private async useTypeScriptAgent(request: DecisionRequest): Promise<DecisionResponse> {
    logger.info('🔷 Using TypeScript agent');

    try {
      // Load historical memories
      const memories = await this.tsAgent.loadMemories();

      // Make decision
      const decision = await this.tsAgent.shouldTrade(
        request.asset.tokenAddress || '',
        request.marketData
      );

      return {
        shouldTrade: decision.shouldTrade,
        confidence: decision.confidence,
        reasoning: decision.reasoning,
        strategy: decision.strategy || 'momentum',
        signals: decision.signals || [],
        model: 'typescript-agent',
        estimatedProfit: decision.estimatedProfit,
        riskLevel: this.calculateRiskLevel(decision.confidence),
      };
    } catch (error) {
      logger.error('TypeScript agent error:', error);
      throw error;
    }
  }

  /**
   * Use Python agent for decision
   */
  private async usePythonAgent(request: DecisionRequest): Promise<DecisionResponse> {
    logger.info('🐍 Using Python agent');

    try {
      // Check Python API availability
      const isHealthy = await this.pythonBridge.isServiceHealthy();
      if (!isHealthy) {
        logger.warn('Python API unavailable, falling back to TypeScript agent');
        return this.useTypeScriptAgent(request);
      }

      // Analyze market using Python AI
      const analysis = await this.pythonBridge.analyzeMarket({
        market_id: request.asset.marketId,
        event_title: request.asset.marketQuestion,
        use_rag: request.requiresResearch,
      });

      // Parse analysis and extract decision
      const shouldTrade = analysis.analysis?.includes('BUY') || analysis.analysis?.includes('bullish');
      const confidence = this.extractConfidence(analysis.analysis);

      return {
        shouldTrade,
        confidence,
        reasoning: analysis.analysis || 'Python agent analysis',
        strategy: 'rag-analysis',
        signals: ['python-ai'],
        model: 'python-agent',
        riskLevel: this.calculateRiskLevel(confidence),
      };
    } catch (error) {
      logger.error('Python agent error:', error);
      // Fallback to TypeScript agent
      return this.useTypeScriptAgent(request);
    }
  }

  /**
   * Use hybrid approach (both agents)
   */
  private async useHybridApproach(request: DecisionRequest): Promise<DecisionResponse> {
    logger.info('🔀 Using hybrid approach (TS + Python)');

    try {
      // Get decisions from both agents
      const [tsDecision, pyDecision] = await Promise.allSettled([
        this.useTypeScriptAgent(request),
        this.usePythonAgent(request),
      ]);

      // Extract results
      const tsResult = tsDecision.status === 'fulfilled' ? tsDecision.value : null;
      const pyResult = pyDecision.status === 'fulfilled' ? pyDecision.value : null;

      if (!tsResult && !pyResult) {
        throw new Error('Both agents failed');
      }

      if (!pyResult) {
        return tsResult!;
      }

      if (!tsResult) {
        return { ...pyResult, model: 'hybrid' };
      }

      // Combine decisions
      const combinedConfidence = (tsResult.confidence + pyResult.confidence) / 2;
      const shouldTrade = tsResult.shouldTrade && pyResult.shouldTrade;

      return {
        shouldTrade,
        confidence: combinedConfidence,
        reasoning: `TypeScript: ${tsResult.reasoning}\n\nPython: ${pyResult.reasoning}`,
        strategy: 'hybrid',
        signals: [...tsResult.signals, ...pyResult.signals],
        model: 'hybrid',
        estimatedProfit: tsResult.estimatedProfit || pyResult.estimatedProfit,
        riskLevel: this.calculateRiskLevel(combinedConfidence),
      };
    } catch (error) {
      logger.error('Hybrid approach error:', error);
      throw error;
    }
  }

  /**
   * Calculate risk level from confidence
   */
  private calculateRiskLevel(confidence: number): 'low' | 'medium' | 'high' {
    if (confidence >= 0.8) return 'low';
    if (confidence >= 0.65) return 'medium';
    return 'high';
  }

  /**
   * Extract confidence from analysis text
   */
  private extractConfidence(text: string): number {
    // Try to find percentage in text
    const match = text.match(/(\d+)%/);
    if (match) {
      return parseInt(match[1]) / 100;
    }

    // Default based on sentiment
    if (text.includes('strongly') || text.includes('definitely')) return 0.9;
    if (text.includes('likely') || text.includes('probable')) return 0.75;
    if (text.includes('possibly') || text.includes('maybe')) return 0.6;
    return 0.5;
  }

  /**
   * Record decision metrics
   */
  private recordDecision(agentType: string, latency: number): void {
    const metrics = this.performanceMetrics.get(agentType);
    if (metrics) {
      metrics.totalDecisions++;
      metrics.avgLatency = (metrics.avgLatency * (metrics.totalDecisions - 1) + latency) / metrics.totalDecisions;
      this.performanceMetrics.set(agentType, metrics);
    }
  }

  /**
   * Record trade outcome for learning
   */
  recordOutcome(agentType: string, success: boolean): void {
    const metrics = this.performanceMetrics.get(agentType);
    if (metrics) {
      if (success) {
        metrics.successfulTrades++;
      }
      metrics.avgAccuracy = metrics.successfulTrades / metrics.totalDecisions;
      this.performanceMetrics.set(agentType, metrics);
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): Record<string, AgentMetrics> {
    return Object.fromEntries(this.performanceMetrics);
  }

  /**
   * Get recommended agent based on performance
   */
  getRecommendedAgent(request: DecisionRequest): string {
    const defaultAgent = this.selectAgent(request);

    // Get metrics for all agents
    const metrics = this.getPerformanceMetrics();

    // Find best performing agent
    let bestAgent = defaultAgent;
    let bestAccuracy = 0;

    for (const [agentType, metric] of Object.entries(metrics)) {
      if (metric.totalDecisions > 10 && metric.avgAccuracy > bestAccuracy) {
        bestAccuracy = metric.avgAccuracy;
        bestAgent = agentType as any;
      }
    }

    return bestAgent;
  }
}

interface AgentMetrics {
  totalDecisions: number;
  successfulTrades: number;
  avgLatency: number;
  avgAccuracy: number;
}

// Singleton instance
let orchestrator: AIOrchestrator | null = null;

export function getOrchestrator(): AIOrchestrator {
  if (!orchestrator) {
    orchestrator = new AIOrchestrator();
  }
  return orchestrator;
}

export default AIOrchestrator;
