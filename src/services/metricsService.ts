/**
 * Prometheus Metrics Collection Service
 *
 * Provides comprehensive metrics for monitoring the Immortal BNB platform.
 * Metrics are exported on /metrics endpoint for Prometheus to scrape.
 */

import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import logger from '../utils/logger';

// Create a Registry
const register = new Registry();

// Collect default metrics (CPU, memory, event loop, etc.)
collectDefaultMetrics({ register });

// ============================================================================
// HTTP METRICS
// ============================================================================

/**
 * HTTP request duration in seconds
 * Histogram with buckets for percentile calculation
 */
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 1.5, 2, 3, 5, 10], // seconds
  registers: [register],
});

/**
 * HTTP request count
 * Counter to track total requests by endpoint
 */
export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

/**
 * HTTP request errors
 * Counter for failed requests
 */
export const httpRequestErrors = new Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP request errors',
  labelNames: ['method', 'route', 'error_type'],
  registers: [register],
});

// ============================================================================
// WEBSOCKET METRICS
// ============================================================================

/**
 * Active WebSocket connections
 * Gauge that can go up and down
 */
export const activeWebSocketConnections = new Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections',
  registers: [register],
});

/**
 * WebSocket messages sent
 * Counter for total messages sent to clients
 */
export const webSocketMessagesSent = new Counter({
  name: 'websocket_messages_sent_total',
  help: 'Total number of WebSocket messages sent',
  labelNames: ['message_type'],
  registers: [register],
});

// ============================================================================
// TRADING METRICS
// ============================================================================

/**
 * Total trades executed
 * Counter for all trades across all platforms
 */
export const tradesTotal = new Counter({
  name: 'trades_total',
  help: 'Total number of trades executed',
  labelNames: ['platform', 'side', 'status'],
  registers: [register],
});

/**
 * Trade execution duration
 * Histogram for trade execution time
 */
export const tradeExecutionDuration = new Histogram({
  name: 'trade_execution_duration_seconds',
  help: 'Duration of trade execution in seconds',
  labelNames: ['platform', 'side'],
  buckets: [0.5, 1, 2, 3, 5, 10, 15, 20, 30], // seconds
  registers: [register],
});

/**
 * Trade profit/loss
 * Histogram for P&L distribution
 */
export const tradeProfitLoss = new Histogram({
  name: 'trade_profit_loss',
  help: 'Trade profit or loss in USD/USDC',
  labelNames: ['platform'],
  buckets: [-1000, -500, -100, -50, -10, 0, 10, 50, 100, 500, 1000],
  registers: [register],
});

/**
 * Total trading volume
 * Counter for cumulative trading volume
 */
export const tradingVolumeTotal = new Counter({
  name: 'trading_volume_total',
  help: 'Total trading volume in USD/USDC',
  labelNames: ['platform'],
  registers: [register],
});

// ============================================================================
// POLYMARKET METRICS
// ============================================================================

/**
 * Polymarket API latency
 * Histogram for Gamma API response time
 */
export const polymarketApiLatency = new Histogram({
  name: 'polymarket_api_latency_seconds',
  help: 'Latency of Polymarket Gamma API requests',
  labelNames: ['endpoint'],
  buckets: [0.1, 0.3, 0.5, 1, 2, 3, 5], // seconds
  registers: [register],
});

/**
 * CLOB Bridge availability
 * Gauge indicating if CLOB bridge is available (1) or not (0)
 */
export const clobBridgeAvailable = new Gauge({
  name: 'clob_bridge_available',
  help: 'CLOB bridge availability status (1 = available, 0 = unavailable)',
  registers: [register],
});

/**
 * Polymarket markets fetched
 * Counter for markets fetched from Gamma API
 */
export const polymarketMarketsFetched = new Counter({
  name: 'polymarket_markets_fetched_total',
  help: 'Total number of markets fetched from Polymarket',
  registers: [register],
});

// ============================================================================
// AI AGENT METRICS
// ============================================================================

/**
 * Agent decisions made
 * Counter for AI agent decisions
 */
export const agentDecisions = new Counter({
  name: 'agent_decisions_total',
  help: 'Total number of AI agent decisions',
  labelNames: ['agent_type', 'decision'],
  registers: [register],
});

/**
 * Agent execution time
 * Histogram for agent decision-making time
 */
export const agentExecutionDuration = new Histogram({
  name: 'agent_execution_duration_seconds',
  help: 'Duration of AI agent execution',
  labelNames: ['agent_type'],
  buckets: [1, 5, 10, 30, 60, 120, 300], // seconds
  registers: [register],
});

