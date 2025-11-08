#!/usr/bin/env bun
/**
 * CLI Tool for Managing Immortal AI Trading Bot
 *
 * Usage:
 *   bun cli.ts <command> [options]
 *
 * Commands:
 *   status      - Show bot status and wallet balance
 *   balance     - Show wallet balance
 *   trades      - List recent trades
 *   stats       - Show trading statistics
 *   test        - Test a single trade decision (no execution)
 *   memory      - View stored memories from Greenfield
 *   config      - Show current configuration
 */

import { CONFIG } from './src/config';
import { logger } from './src/utils/logger';
import { testSmartTrading, discoverTokens, analyzeOpportunities } from './src/commands/smartTrade';

const API_URL = `http://localhost:${process.env.API_PORT || 3001}`;

// Color codes
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function printHeader(title: string) {
  console.log('\n' + c.bright + c.cyan + '═'.repeat(70) + c.reset);
  console.log(c.bright + c.cyan + `  ${title}` + c.reset);
  console.log(c.bright + c.cyan + '═'.repeat(70) + c.reset + '\n');
}

function printTable(data: [string, string][]) {
  const maxKeyLength = Math.max(...data.map(([k]) => k.length));
  data.forEach(([key, value]) => {
    console.log(`  ${c.dim}${key.padEnd(maxKeyLength)}:${c.reset} ${value}`);
  });
}

async function checkAPIRunning(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}

async function commandStatus() {
  printHeader('Bot Status');

  const isRunning = await checkAPIRunning();

  if (!isRunning) {
    console.log(c.red + '  ✗ Bot is not running' + c.reset);
    console.log(c.dim + '\n  Start the bot with: bun run dev' + c.reset);
    console.log(c.dim + '  Or use: bun start-bot.ts' + c.reset);
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/status`);
    const data = await response.json();

    console.log(c.green + '  ✓ Bot is running' + c.reset + '\n');

    printTable([
      ['Status', data.status],
      ['Network', `${data.network} (Chain ID: ${data.chainId})`],
      ['Balance', `${data.balance.toFixed(4)} BNB`],
      ['Total Trades', data.totalTrades.toString()],
      ['Last Check', new Date(data.timestamp).toLocaleString()],
    ]);

    console.log(c.dim + '\n  API: ' + API_URL + c.reset);
  } catch (error) {
    console.log(c.red + '  ✗ Error fetching status: ' + (error as Error).message + c.reset);
  }
}

async function commandBalance() {
  printHeader('Wallet Balance');

  const isRunning = await checkAPIRunning();

  if (!isRunning) {
    console.log(c.red + '  ✗ Bot is not running' + c.reset);
    console.log(c.dim + '  Start the bot first: bun run dev' + c.reset);
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/wallet/balance`);
    const data = await response.json();

    printTable([
      ['Balance', `${data.balance.toFixed(6)} ${data.currency}`],
      ['Network', data.network],
      ['USD Value (est.)', `$${(data.balance * 300).toFixed(2)}`], // Rough estimate
    ]);

    console.log();
    if (data.balance < 0.01) {
      console.log(c.yellow + '  ⚠  Low balance! Get testnet BNB from faucet' + c.reset);
    } else if (data.balance < 0.1) {
      console.log(c.yellow + '  ⚠  Consider adding more BNB for trading' + c.reset);
    } else {
      console.log(c.green + '  ✓ Sufficient balance for trading' + c.reset);
    }
  } catch (error) {
    console.log(c.red + '  ✗ Error fetching balance: ' + (error as Error).message + c.reset);
  }
}

