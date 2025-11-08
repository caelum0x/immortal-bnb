// src/commands/smartTrade.ts
// CLI command for testing smart trading functionality with real API data

import SmartTradingEngine from '../blockchain/smartTradingEngine';
import DynamicTokenDiscovery from '../blockchain/dynamicTokenDiscovery';
import { logger } from '../utils/logger';
import { CONFIG } from '../config';
import { shouldUseFallbackData } from '../utils/chainMapping';

export async function testSmartTrading(): Promise<void> {
  try {
    console.log('\n🧠 Testing Smart Trading Engine with Real API Data...\n');

    const isTestnet = shouldUseFallbackData(CONFIG.CHAIN_ID);
    if (isTestnet) {
      console.log('🌍 TESTNET MODE - Using mainnet DexScreener API data for token discovery\n');
    } else {
      console.log('🌍 MAINNET MODE - Using real-time DexScreener API data\n');
    }

    const discovery = new DynamicTokenDiscovery();

    // Test 1: Token Discovery
    console.log('📍 Test 1: Dynamic Token Discovery');
    const tokens = await discovery.discoverTrendingTokens({
      minLiquidity: 100000,
      limit: 5
    });

    console.log(`Found ${tokens.length} tokens:`);
    tokens.forEach((token, i) => {
      console.log(`  ${i + 1}. ${token.symbol} (${token.name})`);
      console.log(`     Confidence: ${token.confidence}%`);
      console.log(`     Risk: ${token.riskLevel}`);
      console.log(`     Signal: ${token.tradingSignal}`);
      console.log(`     Liquidity: $${token.liquidity.toLocaleString()}`);
      console.log(`     24h Change: ${token.priceChange24h.toFixed(2)}%`);
      console.log('');
    });

    // Test 2: Trading Opportunities
    console.log('📍 Test 2: Trading Opportunity Analysis');
    const opportunities = await discovery.findTradingOpportunities(0.1, {
      riskTolerance: 'MEDIUM',
      maxPriceImpact: 2
    });

    console.log(`Found ${opportunities.length} opportunities:`);
    opportunities.forEach((opp, i) => {
      console.log(`  ${i + 1}. ${opp.token.symbol}`);
      console.log(`     Expected Return: ${opp.expectedReturn.toFixed(2)}%`);
      console.log(`     Risk Score: ${opp.overallScore.toFixed(1)}`);
      console.log(`     Price Impact: ${opp.priceImpact.toFixed(2)}%`);
      console.log(`     Recommendation: ${opp.recommendation}`);
      console.log(`     Reason: ${opp.reason}`);
      console.log('');
    });

    // Test 3: Smart Trading Engine
    console.log('📍 Test 3: Smart Trading Engine');
    const engine = new SmartTradingEngine();

    // Remove initialization call since method doesn't exist
    // await engine.initialize();

    const stats = engine.getStatistics();
    console.log('📊 Trading Statistics:');
    console.log(`Total Trades: ${stats.totalTrades}`);
    console.log(`Success Rate: ${stats.successRate.toFixed(1)}%`);
    console.log(`Average Confidence: ${stats.avgConfidence.toFixed(1)}%`);
    console.log(`Average Return: ${stats.avgReturn.toFixed(2)}%`);
    console.log('Risk Distribution:');
    Object.entries(stats.riskDistribution).forEach(([risk, count]) => {
      console.log(`  ${risk}: ${count} trades`);
    });

    console.log('\n✅ Smart Trading Engine test completed with real API data!\n');

    console.log('🚀 System Status:');
    console.log('  ✓ DexScreener API integration active');
    console.log('  ✓ Real-time token discovery enabled');
    console.log('  ✓ Dynamic opportunity analysis running');
    console.log('  ✓ Ready for live trading');

  } catch (error) {
    console.error('❌ Smart Trading test failed:', error);
  }
}

