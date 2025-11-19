/**
 * Polymarket Agent Orchestrator
 * Bridges TypeScript backend with Python Polymarket Agents
 * Provides high-level interface for autonomous trading
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';

export interface AgentConfig {
  maxTradeAmount: number;
  minConfidence: number;
  riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
  autoTrade: boolean;
  markets: string[];
}

export interface AgentDecision {
  marketId: string;
  marketQuestion: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  outcome: string;
  confidence: number;
  reasoning: string;
  suggestedAmount: number;
  timestamp: number;
}

export interface AgentTrade {
  tradeId: string;
  marketId: string;
  marketQuestion: string;
  outcome: string;
  side: 'BUY' | 'SELL';
  amount: number;
  price: number;
  status: 'PENDING' | 'EXECUTED' | 'FAILED';
  txHash?: string;
  error?: string;
  timestamp: number;
}

/**
 * Orchestrator for Polymarket Agents
 * Manages Python agent lifecycle and communication
 */
export class PolymarketAgentOrchestrator extends EventEmitter {
  private agentProcess: ChildProcess | null = null;
  private config: AgentConfig;
  private isRunning: boolean = false;
  private decisions: AgentDecision[] = [];
  private trades: AgentTrade[] = [];
  private agentsPath: string;

  constructor(config?: Partial<AgentConfig>) {
    super();

    this.config = {
      maxTradeAmount: config?.maxTradeAmount || 100,
      minConfidence: config?.minConfidence || 0.7,
      riskTolerance: config?.riskTolerance || 'MEDIUM',
      autoTrade: config?.autoTrade || false,
      markets: config?.markets || [],
    };

    this.agentsPath = path.join(process.cwd(), 'agents');
  }

  /**
   * Start the Polymarket agent
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Agent is already running');
    }

    try {
      logger.info('🤖 Starting Polymarket Agent...');

      // Check if agents directory exists
      const fs = require('fs');
      if (!fs.existsSync(this.agentsPath)) {
        throw new Error(`Agents directory not found: ${this.agentsPath}`);
      }

      // Set environment variables for Python agent
      const env = {
        ...process.env,
        PYTHONPATH: this.agentsPath,
        MAX_TRADE_AMOUNT: this.config.maxTradeAmount.toString(),
        MIN_CONFIDENCE: this.config.minConfidence.toString(),
        RISK_TOLERANCE: this.config.riskTolerance,
        AUTO_TRADE: this.config.autoTrade.toString(),
      };

      // Start Python agent process
      const pythonScript = path.join(this.agentsPath, 'agents', 'application', 'trade.py');

      this.agentProcess = spawn('python', [pythonScript], {
        cwd: this.agentsPath,
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Handle agent output
      this.agentProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        logger.info(`[Polymarket Agent] ${output}`);
        this.parseAgentOutput(output);
      });

      this.agentProcess.stderr?.on('data', (data) => {
        logger.error(`[Polymarket Agent Error] ${data.toString()}`);
      });

      this.agentProcess.on('close', (code) => {
        logger.info(`Polymarket Agent exited with code ${code}`);
        this.isRunning = false;
        this.emit('stopped', code);
      });

      this.agentProcess.on('error', (error) => {
        logger.error('Failed to start Polymarket Agent:', error);
        this.isRunning = false;
        this.emit('error', error);
      });

      this.isRunning = true;
      this.emit('started');

      logger.info('✅ Polymarket Agent started successfully');
    } catch (error) {
      logger.error('Failed to start Polymarket Agent:', error);
      throw error;
    }
  }

  /**
   * Stop the Polymarket agent
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.agentProcess) {
      return;
    }

    logger.info('🛑 Stopping Polymarket Agent...');

    return new Promise((resolve) => {
      this.agentProcess?.once('close', () => {
        this.isRunning = false;
        this.agentProcess = null;
        logger.info('✅ Polymarket Agent stopped');
        resolve();
      });

      this.agentProcess?.kill('SIGTERM');

      // Force kill after 5 seconds
      setTimeout(() => {
        if (this.agentProcess) {
          this.agentProcess.kill('SIGKILL');
        }
      }, 5000);
    });
  }

  /**
   * Parse agent output and emit events
   */
  private parseAgentOutput(output: string): void {
    try {
      // Look for JSON objects in output
      const jsonMatch = output.match(/\{.*\}/);
      if (!jsonMatch) return;

      const data = JSON.parse(jsonMatch[0]);

      // Handle different message types
      if (data.type === 'decision') {
        const decision: AgentDecision = {
          marketId: data.market_id,
          marketQuestion: data.market_question,
          action: data.action,
          outcome: data.outcome,
          confidence: data.confidence,
          reasoning: data.reasoning,
          suggestedAmount: data.suggested_amount,
          timestamp: Date.now(),
        };

        this.decisions.push(decision);
        this.emit('decision', decision);

        logger.info(`🧠 Agent Decision: ${decision.action} ${decision.outcome} (${(decision.confidence * 100).toFixed(1)}%)`);
      }

      if (data.type === 'trade') {
        const trade: AgentTrade = {
          tradeId: data.trade_id,
          marketId: data.market_id,
          marketQuestion: data.market_question,
          outcome: data.outcome,
          side: data.side,
          amount: data.amount,
          price: data.price,
          status: data.status,
          txHash: data.tx_hash,
          error: data.error,
          timestamp: Date.now(),
        };

        this.trades.push(trade);
        this.emit('trade', trade);

        logger.info(`💱 Agent Trade: ${trade.side} ${trade.amount} USDC @ ${trade.price} - ${trade.status}`);
      }
    } catch (error) {
      // Not JSON, ignore
    }
  }