async function commandTrades(limit: number = 10) {
  printHeader(`Recent Trades (Last ${limit})`);

  const isRunning = await checkAPIRunning();

  if (!isRunning) {
    console.log(c.red + '  ✗ Bot is not running' + c.reset);
    console.log(c.dim + '  Start the bot first: bun run dev' + c.reset);
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/trades?limit=${limit}`);
    const data = await response.json();

    if (data.trades.length === 0) {
      console.log(c.dim + '  No trades yet. Bot will trade when it finds opportunities.' + c.reset);
      return;
    }

    console.log(c.dim + `  Showing ${data.trades.length} of ${data.total} total trades\n` + c.reset);

    data.trades.reverse().forEach((trade: any, i: number) => {
      const color = trade.outcome === 'profit' ? c.green :
                    trade.outcome === 'loss' ? c.red : c.yellow;

      const outcomeSymbol = trade.outcome === 'profit' ? '↑' :
                            trade.outcome === 'loss' ? '↓' : '•';

      console.log(c.bright + `  ${i + 1}. ${trade.tokenSymbol}` + c.reset);
      console.log(`     ${c.dim}Action:${c.reset} ${trade.action.toUpperCase()}`);
      console.log(`     ${c.dim}Amount:${c.reset} ${trade.amount.toFixed(4)} BNB`);
      console.log(`     ${c.dim}Entry:${c.reset} $${trade.entryPrice.toFixed(6)}`);
      console.log(`     ${c.dim}Outcome:${c.reset} ${color}${outcomeSymbol} ${trade.outcome}${c.reset}`);
      if (trade.profitLoss) {
        console.log(`     ${c.dim}P/L:${c.reset} ${color}${trade.profitLoss > 0 ? '+' : ''}${trade.profitLoss.toFixed(2)}%${c.reset}`);
      }
      console.log(`     ${c.dim}Time:${c.reset} ${new Date(trade.timestamp).toLocaleString()}`);
      console.log(`     ${c.dim}Reason:${c.reset} ${trade.aiReasoning.substring(0, 60)}...`);
      console.log();
    });
  } catch (error) {
    console.log(c.red + '  ✗ Error fetching trades: ' + (error as Error).message + c.reset);
  }
}

async function commandStats() {
  printHeader('Trading Statistics');

  const isRunning = await checkAPIRunning();

  if (!isRunning) {
    console.log(c.red + '  ✗ Bot is not running' + c.reset);
    console.log(c.dim + '  Start the bot first: bun run dev' + c.reset);
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/stats`);
    const stats = await response.json();

    if (stats.totalTrades === 0) {
      console.log(c.dim + '  No trades yet. Bot will start trading soon.' + c.reset);
      return;
    }

    printTable([
      ['Total Trades', stats.totalTrades.toString()],
      ['Completed', stats.completedTrades.toString()],
      ['Pending', stats.pendingTrades.toString()],
      ['Profitable', c.green + stats.profitableTrades.toString() + c.reset],
      ['Losing', c.red + stats.losingTrades.toString() + c.reset],
      ['Win Rate', `${stats.winRate.toFixed(1)}%`],
      ['Total P/L', stats.totalProfitLoss > 0
        ? c.green + `+${stats.totalProfitLoss.toFixed(2)}%` + c.reset
        : c.red + `${stats.totalProfitLoss.toFixed(2)}%` + c.reset
      ],
    ]);

    if (stats.bestTrade) {
      console.log('\n' + c.bright + '  Best Trade:' + c.reset);
      console.log(`    ${stats.bestTrade.tokenSymbol} - ${c.green}+${stats.bestTrade.profitLoss?.toFixed(2)}%${c.reset}`);
    }

    if (stats.worstTrade) {
      console.log('\n' + c.bright + '  Worst Trade:' + c.reset);
      console.log(`    ${stats.worstTrade.tokenSymbol} - ${c.red}${stats.worstTrade.profitLoss?.toFixed(2)}%${c.reset}`);
    }
  } catch (error) {
    console.log(c.red + '  ✗ Error fetching stats: ' + (error as Error).message + c.reset);
  }
}

