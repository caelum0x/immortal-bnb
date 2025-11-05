#!/usr/bin/env bun
/**
 * Comprehensive Bot Startup Script
 * Validates all connections before starting trading
 */

import 'reflect-metadata';
import { logger } from './src/utils/logger';
import { CONFIG } from './src/config';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function printBanner() {
  console.log('\n' + colors.cyan + colors.bright);
  console.log('═'.repeat(70));
  console.log('                    IMMORTAL AI TRADING BOT');
  console.log('                  BNB Chain • PancakeSwap V3');
  console.log('═'.repeat(70));
  console.log(colors.reset);
}

function printBox(title: string, content: string[]) {
  console.log('\n' + colors.bright + `📦 ${title}` + colors.reset);
  console.log('─'.repeat(70));
  content.forEach(line => console.log('  ' + line));
}

function success(message: string) {
  console.log(colors.green + '✓ ' + message + colors.reset);
}

function error(message: string) {
  console.log(colors.red + '✗ ' + message + colors.reset);
}

function warning(message: string) {
  console.log(colors.yellow + '⚠ ' + message + colors.reset);
}

function info(message: string) {
  console.log(colors.blue + 'ℹ ' + message + colors.reset);
}

async function checkEnvironment(): Promise<boolean> {
  printBox('Environment Configuration', []);

  let allValid = true;

  // Check required variables
  const required = [
    { key: 'WALLET_PRIVATE_KEY', name: 'Wallet Private Key' },
    { key: 'OPENROUTER_API_KEY', name: 'OpenRouter API Key' },
    { key: 'GREENFIELD_RPC_URL', name: 'Greenfield RPC' },
    { key: 'GREENFIELD_BUCKET_NAME', name: 'Greenfield Bucket' },
  ];

  for (const { key, name } of required) {
    const value = process.env[key];
    if (!value || value.includes('your_') || value.includes('here')) {
      error(`${name} not configured`);
      allValid = false;
    } else {
      success(`${name} configured`);
    }
  }

  // Check optional but recommended
  const optional = [
    { key: 'TELEGRAM_BOT_TOKEN', name: 'Telegram Bot Token' },
  ];

  for (const { key, name } of optional) {
    const value = process.env[key];
    if (!value || value.includes('your_') || value.includes('here')) {
      warning(`${name} not configured (optional)`);
    } else {
      success(`${name} configured`);
    }
  }

  // Display network configuration
  info(`Trading Network: ${CONFIG.TRADING_NETWORK}`);
  info(`Chain ID: ${CONFIG.CHAIN_ID}`);
  info(`Network Mode: ${CONFIG.NETWORK}`);

  return allValid;
}

async function checkBlockchainConnection(): Promise<boolean> {
  printBox('Blockchain Connection', []);

  try {
    const { initializeProvider, getWalletBalance } = await import('./src/blockchain/tradeExecutor');

    info('Connecting to blockchain...');
    await initializeProvider();
    success('PancakeSwap SDK initialized');

    const balance = await getWalletBalance();
    success(`Wallet connected: ${balance.toFixed(4)} BNB`);

    if (balance < 0.01) {
      warning('Low balance! Consider adding more testnet BNB');
      info('Get testnet BNB from:');
      if (CONFIG.TRADING_NETWORK === 'opbnb') {
        console.log('  → https://opbnb-testnet-bridge.bnbchain.org/faucet');
      } else {
        console.log('  → https://testnet.bnbchain.org/faucet-smart');
      }
    } else {
      success('Sufficient balance for trading');
    }

    return true;
  } catch (err) {
    error('Blockchain connection failed: ' + (err as Error).message);
    return false;
  }
}

async function checkGreenfieldConnection(): Promise<boolean> {
  printBox('BNB Greenfield Storage', []);

  try {
    const { fetchAllMemories } = await import('./src/blockchain/memoryStorage');

    info('Connecting to Greenfield...');
    const memoryIds = await fetchAllMemories();
    success(`Connected to Greenfield bucket: ${CONFIG.GREENFIELD_BUCKET_NAME}`);
    success(`Found ${memoryIds.length} stored memories`);

    return true;
  } catch (err) {
    error('Greenfield connection failed: ' + (err as Error).message);
    warning('Bot will continue but memories may not persist');
    return true; // Non-critical, allow bot to start
  }
}

