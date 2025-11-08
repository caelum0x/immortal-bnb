#!/usr/bin/env bun
/**
 * Performance Monitoring Script
 * Tracks and analyzes bot performance metrics
 */

import { promises as fs } from 'fs';
import { join } from 'path';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const LOG_DIR = process.env.LOG_DIR || './logs';
const PERF_LOG = join(LOG_DIR, 'performance.log');

interface PerformanceMetrics {
  timestamp: number;
  apiResponseTime: number;
  botStatus: string;
  tradingStats: any;
  systemMetrics: {
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    loadAverage: number[];
  };
}

interface PerformanceReport {
  period: string;
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  totalRequests: number;
  failedRequests: number;
  uptime: string;
  recommendations: string[];
}

/**
 * Measure API response time
 */
async function measureResponseTime(endpoint: string): Promise<number> {
  const start = Date.now();
  try {
    await fetch(`${API_URL}${endpoint}`);
    return Date.now() - start;
  } catch (error) {
    return -1; // Failed request
  }
}

/**
 * Get system metrics
 */
function getSystemMetrics() {
  return {
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    loadAverage: process.platform === 'linux' ? require('os').loadavg() : [0, 0, 0],
  };
}

/**
 * Fetch current metrics
 */
async function fetchMetrics(): Promise<PerformanceMetrics> {
  const healthTime = await measureResponseTime('/health');
  const statusTime = await measureResponseTime('/api/bot-status');
  const avgResponseTime = (healthTime + statusTime) / 2;

  let botStatus = 'unknown';
  let tradingStats = null;

  try {
    const statusRes = await fetch(`${API_URL}/api/bot-status`);
    const status = await statusRes.json();
    botStatus = status.running ? 'running' : 'stopped';

    const statsRes = await fetch(`${API_URL}/api/trading-stats`);
    tradingStats = await statsRes.json();
  } catch (error) {
    // API not available
  }

  return {
    timestamp: Date.now(),
    apiResponseTime: avgResponseTime,
    botStatus,
    tradingStats,
    systemMetrics: getSystemMetrics(),
  };
}

/**
 * Log metrics to file
 */
async function logMetrics(metrics: PerformanceMetrics): Promise<void> {
  const logEntry = JSON.stringify(metrics) + '\n';
  await fs.appendFile(PERF_LOG, logEntry, 'utf8');
}

/**
 * Read performance log
 */
async function readPerformanceLog(): Promise<PerformanceMetrics[]> {
  try {
    const data = await fs.readFile(PERF_LOG, 'utf8');
    return data
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
  } catch (error) {
    return [];
  }
}

/**
 * Generate performance report
 */
function generateReport(metrics: PerformanceMetrics[], period: string): PerformanceReport {
  if (metrics.length === 0) {
    return {
      period,
      avgResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: 0,
      totalRequests: 0,
      failedRequests: 0,
      uptime: '0s',
      recommendations: ['No data available'],
    };
  }

  const responseTimes = metrics
    .map((m) => m.apiResponseTime)
    .filter((t) => t > 0);

  const avgResponseTime =
    responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const maxResponseTime = Math.max(...responseTimes);
  const minResponseTime = Math.min(...responseTimes);
  const failedRequests = metrics.filter((m) => m.apiResponseTime === -1).length;

  // Calculate uptime
  const firstMetric = metrics[0];
  const lastMetric = metrics[metrics.length - 1];
  const uptimeMs = lastMetric.timestamp - firstMetric.timestamp;
  const uptimeStr = formatUptime(uptimeMs);

  // Generate recommendations
  const recommendations: string[] = [];

  if (avgResponseTime > 1000) {
    recommendations.push('⚠️  Average response time > 1s - Consider optimizing API endpoints');
  }

  if (maxResponseTime > 5000) {
    recommendations.push('⚠️  Max response time > 5s - Investigate slow endpoints');
  }

  if (failedRequests > metrics.length * 0.1) {
    recommendations.push('❌ High failure rate (>10%) - Check API server health');
  }

  const lastMetrics = metrics[metrics.length - 1];
  const memUsageMB = lastMetrics.systemMetrics.memoryUsage.heapUsed / 1024 / 1024;

  if (memUsageMB > 500) {
    recommendations.push('⚠️  High memory usage (>500MB) - Monitor for memory leaks');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All metrics within acceptable ranges');
  }

  return {
    period,
    avgResponseTime,
    maxResponseTime,
    minResponseTime,
    totalRequests: metrics.length,
    failedRequests,
    uptime: uptimeStr,
    recommendations,
  };
}

/**
 * Format uptime in human-readable format
 */
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Display current metrics
 */