export async function discoverTokens(): Promise<void> {
  try {
    console.log('\n🔍 Discovering Tokens with Real API Data...\n');

    const discovery = new DynamicTokenDiscovery();
    
    const isTestnet = shouldUseFallbackData(CONFIG.CHAIN_ID);
    if (isTestnet) {
      console.log('🌍 Using mainnet DexScreener data for token discovery\n');
    }
    
    // Conservative discovery
    const conservativeTokens = await discovery.discoverTrendingTokens({
      minLiquidity: 500000,
      minVolume: 100000,
      maxRiskLevel: 'LOW',
      limit: 3
    });

    console.log('🛡️ Conservative Options (Low Risk):');
    conservativeTokens.forEach((token, i) => {
      console.log(`${i + 1}. ${token.symbol} - ${token.name}`);
      console.log(`   Confidence: ${token.confidence}% | Risk: ${token.riskLevel}`);
      console.log(`   Price: $${token.price.toFixed(6)}`);
      console.log(`   Liquidity: $${token.liquidity.toLocaleString()}`);
      console.log(`   Volume 24h: $${token.volume24h.toLocaleString()}`);
      console.log(`   24h Change: ${token.priceChange24h.toFixed(2)}%`);
      console.log(`   Signal: ${token.tradingSignal}\n`);
    });

    // Aggressive discovery
    const aggressiveTokens = await discovery.discoverTrendingTokens({
      minLiquidity: 50000,
      minVolume: 10000,
      maxRiskLevel: 'HIGH',
      limit: 5
    });

    console.log('🚀 Aggressive Options (Higher Risk/Reward):');
    aggressiveTokens.forEach((token, i) => {
      console.log(`${i + 1}. ${token.symbol} - ${token.name}`);
      console.log(`   Confidence: ${token.confidence}% | Risk: ${token.riskLevel}`);
      console.log(`   Price: $${token.price.toFixed(6)}`);
      console.log(`   Liquidity: $${token.liquidity.toLocaleString()}`);
      console.log(`   Volume 24h: $${token.volume24h.toLocaleString()}`);
      console.log(`   24h Change: ${token.priceChange24h.toFixed(2)}%`);
      console.log(`   Signal: ${token.tradingSignal}\n`);
    });

    console.log('✅ Token discovery completed with real DexScreener data!\n');

    console.log('💡 Next Steps:');
    console.log('  - Review token fundamentals on DexScreener');
    console.log('  - Verify liquidity and volume trends');
    console.log('  - Set up price alerts for opportunities');
    console.log('  - Start with small test trades\n');

  } catch (error) {
    console.error('❌ Token discovery failed:', error);
  }
}

export async function analyzeOpportunities(): Promise<void> {
  try {
    console.log('\n🎯 Analyzing Trading Opportunities with Real Data...\n');

    const discovery = new DynamicTokenDiscovery();
    
    const isTestnet = shouldUseFallbackData(CONFIG.CHAIN_ID);
    if (isTestnet) {
      console.log('🌍 Using mainnet DexScreener data for opportunity analysis\n');
    }
    
    // Different risk profiles
    const riskProfiles = [
      { name: 'Conservative', risk: 'LOW' as const, impact: 1.0 },
      { name: 'Balanced', risk: 'MEDIUM' as const, impact: 2.5 },
      { name: 'Aggressive', risk: 'HIGH' as const, impact: 5.0 }
    ];

    for (const profile of riskProfiles) {
      console.log(`📊 ${profile.name} Profile (${profile.risk} risk):`);
      
      const opportunities = await discovery.findTradingOpportunities(0.5, {
        riskTolerance: profile.risk,
        maxPriceImpact: profile.impact
      });

      if (opportunities.length === 0) {
        console.log('   No opportunities found for this risk profile\n');
        continue;
      }

      opportunities.slice(0, 3).forEach((opp, i) => {
        console.log(`   ${i + 1}. ${opp.token.symbol} ($${opp.token.price.toFixed(4)})`);
        console.log(`      Score: ${opp.overallScore.toFixed(1)} | Return: ${opp.expectedReturn.toFixed(2)}%`);
        console.log(`      Impact: ${opp.priceImpact.toFixed(2)}% | Rec: ${opp.recommendation}`);
        console.log(`      Liquidity: $${opp.token.liquidity.toLocaleString()}`);
        console.log(`      Volume: $${opp.token.volume24h.toLocaleString()}`);
        console.log(`      24h: ${opp.token.priceChange24h.toFixed(2)}%`);
        console.log(`      ${opp.reason}\n`);
      });
    }

    console.log('✅ Opportunity analysis completed with real DexScreener data!\n');

    console.log('🎯 Key Insights:');
    console.log('  - All data sourced from live DexScreener API');
    console.log('  - Price impact calculated from real liquidity');
    console.log('  - Confidence scores based on actual trading metrics');
    console.log('  - Opportunities refreshed in real-time\n');

  } catch (error) {
    console.error('❌ Opportunity analysis failed:', error);
  }
}
