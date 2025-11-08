#!/usr/bin/env bun
/**
 * Bot Monitoring Script
 * Checks bot health, status, and performance metrics
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';

interface BotStatus {
  running: boolean;
  config?: any;
  uptime?: number;
}

interface TradingStats {
  totalTrades: number;
  profitableTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
}

async function fetchAPI(endpoint: string): Promise<any> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch ${endpoint}: ${(error as Error).message}`);
  }
}

async function checkHealth(): Promise<boolean> {
  try {
    const health = await fetchAPI('/health');
    return health.status === 'ok';
  } catch (error) {
    return false;
  }
}

async function getBotStatus(): Promise<BotStatus> {
  return await fetchAPI('/api/bot-status');
}

async function getTradingStats(): Promise<TradingStats> {
  return await fetchAPI('/api/trading-stats');
}

async function monitor(): Promise<void> {
  console.log('\n🤖 Immortal AI Trading Bot - Monitor');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check health
  console.log('🏥 Health Check...');
  const isHealthy = await checkHealth();
  if (isHealthy) {
    console.log('✅ Bot is healthy and responding\n');
  } else {
    console.log('❌ Bot is not responding!\n');
    console.log('Troubleshooting:');
    console.log('  1. Check if bot is running: ps aux | grep immortal');
    console.log('  2. Check logs: tail -f logs/combined.log');
    console.log('  3. Restart bot: bun run dev\n');
    process.exit(1);
  }

  // Get bot status
  console.log('📊 Bot Status...');
  try {
    const status = await getBotStatus();

    if (status.running) {
      console.log('✅ Bot is RUNNING');
      if (status.config) {
        console.log(`   Risk Level: ${status.config.riskLevel || 'N/A'}`);
        console.log(`   Max Trade Amount: ${status.config.maxTradeAmount || 'N/A'} BNB`);
        console.log(`   Stop Loss: ${status.config.stopLoss || 'N/A'}%`);
        console.log(`   Network: ${status.config.network || 'N/A'}`);
      }
    } else {
      console.log('⏸️  Bot is STOPPED');
      console.log('   Start bot via frontend dashboard or API');
    }
  } catch (error) {
    console.log(`❌ Failed to get bot status: ${(error as Error).message}`);
  }
  console.log('');

  // Get trading statistics
  console.log('📈 Trading Statistics...');
  try {
    const stats = await getTradingStats();

    console.log(`   Total Trades: ${stats.totalTrades || 0}`);
    console.log(`   Profitable: ${stats.profitableTrades || 0}`);
    console.log(`   Losing: ${stats.losingTrades || 0}`);
    console.log(`   Win Rate: ${(stats.winRate || 0).toFixed(2)}%`);
    console.log(`   Total Profit: ${(stats.totalProfit || 0).toFixed(4)} BNB`);
    console.log(`   Total Loss: ${(stats.totalLoss || 0).toFixed(4)} BNB`);
    console.log(`   Net Profit: ${(stats.netProfit || 0).toFixed(4)} BNB`);

    // Performance indicators
    if (stats.totalTrades > 0) {
      console.log('');
      if (stats.winRate >= 60) {
        console.log('   🎯 Performance: EXCELLENT (Win rate > 60%)');
      } else if (stats.winRate >= 50) {
        console.log('   ✅ Performance: GOOD (Win rate > 50%)');
      } else if (stats.winRate >= 40) {
        console.log('   ⚠️  Performance: MODERATE (Win rate 40-50%)');
      } else {
        console.log('   ❌ Performance: POOR (Win rate < 40%)');
        console.log('   Consider reviewing AI decision parameters');
      }

      if (stats.netProfit > 0) {
        console.log('   💰 Overall: PROFITABLE');
      } else {
        console.log('   💸 Overall: LOSING');
        console.log('   Consider reducing trade amounts or stopping bot');
      }
    }
  } catch (error) {
    console.log(`❌ Failed to get trading stats: ${(error as Error).message}`);
  }
  console.log('');

  // System information
  console.log('💻 System Information...');
  console.log(`   API URL: ${API_URL}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Network: ${process.env.NETWORK || 'testnet'}`);
  console.log('');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Monitoring complete\n');

  // Continuous monitoring mode
  if (process.argv.includes('--watch')) {
    console.log('⏰ Running in watch mode (refresh every 30s)');
    console.log('   Press Ctrl+C to exit\n');
    setTimeout(() => monitor(), 30000);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('\nUsage: bun run scripts/monitor.ts [options]');
  console.log('\nOptions:');
  console.log('  --watch, -w     Continuous monitoring (refresh every 30s)');
  console.log('  --help, -h      Show this help message');
  console.log('\nEnvironment Variables:');
  console.log('  API_URL         Bot API URL (default: http://localhost:3001)');
  console.log('\nExamples:');
  console.log('  bun run scripts/monitor.ts');
  console.log('  bun run scripts/monitor.ts --watch');
  console.log('  API_URL=http://my-server:3001 bun run scripts/monitor.ts\n');
  process.exit(0);
}

monitor().catch((error) => {
  console.error('\n❌ Monitoring failed:');
  console.error(error);
  process.exit(1);
});