/**
 * Active agents
 * Gauge for number of currently running agents
 */
export const activeAgents = new Gauge({
  name: 'agents_active',
  help: 'Number of active AI agents',
  labelNames: ['agent_type'],
  registers: [register],
});

/**
 * Agent errors
 * Counter for agent execution errors
 */
export const agentErrors = new Counter({
  name: 'agent_errors_total',
  help: 'Total number of agent errors',
  labelNames: ['agent_type', 'error_type'],
  registers: [register],
});

// ============================================================================
// SMART CONTRACT METRICS
// ============================================================================

/**
 * Contract calls
 * Counter for smart contract interactions
 */
export const contractCalls = new Counter({
  name: 'contract_calls_total',
  help: 'Total number of smart contract calls',
  labelNames: ['contract_type', 'method', 'status'],
  registers: [register],
});

/**
 * Contract call duration
 * Histogram for contract call latency
 */
export const contractCallDuration = new Histogram({
  name: 'contract_call_duration_seconds',
  help: 'Duration of smart contract calls',
  labelNames: ['contract_type', 'method'],
  buckets: [0.5, 1, 2, 5, 10, 20, 30], // seconds
  registers: [register],
});

/**
 * Gas used
 * Histogram for gas consumption
 */
export const gasUsed = new Histogram({
  name: 'gas_used',
  help: 'Gas used for transactions',
  labelNames: ['contract_type', 'method'],
  buckets: [21000, 50000, 100000, 200000, 500000, 1000000],
  registers: [register],
});

/**
 * Token balance
 * Gauge for current token balance
 */
export const tokenBalance = new Gauge({
  name: 'token_balance',
  help: 'Current token balance',
  labelNames: ['token_address'],
  registers: [register],
});

// ============================================================================
// DATABASE METRICS
// ============================================================================

/**
 * Database query duration
 * Histogram for database query performance
 */
export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1], // seconds
  registers: [register],
});

/**
 * Database connections
 * Gauge for active database connections
 */
export const databaseConnections = new Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections',
  registers: [register],
});

/**
 * Database errors
 * Counter for database errors
 */
export const databaseErrors = new Counter({
  name: 'database_errors_total',
  help: 'Total number of database errors',
  labelNames: ['operation', 'error_type'],
  registers: [register],
});

// ============================================================================
// BUSINESS METRICS
// ============================================================================

/**
 * Total users
 * Gauge for total registered users
 */
export const totalUsers = new Gauge({
  name: 'users_total',
  help: 'Total number of registered users',
  registers: [register],
});

/**
 * Active users (last 24h)
 * Gauge for daily active users
 */
export const activeUsers = new Gauge({
  name: 'users_active_daily',
  help: 'Number of active users in last 24 hours',
  registers: [register],
});

/**
 * Total staked amount
 * Gauge for total amount staked
 */
export const totalStaked = new Gauge({
  name: 'total_staked',
  help: 'Total amount staked across all pools',
  registers: [register],
});

/**
 * Total rewards paid
 * Counter for cumulative rewards
 */
export const totalRewardsPaid = new Counter({
  name: 'total_rewards_paid',
  help: 'Total rewards paid to stakers',
  registers: [register],
});

// ============================================================================
// SYSTEM METRICS
// ============================================================================

/**
 * Bot running status
 * Gauge indicating if bot is running (1) or stopped (0)
 */
export const botRunning = new Gauge({
  name: 'bot_running',
  help: 'Bot running status (1 = running, 0 = stopped)',
  labelNames: ['bot_type'],
  registers: [register],
});

/**
 * Last restart timestamp
 * Gauge for when the service last restarted
 */
export const lastRestartTimestamp = new Gauge({
  name: 'last_restart_timestamp',
  help: 'Timestamp of last service restart',
  registers: [register],
});

// Set initial restart timestamp
lastRestartTimestamp.set(Date.now());

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Middleware to track HTTP metrics
 */
export function trackHttpMetrics(req: any, res: any, next: any) {
  const start = Date.now();

  // Track when response finishes
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = req.route?.path || req.path || 'unknown';
    const method = req.method;
    const statusCode = res.statusCode.toString();

    // Record duration
    httpRequestDuration.labels(method, route, statusCode).observe(duration);

    // Increment counter
    httpRequestTotal.labels(method, route, statusCode).inc();

    // Track errors (4xx and 5xx)
    if (statusCode.startsWith('4') || statusCode.startsWith('5')) {
      const errorType = statusCode.startsWith('4') ? 'client_error' : 'server_error';
      httpRequestErrors.labels(method, route, errorType).inc();
    }
  });

  next();
}

