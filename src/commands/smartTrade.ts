// src/commands/smartTrade.ts
// CLI command for testing smart trading functionality

import SmartTradingEngine from '../blockchain/smartTradingEngine';
import DynamicTokenDiscovery from '../blockchain/dynamicTokenDiscovery';
import { logger } from '../utils/logger';

export async function testSmartTrading(): Promise<void> {
  try {
    console.log('\n🧠 Testing Smart Trading Engine...\n');

    const engine = new SmartTradingEngine();
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
      console.log(`     Overall Score: ${opp.overallScore.toFixed(1)}`);
      console.log(`     Expected Return: ${opp.expectedReturn.toFixed(2)}%`);
      console.log(`     Price Impact: ${opp.priceImpact.toFixed(2)}%`);
      console.log(`     Recommendation: ${opp.recommendation}`);
      console.log(`     Reason: ${opp.reason}`);
      console.log('');
    });

    // Test 3: Portfolio Recommendations
    console.log('📍 Test 3: Portfolio Recommendations');
    const portfolio = await engine.getPortfolioRecommendations(1.0, 'BALANCED');
    
    console.log(`Action: ${portfolio.action}`);
    console.log(`Total Score: ${portfolio.totalScore.toFixed(1)}`);
    console.log(`Risk Level: ${portfolio.riskLevel}`);
    console.log(`Recommended tokens: ${portfolio.tokens.length}`);
    
    portfolio.tokens.forEach((token, i) => {
      console.log(`  ${i + 1}. ${token.symbol}: ${token.allocation.toFixed(1)}%`);
      console.log(`     Reason: ${token.reason}`);
    });

    // Test 4: Statistics
    console.log('\n📍 Test 4: Engine Statistics');
    const stats = engine.getStatistics();
    console.log(`Total Trades: ${stats.totalTrades}`);
    console.log(`Success Rate: ${stats.successRate.toFixed(1)}%`);
    console.log(`Average Confidence: ${stats.avgConfidence.toFixed(1)}%`);
    console.log('Risk Distribution:');
    Object.entries(stats.riskDistribution).forEach(([risk, count]) => {
      console.log(`  ${risk}: ${count} trades`);
    });

    console.log('\n✅ Smart Trading Engine test completed!\n');

  } catch (error) {
    console.error('❌ Smart Trading test failed:', error);
  }
}

export async function discoverTokens(): Promise<void> {
  try {
    console.log('\n🔍 Discovering Tokens...\n');

    const discovery = new DynamicTokenDiscovery();
    
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
      console.log(`   Liquidity: $${token.liquidity.toLocaleString()}`);
      console.log(`   Volume 24h: $${token.volume24h.toLocaleString()}`);
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
      console.log(`   Liquidity: $${token.liquidity.toLocaleString()}`);
      console.log(`   Volume 24h: $${token.volume24h.toLocaleString()}`);
      console.log(`   Signal: ${token.tradingSignal}\n`);
    });

    console.log('✅ Token discovery completed!\n');

  } catch (error) {
    console.error('❌ Token discovery failed:', error);
  }
}

export async function analyzeOpportunities(): Promise<void> {
  try {
    console.log('\n🎯 Analyzing Trading Opportunities...\n');

    const discovery = new DynamicTokenDiscovery();
    
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
        console.log(`   ${i + 1}. ${opp.token.symbol}`);
        console.log(`      Score: ${opp.overallScore.toFixed(1)} | Return: ${opp.expectedReturn.toFixed(2)}%`);
        console.log(`      Impact: ${opp.priceImpact.toFixed(2)}% | Rec: ${opp.recommendation}`);
        console.log(`      ${opp.reason}\n`);
      });
    }

    console.log('✅ Opportunity analysis completed!\n');

  } catch (error) {
    console.error('❌ Opportunity analysis failed:', error);
  }
}
