// test-dynamic-trading.ts
// Test script for the new dynamic token discovery and trading system

import { config } from 'dotenv';
import { logger } from './src/utils/logger';
import TokenDiscovery from './src/blockchain/tokenDiscovery';
import TradeDecisionEngine from './src/blockchain/tradeDecisionEngine';
import AutomatedTrader from './src/blockchain/automatedTrader';

config();

async function testTokenDiscovery() {
  console.log('\n🔍 Testing Token Discovery...\n');
  
  const discovery = new TokenDiscovery();
  
  // Test trending tokens discovery
  const trendingTokens = await discovery.discoverTrendingTokens({
    query: 'meme', // Search for meme tokens which are often trending
    limit: 10,
    sortBy: 'volume24h',
    filter: {
      minVolume24h: 1000,
      minLiquidityUsd: 10000,
      maxPriceChange24h: 300
    }
  });
  
  console.log(`Found ${trendingTokens.length} trending tokens:`);
  trendingTokens.forEach((token, i) => {
    console.log(`${i + 1}. ${token.symbol} - $${token.volume24h.toFixed(0)} vol, $${token.liquidityUsd.toFixed(0)} liq, ${token.priceChange24h.toFixed(1)}% change`);
  });
  
  // Test specific token lookup
  if (trendingTokens.length > 0 && trendingTokens[0]) {
    const testToken = trendingTokens[0];
    console.log(`\n📊 Testing specific token lookup for ${testToken.symbol}...`);
    
    const tokenInfo = await discovery.getTokenByAddress(testToken.tokenAddress);
    if (tokenInfo.length > 0 && tokenInfo[0]) {
      const token = tokenInfo[0];
      console.log(`  Token: ${token.symbol}`);
      console.log(`  Price: $${token.priceUsd.toFixed(8)}`);
      console.log(`  Volume 24h: $${token.volume24h.toFixed(0)}`);
      console.log(`  Liquidity: $${token.liquidityUsd.toFixed(0)}`);
      console.log(`  Transactions 24h: ${token.txCount?.h24 || 0}`);
    }
  }
  
  // Test market overview
  console.log('\n📈 Getting market overview...');
  const overview = await discovery.getMarketOverview();
  console.log(`  Average Volume: $${overview.avgVolume24h.toFixed(0)}`);
  console.log(`  Average Liquidity: $${overview.avgLiquidity.toFixed(0)}`);
  console.log(`  Total Pairs: ${overview.totalPairs}`);
}

async function testDecisionEngine() {
  console.log('\n🧠 Testing Trade Decision Engine...\n');
  
  // Check if we have proper configuration for blockchain operations
  const hasValidConfig = process.env.WALLET_PRIVATE_KEY && 
                        process.env.WALLET_PRIVATE_KEY !== 'your_test_wallet_private_key_here';
  
  if (!hasValidConfig) {
    console.log('⚠️  Skipping decision engine test - requires valid WALLET_PRIVATE_KEY in .env');
    console.log('   Decision engine would analyze tokens and make trading recommendations');
    console.log('   Features: liquidity analysis, price impact calculation, risk scoring');
    return;
  }
  
  const engine = new TradeDecisionEngine();
  const discovery = new TokenDiscovery();
  
  // Get some tokens to analyze
  const tokens = await discovery.discoverTrendingTokens({
    limit: 5,
    filter: {
      minVolume24h: 5000,
      minLiquidityUsd: 50000
    }
  });
  
  if (tokens.length === 0) {
    console.log('No tokens found for analysis');
    return;
  }
  
  console.log(`Analyzing ${tokens.length} tokens for trading opportunities...\n`);
  
  for (const token of tokens) {
    console.log(`\n🔍 Analyzing ${token.symbol}...`);
    
    const analysis = await engine.analyzeToken(token.tokenAddress, 0.05); // 0.05 BNB trade
    
    if (analysis) {
      console.log(`  Decision: ${analysis.decision.executable ? '✅ EXECUTABLE' : '❌ NOT EXECUTABLE'}`);
      console.log(`  Confidence: ${analysis.decision.confidence}%`);
      console.log(`  Reason: ${analysis.decision.reason}`);
      console.log(`  Risk Score: ${analysis.decision.riskScore}/100`);
      console.log(`  Liquidity Score: ${analysis.decision.liquidityScore?.toFixed(1)}x`);
      
      console.log(`  Technical Indicators:`);
      console.log(`    Volume Ratio: ${analysis.technicalIndicators.volumeRatio.toFixed(2)}x`);
      console.log(`    Liquidity Ratio: ${analysis.technicalIndicators.liquidityRatio.toFixed(2)}x`);
      console.log(`    Price Volatility: ${analysis.technicalIndicators.priceVolatility.toFixed(1)}%`);
    } else {
      console.log('  ❌ Analysis failed');
    }
  }
  
  // Test batch analysis
  console.log('\n📊 Testing batch analysis...');
  const batchAnalyses = await engine.analyzeBatch(tokens.slice(0, 3), 0.05);
  console.log(`Found ${batchAnalyses.length} executable opportunities from batch analysis`);
  
  // Test find best opportunities
  console.log('\n🎯 Testing opportunity finder...');
  const opportunities = await engine.findBestOpportunities(0.05, 3, 70);
  console.log(`Found ${opportunities.length} high-confidence opportunities`);
  
  opportunities.forEach((opp, i) => {
    console.log(`${i + 1}. ${opp.token.symbol} - ${opp.decision.confidence}% confidence`);
  });
}