async function checkMarketDataAPI(): Promise<boolean> {
  printBox('Market Data API', []);

  try {
    const { getTrendingTokens } = await import('./src/data/marketFetcher');

    info('Fetching trending tokens from DexScreener...');
    const trending = await getTrendingTokens(3);

    if (trending && trending.length > 0) {
      success(`DexScreener API connected`);
      success(`Found ${trending.length} trending tokens:`);
      trending.forEach(t => {
        console.log(`    → ${t.symbol} ($${t.priceUsd})`);
      });
      return true;
    } else {
      warning('No trending tokens found');
      return true; // Non-critical
    }
  } catch (err) {
    error('Market data API failed: ' + (err as Error).message);
    return false;
  }
}

async function checkOpenRouterAPI(): Promise<boolean> {
  printBox('AI Agent (OpenRouter)', []);

  try {
    info('Testing OpenRouter API connection...');

    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
      },
    });

    if (response.ok) {
      success('OpenRouter API connected');
      success('AI decision-making ready');
      return true;
    } else {
      error('OpenRouter API authentication failed');
      return false;
    }
  } catch (err) {
    error('OpenRouter API failed: ' + (err as Error).message);
    return false;
  }
}

async function checkTelegramBot(): Promise<boolean> {
  printBox('Telegram Alerts', []);

  if (!process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN.includes('your_')) {
    warning('Telegram not configured (optional)');
    info('Trade alerts will only appear in console logs');
    return true;
  }

  try {
    const { initializeTelegramBot } = await import('./src/alerts/telegramBot');

    info('Initializing Telegram bot...');
    await initializeTelegramBot();
    success('Telegram bot connected');
    success('Trade alerts will be sent to Telegram');
    return true;
  } catch (err) {
    warning('Telegram initialization failed: ' + (err as Error).message);
    info('Continuing without Telegram alerts');
    return true; // Non-critical
  }
}

async function startAPIServer(): Promise<boolean> {
  printBox('API Server', []);

  try {
    const { startAPIServer } = await import('./src/api/server');

    info('Starting Express API server...');
    startAPIServer();
    success(`API server running on port ${process.env.API_PORT || 3001}`);
    success('Frontend can connect to dashboard');

    console.log('\n  Available endpoints:');
    console.log(`    → http://localhost:${process.env.API_PORT || 3001}/api/health`);
    console.log(`    → http://localhost:${process.env.API_PORT || 3001}/api/status`);
    console.log(`    → http://localhost:${process.env.API_PORT || 3001}/api/trades`);
    console.log(`    → http://localhost:${process.env.API_PORT || 3001}/api/stats`);

    return true;
  } catch (err) {
    error('API server failed: ' + (err as Error).message);
    return false;
  }
}

async function runPreflightChecks(): Promise<boolean> {
  console.log(colors.bright + '\n🔍 Running Pre-flight Checks...\n' + colors.reset);

  const checks = [
    { name: 'Environment', fn: checkEnvironment },
    { name: 'Blockchain', fn: checkBlockchainConnection },
    { name: 'Greenfield', fn: checkGreenfieldConnection },
    { name: 'Market Data', fn: checkMarketDataAPI },
    { name: 'OpenRouter AI', fn: checkOpenRouterAPI },
    { name: 'Telegram', fn: checkTelegramBot },
    { name: 'API Server', fn: startAPIServer },
  ];

  const results: { name: string; passed: boolean }[] = [];

  for (const check of checks) {
    try {
      const passed = await check.fn();
      results.push({ name: check.name, passed });

      // Small delay between checks
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      error(`${check.name} check crashed: ${(err as Error).message}`);
      results.push({ name: check.name, passed: false });
    }
  }

  // Summary
  console.log('\n' + colors.bright + '📊 Pre-flight Check Summary' + colors.reset);
  console.log('═'.repeat(70));

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const critical = results.filter(r =>
    !r.passed && ['Environment', 'Blockchain', 'OpenRouter AI'].includes(r.name)
  );

  results.forEach(r => {
    if (r.passed) {
      console.log(`  ${colors.green}✓${colors.reset} ${r.name}`);
    } else {
      console.log(`  ${colors.red}✗${colors.reset} ${r.name}`);
    }
  });

  console.log('─'.repeat(70));
  console.log(`  ${passed}/${total} checks passed`);

  if (critical.length > 0) {
    console.log('\n' + colors.red + '❌ Critical checks failed!' + colors.reset);
    console.log('Fix the following before starting:');
    critical.forEach(c => console.log(`  • ${c.name}`));
    return false;
  }

  if (passed === total) {
    console.log('\n' + colors.green + '✅ All systems ready!' + colors.reset);
  } else {
    console.log('\n' + colors.yellow + '⚠️  Some optional services unavailable' + colors.reset);
    console.log('Bot will start with reduced functionality');
  }

  return true;
}

