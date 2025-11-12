/**
 * Portfolio Screen - Detailed portfolio view with charts
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { getPortfolio, getMemoryAnalytics } from '../services/apiClient';
import { LineChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function PortfolioScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [portfolioData, analyticsData] = await Promise.all([
        getPortfolio(),
        getMemoryAnalytics(),
      ]);
      setPortfolio(portfolioData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ff00" />
        <Text style={styles.loadingText}>Loading portfolio...</Text>
      </View>
    );
  }

  const totalPnL = portfolio?.total?.combined_pnl || 0;
  const isProfitable = totalPnL > 0;

  // Prepare chart data
  const dexBalance = portfolio?.dex?.balance || 0;
  const polyBalance = portfolio?.polymarket?.balance || 0;

  const pieData = [
    {
      name: 'DEX (BNB)',
      population: dexBalance,
      color: '#00ff00',
      legendFontColor: '#fff',
      legendFontSize: 12,
    },
    {
      name: 'Polymarket (USDC)',
      population: polyBalance,
      color: '#00aaff',
      legendFontColor: '#fff',
      legendFontSize: 12,
    },
  ];

  // Mock historical P&L data (replace with real API)
  const lineData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [0.12, 0.18, 0.15, 0.25, 0.30, 0.28, totalPnL],
        color: (opacity = 1) => `rgba(0, 255, 0, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: '#1a1a1a',
    backgroundGradientFrom: '#1a1a1a',
    backgroundGradientTo: '#0a0a0a',
    decimalPlaces: 4,
    color: (opacity = 1) => `rgba(0, 255, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#00ff00',
    },
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00ff00" />
      }
    >
      {/* Total P&L Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Portfolio</Text>
        <View style={styles.pnlContainer}>
          <Text style={styles.pnlLabel}>Total P&L</Text>
          <Text style={[styles.pnlValue, isProfitable ? styles.profit : styles.loss]}>
            {isProfitable ? '+' : ''}{totalPnL.toFixed(4)} BNB
          </Text>
          <Text style={styles.usdValue}>
            ≈ ${(totalPnL * 600).toFixed(2)} USD
          </Text>
        </View>
      </View>

      {/* P&L Chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>P&L History (7 Days)</Text>
        <LineChart
          data={lineData}
          width={screenWidth - 50}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Balance Distribution */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Balance Distribution</Text>
        <PieChart
          data={pieData}
          width={screenWidth - 50}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
          style={styles.chart}
        />
      </View>

      {/* Detailed Balances */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Platform Balances</Text>

        {/* DEX */}
        <View style={styles.platformSection}>
          <Text style={styles.platformName}>🔷 DEX (BNB Chain)</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Balance:</Text>
            <Text style={styles.balanceValue}>{dexBalance.toFixed(4)} BNB</Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>P&L:</Text>
            <Text style={[styles.balanceValue, (portfolio?.dex?.pnl || 0) >= 0 ? styles.profit : styles.loss]}>
              {(portfolio?.dex?.pnl || 0) >= 0 ? '+' : ''}{(portfolio?.dex?.pnl || 0).toFixed(4)} BNB
            </Text>
          </View>
        </View>

        {/* Polymarket */}
        <View style={styles.platformSection}>
          <Text style={styles.platformName}>🎲 Polymarket (Polygon)</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Balance:</Text>
            <Text style={styles.balanceValue}>{polyBalance.toFixed(2)} USDC</Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>P&L:</Text>
            <Text style={[styles.balanceValue, (portfolio?.polymarket?.pnl || 0) >= 0 ? styles.profit : styles.loss]}>
              {(portfolio?.polymarket?.pnl || 0) >= 0 ? '+' : ''}{(portfolio?.polymarket?.pnl || 0).toFixed(2)} USDC
            </Text>
          </View>
        </View>
      </View>

      {/* Performance Metrics */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Performance Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Total Trades</Text>
            <Text style={styles.metricValue}>{analytics?.total?.trades || 0}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Win Rate</Text>
            <Text style={styles.metricValue}>
              {(analytics?.total?.winRate || 0).toFixed(1)}%
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Avg Profit</Text>
            <Text style={styles.metricValue}>
              {(totalPnL / (analytics?.total?.trades || 1)).toFixed(4)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Profit Factor</Text>
            <Text style={styles.metricValue}>
              {(analytics?.total?.profitFactor || 0).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  card: {
    backgroundColor: '#1a1a1a',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardTitle: {
    color: '#00ff00',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  pnlContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  pnlLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 5,
  },
  pnlValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profit: {
    color: '#00ff00',
  },
  loss: {
    color: '#ff0000',
  },
  usdValue: {
    color: '#999',
    fontSize: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  platformSection: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  platformName: {
    color: '#00aaff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  balanceLabel: {
    color: '#999',
    fontSize: 14,
  },
  balanceValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    backgroundColor: '#0a0a0a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  metricLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 5,
  },
  metricValue: {
    color: '#00ff00',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
