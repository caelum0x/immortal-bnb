/**
 * Prometheus Metrics for Monitoring
 * Tracks API performance, trading activity, and system health
 */

import { Registry, Counter, Histogram, Gauge } from 'prom-client';
import { logger } from '../utils/logger.js';

// Create a Registry
export const register = new Registry();

// Default labels for all metrics
register.setDefaultLabels({
  app: 'immortal-ai-trading-bot',
});

// =============================================================================
// HTTP METRICS
// =============================================================================

// HTTP request counter
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// HTTP request duration histogram
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// =============================================================================
// TRADING METRICS
// =============================================================================

// Total trades executed
export const tradesTotal = new Counter({
  name: 'trades_total',
  help: 'Total number of trades executed',
  labelNames: ['platform', 'outcome'],
  registers: [register],
});

// Trade profit/loss gauge
export const tradeProfitLoss = new Gauge({
  name: 'trade_profit_loss_total',
  help: 'Total profit/loss across all trades',
  labelNames: ['platform'],
  registers: [register],
});

// =============================================================================
// AI METRICS
// =============================================================================

// AI decisions counter
export const aiDecisionsTotal = new Counter({
  name: 'ai_decisions_total',
  help: 'Total number of AI decisions made',
  labelNames: ['agent_type', 'platform', 'decision'],
  registers: [register],
});

// AI decision confidence histogram
export const aiDecisionConfidence = new Histogram({
  name: 'ai_decision_confidence',
  help: 'Distribution of AI decision confidence scores',
  labelNames: ['agent_type'],
  buckets: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  registers: [register],
});

// =============================================================================
// MEMORY METRICS
// =============================================================================

// Memories stored counter
export const memoriesStored = new Counter({
  name: 'memories_stored_total',
  help: 'Total number of memories stored on Greenfield',
  labelNames: ['platform', 'chain'],
  registers: [register],
});

// Memory sync status gauge
export const memorySyncPending = new Gauge({
  name: 'memory_sync_pending',
  help: 'Number of memories pending synchronization',
  registers: [register],
});

// =============================================================================
// WEBSOCKET METRICS
// =============================================================================

// Connected WebSocket clients
export const websocketConnections = new Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections',
  registers: [register],
});

// WebSocket messages sent
export const websocketMessagesSent = new Counter({
  name: 'websocket_messages_sent_total',
  help: 'Total number of WebSocket messages sent',
  labelNames: ['event_type'],
  registers: [register],
});

// =============================================================================
// BLOCKCHAIN METRICS
// =============================================================================

// Wallet balance gauge
export const walletBalance = new Gauge({
  name: 'wallet_balance',
  help: 'Current wallet balance',
  labelNames: ['chain', 'token'],
  registers: [register],
});

// =============================================================================
// PYTHON API METRICS
// =============================================================================

// Python API health status
export const pythonApiHealth = new Gauge({
  name: 'python_api_health',
  help: 'Python API health status (1=healthy, 0=unhealthy)',
  registers: [register],
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Middleware to track HTTP metrics
 */
export function metricsMiddleware(req: any, res: any, next: any) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || 'unknown';
    const statusCode = res.statusCode.toString();
    
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: statusCode,
    });
    
    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: statusCode,
      },
      duration
    );
  });
  
  next();
}

/**
 * Record a trade execution
 */
export function recordTrade(platform: string, outcome: string, profitLoss: number) {
  tradesTotal.inc({ platform, outcome });
  tradeProfitLoss.set({ platform }, profitLoss);
  logger.info(`📊 Recorded trade: ${platform} ${outcome} (${profitLoss} P/L)`);
}

/**
 * Record an AI decision
 */
export function recordAIDecision(
  agentType: string,
  platform: string,
  decision: string,
  confidence: number
) {
  aiDecisionsTotal.inc({ agent_type: agentType, platform, decision });
  aiDecisionConfidence.observe({ agent_type: agentType }, confidence);
}

/**
 * Update wallet balance metric
 */
export function updateWalletBalance(chain: string, token: string, balance: number) {
  walletBalance.set({ chain, token }, balance);
}

/**
 * Update Python API health
 */
export function updatePythonApiHealth(isHealthy: boolean) {
  pythonApiHealth.set(isHealthy ? 1 : 0);
}

logger.info('📊 Prometheus metrics initialized');