async function startTradingBot() {
  console.log('\n' + colors.bright + colors.green);
  console.log('═'.repeat(70));
  console.log('🚀 STARTING TRADING BOT');
  console.log('═'.repeat(70));
  console.log(colors.reset);

  // Import and start the main bot
  const { startBot } = await import('./src/index');

  console.log('\n' + colors.cyan + 'Bot Configuration:' + colors.reset);
  console.log(`  • Network: ${CONFIG.TRADING_NETWORK}`);
  console.log(`  • Chain ID: ${CONFIG.CHAIN_ID}`);
  console.log(`  • Max Trade: ${CONFIG.MAX_TRADE_AMOUNT_BNB} BNB`);
  console.log(`  • Stop Loss: ${CONFIG.STOP_LOSS_PERCENTAGE}%`);
  console.log(`  • Max Slippage: ${CONFIG.MAX_SLIPPAGE_PERCENTAGE}%`);
  console.log(`  • Loop Interval: ${CONFIG.BOT_LOOP_INTERVAL_MS / 1000 / 60} minutes`);
  console.log(`  • API Port: ${process.env.API_PORT || 3001}`);

  console.log('\n' + colors.bright + '🎯 Trading Strategy:' + colors.reset);
  console.log('  1. Fetch trending tokens from DexScreener');
  console.log('  2. Load historical memories from Greenfield');
  console.log('  3. AI analyzes market + past performance');
  console.log('  4. Execute trades if confidence > 70%');
  console.log('  5. Store outcomes in immortal memory');
  console.log('  6. Send alerts & repeat');

  console.log('\n' + colors.bright + '📡 Access Points:' + colors.reset);
  console.log(`  • Dashboard: http://localhost:3000`);
  console.log(`  • API: http://localhost:${process.env.API_PORT || 3001}`);
  console.log(`  • Logs: ./logs/app.log`);

  console.log('\n' + colors.yellow + '⚠️  Press Ctrl+C to stop the bot gracefully' + colors.reset);
  console.log('═'.repeat(70) + '\n');

  // Start the main bot (note: startBot is not exported yet, we need to fix that)
  // For now, we'll import and run the main function
  const { main } = await import('./src/index');
  await main();
}

async function main() {
  printBanner();

  console.log(colors.cyan + '  Version: 1.0.0' + colors.reset);
  console.log(colors.cyan + '  Mode: ' + (CONFIG.NETWORK === 'mainnet' ? 'PRODUCTION' : 'TESTNET') + colors.reset);
  console.log(colors.cyan + '  Network: ' + CONFIG.TRADING_NETWORK.toUpperCase() + colors.reset);

  if (CONFIG.NETWORK === 'mainnet') {
    console.log('\n' + colors.red + colors.bright + '⚠️  WARNING: RUNNING ON MAINNET!' + colors.reset);
    console.log(colors.red + '  This will spend REAL BNB!' + colors.reset);
    console.log(colors.yellow + '  Press Ctrl+C now to cancel, or wait 5 seconds to continue...' + colors.reset);
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Run pre-flight checks
  const ready = await runPreflightChecks();

  if (!ready) {
    console.log('\n' + colors.red + '❌ Cannot start bot - fix errors above' + colors.reset);
    console.log('\nCommon fixes:');
    console.log('  1. Copy .env.example to .env');
    console.log('  2. Add your WALLET_PRIVATE_KEY');
    console.log('  3. Add your OPENROUTER_API_KEY');
    console.log('  4. Configure Greenfield settings');
    console.log('\nSee README.md for detailed setup instructions.');
    process.exit(1);
  }

  // Wait a moment before starting
  console.log('\n' + colors.bright + 'Starting in 3 seconds...' + colors.reset);
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Start trading!
  await startTradingBot();
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('\n' + colors.red + colors.bright + '💥 Fatal Error!' + colors.reset);
    console.error(colors.red + error.message + colors.reset);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  });
}