async function commandMemory(limit: number = 5) {
  printHeader(`Immortal Memory (BNB Greenfield)`);

  try {
    const { fetchAllMemories, fetchMemory } = await import('./src/blockchain/memoryStorage');

    console.log(c.dim + '  Fetching memories from Greenfield...' + c.reset + '\n');

    const memoryIds = await fetchAllMemories();

    if (memoryIds.length === 0) {
      console.log(c.dim + '  No memories stored yet.' + c.reset);
      return;
    }

    console.log(`  Total memories: ${memoryIds.length}`);
    console.log(`  Showing last ${Math.min(limit, memoryIds.length)}:\n`);

    const recentIds = memoryIds.slice(-limit);
    for (const id of recentIds) {
      const memory = await fetchMemory(id);
      if (memory) {
        console.log(c.bright + `  ${memory.tokenSymbol}` + c.reset);
        console.log(`    ${c.dim}ID:${c.reset} ${id}`);
        console.log(`    ${c.dim}Action:${c.reset} ${memory.action}`);
        console.log(`    ${c.dim}Outcome:${c.reset} ${memory.outcome}`);
        console.log(`    ${c.dim}Time:${c.reset} ${new Date(memory.timestamp).toLocaleString()}`);
        console.log();
      }
    }

    console.log(c.green + '  ✓ Memories are immortal on Greenfield' + c.reset);
  } catch (error) {
    console.log(c.red + '  ✗ Error fetching memories: ' + (error as Error).message + c.reset);
  }
}

async function commandConfig() {
  printHeader('Bot Configuration');

  printTable([
    ['Network', CONFIG.TRADING_NETWORK],
    ['Chain ID', CONFIG.CHAIN_ID.toString()],
    ['RPC URL', CONFIG.RPC_URL],
    ['Environment', CONFIG.NETWORK],
    ['Max Trade Amount', `${CONFIG.MAX_TRADE_AMOUNT_BNB} BNB`],
    ['Stop Loss', `${CONFIG.STOP_LOSS_PERCENTAGE}%`],
    ['Max Slippage', `${CONFIG.MAX_SLIPPAGE_PERCENTAGE}%`],
    ['Loop Interval', `${CONFIG.BOT_LOOP_INTERVAL_MS / 1000 / 60} minutes`],
    ['PancakeSwap Router', CONFIG.PANCAKE_ROUTER],
    ['WBNB Address', CONFIG.WBNB_ADDRESS],
  ]);

  console.log('\n' + c.dim + '  Greenfield:' + c.reset);
  printTable([
    ['  RPC', CONFIG.GREENFIELD_RPC],
    ['  Bucket', CONFIG.GREENFIELD_BUCKET_NAME],
  ]);

  console.log('\n' + c.dim + '  API Keys:' + c.reset);
  printTable([
    ['  OpenRouter', CONFIG.OPENROUTER_API_KEY ? c.green + '✓ Configured' + c.reset : c.red + '✗ Missing' + c.reset],
    ['  Telegram', process.env.TELEGRAM_BOT_TOKEN ? c.green + '✓ Configured' + c.reset : c.yellow + '⚠ Not configured' + c.reset],
  ]);
}

async function commandTest(tokenAddress?: string) {
  printHeader('Test Trade Decision (No Execution)');

  if (!tokenAddress) {
    console.log(c.red + '  ✗ Token address required' + c.reset);
    console.log(c.dim + '\n  Usage: bun cli.ts test <token-address>' + c.reset);
    console.log(c.dim + '  Example: bun cli.ts test 0x...' + c.reset);
    return;
  }

  try {
    console.log(c.dim + `  Analyzing ${tokenAddress}...\n` + c.reset);

    const { getTokenData } = await import('./src/data/marketFetcher');
    const { fetchAllMemories } = await import('./src/blockchain/memoryStorage');

    // Fetch token data
    const tokenData = await getTokenData(tokenAddress);
    if (!tokenData) {
      console.log(c.red + '  ✗ Token not found on DexScreener' + c.reset);
      return;
    }

    console.log(c.bright + `  Token: ${tokenData.symbol}` + c.reset);
    printTable([
      ['Price', `$${tokenData.priceUsd}`],
      ['24h Change', `${tokenData.priceChange24h.toFixed(2)}%`],
      ['Volume', `$${tokenData.volume24h.toLocaleString()}`],
      ['Liquidity', `$${tokenData.liquidity.toLocaleString()}`],
      ['Buys/Sells', `${tokenData.txns24h.buys}/${tokenData.txns24h.sells}`],
    ]);

    // Get memories
    const memoryIds = await fetchAllMemories();
    console.log(c.dim + `\n  Historical memories: ${memoryIds.length}` + c.reset);

    console.log('\n' + c.yellow + '  ℹ This is a simulation - no actual trade will be executed' + c.reset);
    console.log(c.dim + '  To execute real trades, run: bun run dev' + c.reset);

  } catch (error) {
    console.log(c.red + '  ✗ Error: ' + (error as Error).message + c.reset);
  }
}