async function testAutomatedTrader() {
  console.log('\n🤖 Testing Automated Trader (Demo Mode)...\n');
  
  // Check if we have proper configuration for blockchain operations
  const hasValidConfig = process.env.WALLET_PRIVATE_KEY && 
                        process.env.WALLET_PRIVATE_KEY !== 'your_test_wallet_private_key_here';
  
  if (!hasValidConfig) {
    console.log('⚠️  Skipping automated trader test - requires valid WALLET_PRIVATE_KEY in .env');
    console.log('   Automated trader would manage positions and execute trades');
    console.log('   Features: position monitoring, profit/loss tracking, risk management');
    return;
  }
  
  const trader = new AutomatedTrader({
    maxTradeAmount: 0.01, // Very small for testing
    minTradeAmount: 0.005,
    maxConcurrentTrades: 2,
    profitTargetPercent: 20, // Lower targets for testing
    stopLossPercent: 15,
    maxDailyTrades: 5,
    minConfidence: 70,
    discoveryInterval: 60000, // 1 minute for testing
    monitorInterval: 30000, // 30 seconds
    enableNewTokenListener: false // Disable for testing
  });
  
  console.log('📊 Current trading stats:');
  const stats = trader.getStats();
  console.log(`  Total Trades: ${stats.totalTrades}`);
  console.log(`  Win Rate: ${stats.winRate.toFixed(1)}%`);
  console.log(`  Total PnL: ${stats.totalPnl.toFixed(4)} BNB`);
  console.log(`  Open Positions: ${stats.openPositions}`);
  
  console.log('\n⚠️  Note: Automated trader start() not called to prevent actual trading');
  console.log('To enable real trading, call: await trader.start()');
  console.log('Then stop with: await trader.stop()');
}

async function main() {
  try {
    console.log('🚀 Dynamic Trading System Test Suite\n');
    console.log('Testing new token discovery and automated trading features...\n');
    
    // Test each component
    await testTokenDiscovery();
    await testDecisionEngine();
    await testAutomatedTrader();
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n📚 Usage Examples:');
    console.log('1. Token Discovery: const discovery = new TokenDiscovery();');
    console.log('2. Trade Analysis: const engine = new TradeDecisionEngine();');
    console.log('3. Automated Trading: const trader = new AutomatedTrader(config);');
    console.log('\n🔥 The system can now:');
    console.log('  - Discover trending tokens from DexScreener');
    console.log('  - Listen for new token launches');
    console.log('  - Analyze tokens for trading opportunities');
    console.log('  - Make data-driven trading decisions');
    console.log('  - Execute trades automatically');
    console.log('  - Monitor positions and exit conditions');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