  /**
   * Get recent decisions
   */
  getRecentDecisions(limit: number = 20): AgentDecision[] {
    return this.decisions.slice(-limit).reverse();
  }

  /**
   * Get recent trades
   */
  getRecentTrades(limit: number = 20): AgentTrade[] {
    return this.trades.slice(-limit).reverse();
  }

  /**
   * Get agent status
   */
  getStatus(): {
    isRunning: boolean;
    config: AgentConfig;
    totalDecisions: number;
    totalTrades: number;
    successfulTrades: number;
    failedTrades: number;
  } {
    const successfulTrades = this.trades.filter(t => t.status === 'EXECUTED').length;
    const failedTrades = this.trades.filter(t => t.status === 'FAILED').length;

    return {
      isRunning: this.isRunning,
      config: this.config,
      totalDecisions: this.decisions.length,
      totalTrades: this.trades.length,
      successfulTrades,
      failedTrades,
    };
  }

  /**
   * Update agent configuration
   */
  updateConfig(config: Partial<AgentConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    logger.info('✅ Agent configuration updated', this.config);
  }

  /**
   * Execute manual decision (override auto-trade)
   */
  async executeDecision(decision: AgentDecision): Promise<AgentTrade> {
    logger.info(`📤 Executing manual decision: ${decision.action} ${decision.outcome}`);

    // In a real implementation, this would call the Polymarket CLOB API
    // For now, we'll simulate the trade
    const trade: AgentTrade = {
      tradeId: `trade_${Date.now()}`,
      marketId: decision.marketId,
      marketQuestion: decision.marketQuestion,
      outcome: decision.outcome,
      side: decision.action as 'BUY' | 'SELL',
      amount: decision.suggestedAmount,
      price: 0.5, // Would get from market
      status: 'PENDING',
      timestamp: Date.now(),
    };

    this.trades.push(trade);
    this.emit('trade', trade);

    // Simulate trade execution
    setTimeout(() => {
      trade.status = 'EXECUTED';
      trade.txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      this.emit('trade-update', trade);
    }, 2000);

    return trade;
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.decisions = [];
    this.trades = [];
    logger.info('🗑️ Agent history cleared');
  }
}

// Singleton instance
export const polymarketAgentOrchestrator = new PolymarketAgentOrchestrator();

export default polymarketAgentOrchestrator;