async function displayCurrentMetrics(): Promise<void> {
  console.log('\n🔍 Current Performance Metrics\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const metrics = await fetchMetrics();

  // API Performance
  console.log('📡 API Performance:');
  console.log(`   Response Time: ${metrics.apiResponseTime}ms`);
  if (metrics.apiResponseTime < 100) {
    console.log('   Status: ✅ Excellent (<100ms)');
  } else if (metrics.apiResponseTime < 500) {
    console.log('   Status: ✅ Good (<500ms)');
  } else if (metrics.apiResponseTime < 1000) {
    console.log('   Status: ⚠️  Moderate (<1s)');
  } else {
    console.log('   Status: ❌ Slow (>1s)');
  }
  console.log('');

  // Bot Status
  console.log('🤖 Bot Status:');
  console.log(`   State: ${metrics.botStatus}`);
  if (metrics.tradingStats) {
    console.log(`   Total Trades: ${metrics.tradingStats.totalTrades || 0}`);
    console.log(`   Win Rate: ${(metrics.tradingStats.winRate || 0).toFixed(2)}%`);
  }
  console.log('');

  // System Metrics
  console.log('💻 System Resources:');
  const memUsageMB = metrics.systemMetrics.memoryUsage.heapUsed / 1024 / 1024;
  const memTotalMB = metrics.systemMetrics.memoryUsage.heapTotal / 1024 / 1024;
  console.log(`   Memory: ${memUsageMB.toFixed(2)}MB / ${memTotalMB.toFixed(2)}MB`);
  console.log(`   Uptime: ${formatUptime(metrics.systemMetrics.uptime * 1000)}`);
  if (process.platform === 'linux') {
    const [load1, load5, load15] = metrics.systemMetrics.loadAverage;
    console.log(`   Load Average: ${load1.toFixed(2)}, ${load5.toFixed(2)}, ${load15.toFixed(2)}`);
  }
  console.log('');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Display performance report
 */
async function displayReport(period: string = '1h'): Promise<void> {
  const allMetrics = await readPerformanceLog();

  if (allMetrics.length === 0) {
    console.log('\n⚠️  No performance data available');
    console.log('   Run with --collect to start collecting metrics\n');
    return;
  }

  // Filter metrics by period
  const now = Date.now();
  const periodMs = parsePeriod(period);
  const filteredMetrics = allMetrics.filter((m) => now - m.timestamp < periodMs);

  console.log('\n📊 Performance Report\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const report = generateReport(filteredMetrics, period);

  console.log(`Period: Last ${period}`);
  console.log(`Data Points: ${report.totalRequests}`);
  console.log(`Uptime: ${report.uptime}\n`);

  console.log('API Response Times:');
  console.log(`   Average: ${report.avgResponseTime.toFixed(2)}ms`);
  console.log(`   Min: ${report.minResponseTime}ms`);
  console.log(`   Max: ${report.maxResponseTime}ms\n`);

  console.log('Reliability:');
  console.log(`   Successful: ${report.totalRequests - report.failedRequests}`);
  console.log(`   Failed: ${report.failedRequests}`);
  const successRate = ((report.totalRequests - report.failedRequests) / report.totalRequests) * 100;
  console.log(`   Success Rate: ${successRate.toFixed(2)}%\n`);

  console.log('Recommendations:');
  report.recommendations.forEach((rec) => console.log(`   ${rec}`));
  console.log('');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Parse period string to milliseconds
 */
function parsePeriod(period: string): number {
  const match = period.match(/^(\d+)([smhd])$/);
  if (!match) return 3600000; // Default 1 hour

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 3600 * 1000;
    case 'd':
      return value * 86400 * 1000;
    default:
      return 3600000;
  }
}

/**
 * Collect metrics continuously
 */
async function collectMetrics(interval: number): Promise<void> {
  console.log('\n📈 Performance Monitoring Started\n');
  console.log(`Collecting metrics every ${interval / 1000}s`);
  console.log(`Logging to: ${PERF_LOG}`);
  console.log('Press Ctrl+C to stop\n');

  let count = 0;

  const collect = async () => {
    const metrics = await fetchMetrics();
    await logMetrics(metrics);
    count++;

    process.stdout.write(`\r✓ Collected ${count} data points`);
  };

  // Initial collection
  await collect();

  // Set up interval
  setInterval(collect, interval);
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Help
  if (args.includes('--help') || args.includes('-h')) {
    console.log('\nUsage: bun run scripts/performance.ts [options]');
    console.log('\nOptions:');
    console.log('  --current              Show current metrics');
    console.log('  --report <period>      Show performance report (e.g., 1h, 24h, 7d)');
    console.log('  --collect [interval]   Collect metrics continuously (interval in seconds, default: 60)');
    console.log('  --help, -h             Show this help message');
    console.log('\nExamples:');
    console.log('  bun run scripts/performance.ts --current');
    console.log('  bun run scripts/performance.ts --report 24h');
    console.log('  bun run scripts/performance.ts --collect 30\n');
    return;
  }

  // Current metrics
  if (args.includes('--current')) {
    await displayCurrentMetrics();
    return;
  }

  // Report
  if (args.includes('--report')) {
    const idx = args.indexOf('--report');
    const period = args[idx + 1] || '1h';
    await displayReport(period);
    return;
  }

  // Collect
  if (args.includes('--collect')) {
    const idx = args.indexOf('--collect');
    const intervalStr = args[idx + 1];
    const interval = intervalStr ? parseInt(intervalStr) * 1000 : 60000;
    await collectMetrics(interval);
    return;
  }

  // Default: show current metrics
  await displayCurrentMetrics();
}

main().catch((error) => {
  console.error('\n❌ Error:');
  console.error(error);
  process.exit(1);
});