function showHelp() {
  console.log('\n' + c.bright + c.cyan + '🤖 Immortal AI Trading Bot - CLI Tool' + c.reset);
  console.log(c.dim + '\nManage and monitor your trading bot from the command line\n' + c.reset);

  console.log(c.bright + 'USAGE:' + c.reset);
  console.log('  bun cli.ts <command> [options]\n');

  console.log(c.bright + 'COMMANDS:' + c.reset);
  console.log('  ' + c.cyan + 'status' + c.reset + '              Show bot status and health');
  console.log('  ' + c.cyan + 'balance' + c.reset + '             Show wallet balance');
  console.log('  ' + c.cyan + 'trades [limit]' + c.reset + '      List recent trades (default: 10)');
  console.log('  ' + c.cyan + 'stats' + c.reset + '               Show trading statistics');
  console.log('  ' + c.cyan + 'memory [limit]' + c.reset + '      View Greenfield memories (default: 5)');
  console.log('  ' + c.cyan + 'test <address>' + c.reset + '      Test trade decision (no execution)');
  console.log('  ' + c.cyan + 'config' + c.reset + '              Show current configuration');
  console.log('');
  console.log(c.bright + '  🧠 SMART TRADING:' + c.reset);
  console.log('  ' + c.cyan + 'smart-test' + c.reset + '          Test smart trading engine');
  console.log('  ' + c.cyan + 'discover' + c.reset + '            Discover trending tokens');
  console.log('  ' + c.cyan + 'opportunities' + c.reset + '       Analyze trading opportunities');
  console.log('  ' + c.cyan + 'help' + c.reset + '                Show this help message');

  console.log('\n' + c.bright + 'EXAMPLES:' + c.reset);
  console.log('  bun cli.ts status');
  console.log('  bun cli.ts trades 20');
  console.log('  bun cli.ts test 0x...');
  console.log('  bun cli.ts memory 10');
  console.log('  bun cli.ts smart-test      # Test smart trading');
  console.log('  bun cli.ts discover        # Find trending tokens');
  console.log('  bun cli.ts opportunities   # Analyze opportunities');

  console.log('\n' + c.dim + 'For more information, see INTEGRATION_COMPLETE.md' + c.reset + '\n');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const param = args[1];

  switch (command) {
    case 'status':
      await commandStatus();
      break;
    case 'balance':
      await commandBalance();
      break;
    case 'trades':
      await commandTrades(param ? parseInt(param) : 10);
      break;
    case 'stats':
      await commandStats();
      break;
    case 'memory':
      await commandMemory(param ? parseInt(param) : 5);
      break;
    case 'test':
      await commandTest(param);
      break;
    case 'config':
      await commandConfig();
      break;
    case 'smart-test':
      await testSmartTrading();
      break;
    case 'discover':
      await discoverTokens();
      break;
    case 'opportunities':
      await analyzeOpportunities();
      break;
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
    default:
      if (command) {
        console.log(c.red + `\nUnknown command: ${command}` + c.reset);
      }
      showHelp();
  }
}

if (process.argv[1]?.includes('cli.ts')) {
  main().catch((error) => {
    console.error(c.red + '\nError: ' + error.message + c.reset);
    process.exit(1);
  });
}