/**
 * Track WebSocket connection
 */
export function trackWebSocketConnection(isConnecting: boolean) {
  if (isConnecting) {
    activeWebSocketConnections.inc();
  } else {
    activeWebSocketConnections.dec();
  }
}

/**
 * Track WebSocket message sent
 */
export function trackWebSocketMessage(messageType: string) {
  webSocketMessagesSent.labels(messageType).inc();
}

/**
 * Track trade execution
 */
export function trackTrade(
  platform: string,
  side: 'buy' | 'sell',
  status: 'success' | 'failed',
  duration: number,
  profitLoss?: number,
  volume?: number
) {
  tradesTotal.labels(platform, side, status).inc();
  tradeExecutionDuration.labels(platform, side).observe(duration);

  if (profitLoss !== undefined) {
    tradeProfitLoss.labels(platform).observe(profitLoss);
  }

  if (volume !== undefined) {
    tradingVolumeTotal.labels(platform).inc(volume);
  }
}

/**
 * Track Polymarket API call
 */
export function trackPolymarketApi(endpoint: string, duration: number) {
  polymarketApiLatency.labels(endpoint).observe(duration);
}

/**
 * Track AI agent decision
 */
export function trackAgentDecision(agentType: string, decision: string, duration: number) {
  agentDecisions.labels(agentType, decision).inc();
  agentExecutionDuration.labels(agentType).observe(duration);
}

/**
 * Track smart contract call
 */
export function trackContractCall(
  contractType: string,
  method: string,
  status: 'success' | 'failed',
  duration: number,
  gas?: number
) {
  contractCalls.labels(contractType, method, status).inc();
  contractCallDuration.labels(contractType, method).observe(duration);

  if (gas !== undefined) {
    gasUsed.labels(contractType, method).observe(gas);
  }
}

/**
 * Track database query
 */
export function trackDatabaseQuery(operation: string, table: string, duration: number) {
  databaseQueryDuration.labels(operation, table).observe(duration);
}

/**
 * Get metrics for Prometheus scraping
 */
export async function getMetrics(): Promise<string> {
  return register.metrics();
}

/**
 * Get metrics content type
 */
export function getMetricsContentType(): string {
  return register.contentType;
}

/**
 * Reset all metrics (useful for testing)
 */
export function resetMetrics() {
  register.resetMetrics();
}

/**
 * Metrics Service Class
 * Provides structured access to metrics
 */
export class MetricsService {
  private static instance: MetricsService;

  private constructor() {
    logger.info('✅ Metrics Service initialized');
  }

  static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  // HTTP tracking
  trackHttp = trackHttpMetrics;

  // WebSocket tracking
  trackWsConnection = trackWebSocketConnection;
  trackWsMessage = trackWebSocketMessage;

  // Trading tracking
  trackTrade = trackTrade;

  // Polymarket tracking
  trackPolymarketApi = trackPolymarketApi;
  updateClobBridgeStatus(available: boolean) {
    clobBridgeAvailable.set(available ? 1 : 0);
  }

  // Agent tracking
  trackAgentDecision = trackAgentDecision;
  updateActiveAgents(agentType: string, count: number) {
    activeAgents.labels(agentType).set(count);
  }
  trackAgentError(agentType: string, errorType: string) {
    agentErrors.labels(agentType, errorType).inc();
  }

  // Contract tracking
  trackContractCall = trackContractCall;
  updateTokenBalance(tokenAddress: string, balance: number) {
    tokenBalance.labels(tokenAddress).set(balance);
  }

  // Database tracking
  trackDatabaseQuery = trackDatabaseQuery;
  trackDatabaseError(operation: string, errorType: string) {
    databaseErrors.labels(operation, errorType).inc();
  }
  updateDatabaseConnections(count: number) {
    databaseConnections.set(count);
  }

  // Business metrics
  updateTotalUsers(count: number) {
    totalUsers.set(count);
  }
  updateActiveUsers(count: number) {
    activeUsers.set(count);
  }
  updateTotalStaked(amount: number) {
    totalStaked.set(amount);
  }
  addRewardsPaid(amount: number) {
    totalRewardsPaid.inc(amount);
  }

  // System metrics
  updateBotStatus(botType: string, running: boolean) {
    botRunning.labels(botType).set(running ? 1 : 0);
  }

  // Export metrics
  async getMetrics() {
    return getMetrics();
  }

  getContentType() {
    return getMetricsContentType();
  }
}

// Export singleton instance
export const metricsService = MetricsService.getInstance();

// Export the register for custom metrics
export { register };

export default metricsService;
