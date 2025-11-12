/**
 * Dashboard Screen - Main view showing bot status and P&L
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { getBotStatus, getPortfolio, getMemoryAnalytics } from '../services/apiClient';

export default function DashboardScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [botStatus, setBotStatus] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [statusData, portfolioData, analyticsData] = await Promise.all([
        getBotStatus(),
        getPortfolio(),
        getMemoryAnalytics(),
      ]);

      setBotStatus(statusData);
      setPortfolio(portfolioData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
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
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const totalPnL = portfolio?.total?.combined_pnl || 0;
  const isProfitable = totalPnL > 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00ff00" />
      }
    >
      {/* Status Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bot Status</Text>
        <View style={styles.statusRow}>
          <Text style={styles.label}>DEX:</Text>
          <Text style={styles.value}>
            {botStatus?.dex?.status || 'Unknown'}
            </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.label}>Polymarket:</Text>
          <Text style={styles.value}>
            {botStatus?.polymarket?.status || 'Unavailable'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.label}>WebSocket:</Text>
          <Text style={styles.value}>
            {botStatus?.websocket?.connected || 0} clients
          </Text>
        </View>
      </View>

      {/* P&L Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Portfolio</Text>
        <View style={styles.pnlContainer}>
          <Text style={styles.pnlLabel}>Total P&L</Text>
          <Text style={[styles.pnlValue, isProfitable ? styles.profit : styles.loss]}>
            {isProfitable ? '+' : ''}{totalPnL.toFixed(4)} BNB
          </Text>
        </View>
        <View style={styles.balancesRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>DEX (BNB)</Text>
            <Text style={styles.balanceValue}>
              {portfolio?.dex?.balance?.toFixed(4) || '0.0000'}
            </Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Polymarket (USDC)</Text>
            <Text style={styles.balanceValue}>
              {portfolio?.polymarket?.balance?.toFixed(2) || '0.00'}
            </Text>
          </View>
        </View>
      </View>

      {/* Analytics Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Analytics</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {analytics?.total?.trades || 0}
            </Text>
            <Text style={styles.statLabel}>Total Trades</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {analytics?.total?.winRate?.toFixed(0) || 0}%
            </Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {analytics?.total?.volume?.toFixed(0) || 0}
            </Text>
            <Text style={styles.statLabel}>Volume</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('BotControl')}
        >
          <Text style={styles.actionButtonText}>Bot Control</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Trades')}
        >
          <Text style={styles.actionButtonText}>View Trades</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.actionButtonText}>Settings</Text>
        </TouchableOpacity>
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    color: '#999',
    fontSize: 14,
  },
  value: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  pnlContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pnlLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 5,
  },
  pnlValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  profit: {
    color: '#00ff00',
  },
  loss: {
    color: '#ff0000',
  },
  balancesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 5,
  },
  balanceValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#00ff00',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#999',
    fontSize: 12,
    marginTop: 5,
  },
  actionsContainer: {
    padding: 15,
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#00ff00',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
