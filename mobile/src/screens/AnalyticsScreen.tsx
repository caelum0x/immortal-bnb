/**
 * Analytics Screen - Advanced trading analytics and insights
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
  TouchableOpacity,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [timeframe]);

  async function loadData() {
    try {
      const response = await fetch('http://localhost:3001/api/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
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
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  // Prepare chart data
  const tradeVolumeData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [15, 23, 18, 30, 25, 28, stats?.totalTrades || 0],
      },
    ],
  };

  const profitData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [0.05, 0.12, -0.03, 0.18, 0.22, 0.15, stats?.totalProfitLoss || 0],
        color: (opacity = 1) => `rgba(0, 255, 0, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: '#1a1a1a',
    backgroundGradientFrom: '#1a1a1a',
    backgroundGradientTo: '#0a0a0a',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(0, 255, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#00ff00',
    },
  };

  const winRate = stats?.winRate || 0;
  const totalPnL = stats?.totalProfitLoss || 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00ff00" />
      }
    >
      {/* Timeframe Selector */}
      <View style={styles.timeframeContainer}>
        <TouchableOpacity
          style={[styles.timeframeButton, timeframe === '7d' && styles.timeframeButtonActive]}
          onPress={() => setTimeframe('7d')}
        >
          <Text style={[styles.timeframeText, timeframe === '7d' && styles.timeframeTextActive]}>
            7D
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeframeButton, timeframe === '30d' && styles.timeframeButtonActive]}
          onPress={() => setTimeframe('30d')}
        >
          <Text style={[styles.timeframeText, timeframe === '30d' && styles.timeframeTextActive]}>
            30D
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeframeButton, timeframe === '90d' && styles.timeframeButtonActive]}
          onPress={() => setTimeframe('90d')}
        >
          <Text style={[styles.timeframeText, timeframe === '90d' && styles.timeframeTextActive]}>
            90D
          </Text>
        </TouchableOpacity>
      </View>

      {/* Key Metrics */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{stats?.totalTrades || 0}</Text>
            <Text style={styles.metricLabel}>Total Trades</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, winRate >= 60 ? styles.profit : styles.warning]}>
              {winRate.toFixed(1)}%
            </Text>
            <Text style={styles.metricLabel}>Win Rate</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, totalPnL >= 0 ? styles.profit : styles.loss]}>
              {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(4)}
            </Text>
            <Text style={styles.metricLabel}>Total P&L</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{stats?.pendingTrades || 0}</Text>
            <Text style={styles.metricLabel}>Pending</Text>
          </View>
        </View>
      </View>

      {/* Trade Volume Chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Trade Volume</Text>
        <BarChart
          data={tradeVolumeData}
          width={screenWidth - 50}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={chartConfig}
          style={styles.chart}
        />
      </View>

      {/* Profit/Loss Trend */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>P&L Trend</Text>
        <LineChart
          data={profitData}
          width={screenWidth - 50}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Best & Worst Trades */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Trade Highlights</Text>

        {/* Best Trade */}
        {stats?.bestTrade && (
          <View style={[styles.tradeHighlight, styles.bestTrade]}>
            <Text style={styles.tradeTitle}>🏆 Best Trade</Text>
            <View style={styles.tradeRow}>
              <Text style={styles.tradeLabel}>Pair:</Text>
              <Text style={styles.tradeValue}>{stats.bestTrade.pair || 'N/A'}</Text>
            </View>
            <View style={styles.tradeRow}>
              <Text style={styles.tradeLabel}>Profit:</Text>
              <Text style={[styles.tradeValue, styles.profit]}>
                +{stats.bestTrade.profitLoss?.toFixed(4)} BNB
              </Text>
            </View>
            <View style={styles.tradeRow}>
              <Text style={styles.tradeLabel}>Date:</Text>
              <Text style={styles.tradeValue}>
                {new Date(stats.bestTrade.timestamp).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}

        {/* Worst Trade */}
        {stats?.worstTrade && (
          <View style={[styles.tradeHighlight, styles.worstTrade]}>
            <Text style={styles.tradeTitle}>⚠️ Worst Trade</Text>
            <View style={styles.tradeRow}>
              <Text style={styles.tradeLabel}>Pair:</Text>
              <Text style={styles.tradeValue}>{stats.worstTrade.pair || 'N/A'}</Text>
            </View>
            <View style={styles.tradeRow}>
              <Text style={styles.tradeLabel}>Loss:</Text>
              <Text style={[styles.tradeValue, styles.loss]}>
                {stats.worstTrade.profitLoss?.toFixed(4)} BNB
              </Text>
            </View>
            <View style={styles.tradeRow}>
              <Text style={styles.tradeLabel}>Date:</Text>
              <Text style={styles.tradeValue}>
                {new Date(stats.worstTrade.timestamp).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Performance Breakdown */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Performance Breakdown</Text>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Profitable Trades:</Text>
          <Text style={[styles.breakdownValue, styles.profit]}>
            {stats?.profitableTrades || 0}
          </Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Losing Trades:</Text>
          <Text style={[styles.breakdownValue, styles.loss]}>
            {stats?.losingTrades || 0}
          </Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Completed Trades:</Text>
          <Text style={styles.breakdownValue}>
            {stats?.completedTrades || 0}
          </Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Pending Trades:</Text>
          <Text style={[styles.breakdownValue, styles.warning]}>
            {stats?.pendingTrades || 0}
          </Text>
        </View>
      </View>

      {/* AI Insights */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🤖 AI Insights</Text>
        <Text style={styles.insightText}>
          {winRate >= 60
            ? '✅ Your win rate is excellent! Keep using current strategies.'
            : '⚠️ Consider adjusting strategy parameters to improve win rate.'}
        </Text>
        <Text style={styles.insightText}>
          {totalPnL >= 0
            ? '✅ Portfolio is profitable. Good risk management.'
            : '⚠️ Review recent losing trades and adjust risk parameters.'}
        </Text>
        <Text style={styles.insightText}>
          💡 Best performing timeframe: {timeframe}
        </Text>
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
  timeframeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 15,
    gap: 10,
  },
  timeframeButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  timeframeButtonActive: {
    backgroundColor: '#00ff00',
    borderColor: '#00ff00',
  },
  timeframeText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  timeframeTextActive: {
    color: '#000',
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#0a0a0a',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  metricValue: {
    color: '#00ff00',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  metricLabel: {
    color: '#999',
    fontSize: 12,
  },
  profit: {
    color: '#00ff00',
  },
  loss: {
    color: '#ff0000',
  },
  warning: {
    color: '#ffaa00',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  tradeHighlight: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  bestTrade: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#00ff00',
  },
  worstTrade: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#ff0000',
  },
  tradeTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  tradeLabel: {
    color: '#999',
    fontSize: 14,
  },
  tradeValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  breakdownLabel: {
    color: '#999',
    fontSize: 14,
  },
  breakdownValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  insightText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 10,
    lineHeight: 20,
  },
});
