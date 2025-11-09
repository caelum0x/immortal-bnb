#!/usr/bin/env bun
/**
 * Polymarket Integration Test Script
 *
 * Tests all Polymarket functionality:
 * - Connection to Polymarket CLOB
 * - Market data fetching
 * - AI analysis
 * - Multi-chain wallet
 * - Cross-platform strategies
 */

import { polymarketService } from './src/polymarket/polymarketClient';
import { polymarketDataFetcher } from './src/polymarket/marketDataFetcher';
import { aiPredictionAnalyzer } from './src/polymarket/aiPredictionAnalyzer';
import { getMultiChainWallet } from './src/blockchain/multiChainWalletManager';
import { crossPlatformStrategy } from './src/polymarket/crossPlatformStrategy';
import { logger } from './src/utils/logger';
import { CONFIG } from './src/config';

async function testPolymarketConnection() {
  console.log('\n========================================');
  console.log('🔍 TEST 1: Polymarket Connection');
  console.log('========================================\n');

  try {
    const isEnabled = polymarketService.isEnabled();
    console.log('✅ Polymarket Enabled:', isEnabled);

    const address = polymarketService.getAddress();
    console.log('✅ Wallet Address:', address);

    const usdcBalance = await polymarketService.getUSDCBalance();
    console.log(`✅ USDC Balance: $${usdcBalance.toFixed(2)}`);

    const maticBalance = await polymarketService.getMATICBalance();
    console.log(`✅ MATIC Balance: ${maticBalance.toFixed(4)} MATIC`);

    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
}

async function testMarketDataFetching() {
  console.log('\n========================================');
  console.log('📊 TEST 2: Market Data Fetching');
  console.log('========================================\n');

  try {
    // Get trending markets
    console.log('Fetching trending markets...');
    const trending = await polymarketDataFetcher.getTrendingMarkets(5);
    console.log(`✅ Found ${trending.length} trending markets`);

    if (trending.length > 0) {
      console.log('\nTop Market:');
      console.log(`  Question: ${trending[0].question}`);
      console.log(`  Volume: $${trending[0].volume.toLocaleString()}`);
      console.log(`  Liquidity: $${trending[0].liquidity.toLocaleString()}`);
    }

    // Get liquid markets
    console.log('\nFetching liquid markets...');
    const liquid = await polymarketDataFetcher.getLiquidMarkets(500, 5);
    console.log(`✅ Found ${liquid.length} liquid markets`);

    // Get market stats
    console.log('\nFetching market statistics...');
    const stats = await polymarketDataFetcher.getMarketStats();
    console.log(`✅ Total Markets: ${stats.totalMarkets}`);
    console.log(`✅ Total Volume: $${stats.totalVolume.toLocaleString()}`);
    console.log(`✅ Total Liquidity: $${stats.totalLiquidity.toLocaleString()}`);

    return true;
  } catch (error) {
    console.error('❌ Market data test failed:', error);
    return false;
  }
}

async function testMarketAnalysis() {
  console.log('\n========================================');
  console.log('🤖 TEST 3: AI Market Analysis');
  console.log('========================================\n');

  try {
    // Get a market to analyze
    const markets = await polymarketDataFetcher.getTrendingMarkets(3);

    if (markets.length === 0) {
      console.log('⚠️  No markets available for analysis');
      return true;
    }

    const market = markets[0];
    console.log(`Analyzing market: ${market.question.substring(0, 60)}...`);

    // Basic analysis
    const opportunity = await polymarketDataFetcher.analyzeMarket(market.id);

    if (opportunity) {
      console.log('\nBasic Analysis:');
      console.log(`  Signal: ${opportunity.signal}`);
      console.log(`  Confidence: ${(opportunity.confidence * 100).toFixed(1)}%`);
      console.log(`  Current Price: ${(opportunity.currentPrice * 100).toFixed(1)}%`);
      console.log(`  Spread: ${(opportunity.spread * 100).toFixed(2)}%`);
      console.log(`  Reasoning: ${opportunity.reasoning}`);
    }

    // AI analysis (only if OpenRouter is configured)
    if (CONFIG.OPENROUTER_API_KEY) {
      console.log('\nRunning AI analysis...');
      const aiAnalysis = await aiPredictionAnalyzer.analyzeMarket(market);

      console.log('\nAI Analysis:');
      console.log(`  Recommendation: ${aiAnalysis.recommendation}`);
      console.log(`  Confidence: ${(aiAnalysis.confidence * 100).toFixed(1)}%`);
      console.log(`  Suggested Price: ${(aiAnalysis.suggestedPrice * 100).toFixed(1)}%`);
      console.log(`  Suggested Size: $${aiAnalysis.suggestedSize.toFixed(2)}`);
      console.log(`  Risk Level: ${aiAnalysis.riskLevel}`);
      console.log(`  Reasoning: ${aiAnalysis.reasoning.substring(0, 100)}...`);
    } else {
      console.log('⚠️  OpenRouter API key not set, skipping AI analysis');
    }

    return true;
  } catch (error) {
    console.error('❌ Analysis test failed:', error);
    return false;
  }
}

async function testMultiChainWallet() {
  console.log('\n========================================');
  console.log('💰 TEST 4: Multi-Chain Wallet');
  console.log('========================================\n');

  try {
    const wallet = getMultiChainWallet();

    console.log(`Wallet Address: ${wallet.getAddress()}`);

    // Get balances across all chains
    const balances = await wallet.getAllNativeBalances();

    console.log('\nNative Balances:');
    for (const balance of balances) {
      console.log(`  ${balance.chain}: ${balance.nativeBalance.toFixed(6)} ${balance.nativeSymbol}`);
    }

    // Get USDC balance
    const usdcBalance = await wallet.getUSDCBalance();
    console.log(`  Polygon: ${usdcBalance.toFixed(2)} USDC`);

    // Get wallet status
    const status = await wallet.getWalletStatus();
    console.log('\n✅ Multi-chain wallet operational');

    return true;
  } catch (error) {
    console.error('❌ Multi-chain wallet test failed:', error);
    return false;
  }
}

async function testCrossPlatformStrategy() {
  console.log('\n========================================');
  console.log('🎯 TEST 5: Cross-Platform Strategy');
  console.log('========================================\n');

  try {
    console.log('Scanning for cross-platform opportunities...');
    const opportunities = await crossPlatformStrategy.scanOpportunities();

    console.log(`✅ Found ${opportunities.length} opportunities`);

    if (opportunities.length > 0) {
      console.log('\nTop 3 Opportunities:');
      for (let i = 0; i < Math.min(3, opportunities.length); i++) {
        const opp = opportunities[i];
        console.log(`\n${i + 1}. ${opp.type} - ${opp.description.substring(0, 60)}...`);
        console.log(`   Confidence: ${(opp.confidence * 100).toFixed(1)}%`);
        console.log(`   Expected Profit: $${opp.expectedProfit.toFixed(2)}`);
        console.log(`   Risk Level: ${opp.riskLevel}`);
        console.log(`   Actions: ${opp.actions.length}`);
      }
    }

    // Get performance
    const performance = crossPlatformStrategy.getPerformance();
    console.log('\nStrategy Performance:');
    console.log(`  Total Trades: ${performance.totalTrades}`);
    console.log(`  Win Rate: ${(performance.winRate * 100).toFixed(1)}%`);

    return true;
  } catch (error) {
    console.error('❌ Cross-platform strategy test failed:', error);
    return false;
  }
}

async function testArbitrageDetection() {
  console.log('\n========================================');
  console.log('💎 TEST 6: Arbitrage Detection');
  console.log('========================================\n');

  try {
    console.log('Scanning for arbitrage opportunities...');
    const arbitrage = await polymarketDataFetcher.findArbitrageOpportunities();

    console.log(`✅ Found ${arbitrage.length} potential arbitrage opportunities`);

    if (arbitrage.length > 0) {
      console.log('\nTop Arbitrage Opportunity:');
      const top = arbitrage[0];
      console.log(`  ${top.question}`);
      console.log(`  Signal: ${top.signal}`);
      console.log(`  Confidence: ${(top.confidence * 100).toFixed(1)}%`);
      console.log(`  Spread: ${(top.spread * 100).toFixed(2)}%`);
      console.log(`  Reasoning: ${top.reasoning}`);
    }

    return true;
  } catch (error) {
    console.error('❌ Arbitrage detection test failed:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   POLYMARKET INTEGRATION TEST SUITE    ║');
  console.log('╚════════════════════════════════════════╝');

  const results: { name: string; passed: boolean }[] = [];

  // Check if Polymarket is enabled
  if (!CONFIG.POLYMARKET_ENABLED) {
    console.log('\n⚠️  Polymarket is disabled in .env');
    console.log('Set POLYMARKET_ENABLED=true to run tests\n');
    return;
  }

  // Run tests
  results.push({ name: 'Connection', passed: await testPolymarketConnection() });
  results.push({ name: 'Market Data', passed: await testMarketDataFetching() });
  results.push({ name: 'AI Analysis', passed: await testMarketAnalysis() });
  results.push({ name: 'Multi-Chain Wallet', passed: await testMultiChainWallet() });
  results.push({ name: 'Cross-Platform Strategy', passed: await testCrossPlatformStrategy() });
  results.push({ name: 'Arbitrage Detection', passed: await testArbitrageDetection() });

  // Summary
  console.log('\n========================================');
  console.log('📊 TEST SUMMARY');
  console.log('========================================\n');

  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  });

  console.log(`\n${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Polymarket integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }

  console.log('\n========================================');
  console.log('Next Steps:');
  console.log('========================================');
  console.log('1. Get Polygon testnet MATIC from faucet');
  console.log('2. Get testnet USDC for Polymarket trading');
  console.log('3. Start automated trading with crossPlatformStrategy');
  console.log('4. Monitor trades and performance');
  console.log('========================================\n');
}

// Run tests
runAllTests().catch(console.error);
