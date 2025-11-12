/**
 * Polymarket Wallet Management Screen
 * Allows users to switch between Proxy and Safe wallets
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';

interface WalletInfo {
  walletType: 'proxy' | 'safe' | 'standard';
  isInitialized: boolean;
  details: any;
}

interface WalletComparison {
  proxy: {
    pros: string[];
    cons: string[];
  };
  safe: {
    pros: string[];
    cons: string[];
  };
}

export default function PolymarketWalletScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [comparison, setComparison] = useState<WalletComparison | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      await Promise.all([fetchWalletInfo(), fetchComparison()]);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function fetchWalletInfo() {
    try {
      const response = await fetch('http://localhost:3001/api/polymarket/wallet/info');
      const data = await response.json();

      if (data.success) {
        setWalletInfo(data.walletInfo);
      }
    } catch (error) {
      console.error('Failed to fetch wallet info:', error);
    }
  }

  async function fetchComparison() {
    try {
      const response = await fetch('http://localhost:3001/api/polymarket/wallet/compare');
      const data = await response.json();

      if (data.success) {
        setComparison(data.comparison);
      }
    } catch (error) {
      console.error('Failed to fetch comparison:', error);
    }
  }

  async function switchWallet(newType: 'proxy' | 'safe') {
    if (!walletInfo || walletInfo.walletType === newType) return;

    Alert.alert(
      'Switch Wallet Type?',
      `Switch from ${walletInfo.walletType} to ${newType} wallet?\n\nThis will reinitialize your Polymarket connection.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: async () => {
            try {
              setSwitching(true);

              const response = await fetch('http://localhost:3001/api/polymarket/wallet/switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletType: newType }),
              });

              const data = await response.json();

              if (data.success) {
                await fetchWalletInfo();
                Alert.alert('Success', `Switched to ${newType} wallet successfully!`);
              } else {
                Alert.alert('Error', data.message || 'Failed to switch wallet');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to switch wallet. Please try again.');
            } finally {
              setSwitching(false);
            }
          },
        },
      ]
    );
  }

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00aaff" />
        <Text style={styles.loadingText}>Loading wallet info...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00aaff" />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💼 Polymarket Wallet</Text>
        <Text style={styles.headerSubtitle}>
          Choose between Proxy (email-based) or Safe (browser wallet)
        </Text>
      </View>

      {/* Current Wallet Status */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View>
            <Text style={styles.statusLabel}>Current Wallet Type</Text>
            <Text style={styles.statusValue}>
              {walletInfo?.walletType?.toUpperCase() || 'NOT CONFIGURED'}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              walletInfo?.isInitialized ? styles.statusBadgeActive : styles.statusBadgeInactive,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                walletInfo?.isInitialized ? styles.statusTextActive : styles.statusTextInactive,
              ]}
            >
              {walletInfo?.isInitialized ? '✓ Initialized' : '⚠ Not Initialized'}
            </Text>
          </View>
        </View>
      </View>

      {/* Wallet Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Wallet Type</Text>

        {/* Proxy Wallet */}
        <TouchableOpacity
          style={[
            styles.walletCard,
            walletInfo?.walletType === 'proxy' && styles.walletCardActive,
            switching && styles.walletCardDisabled,
          ]}
          onPress={() => switchWallet('proxy')}
          disabled={switching || walletInfo?.walletType === 'proxy'}
        >
          <View style={styles.walletIconContainer}>
            <Text style={styles.walletIcon}>📧</Text>
          </View>
          <View style={styles.walletInfo}>
            <Text style={styles.walletTitle}>Proxy Wallet</Text>
            <Text style={styles.walletDescription}>
              Email-based wallet using Magic authentication
            </Text>
            <View style={styles.walletTags}>
              <View style={[styles.tag, styles.tagGreen]}>
                <Text style={styles.tagText}>Simple Setup</Text>
              </View>
              <View style={[styles.tag, styles.tagBlue]}>
                <Text style={styles.tagText}>Mobile Friendly</Text>
              </View>
            </View>
          </View>
          {walletInfo?.walletType === 'proxy' && (
            <View style={styles.activeIndicator}>
              <Text style={styles.activeIndicatorText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Safe Wallet */}
        <TouchableOpacity
          style={[
            styles.walletCard,
            walletInfo?.walletType === 'safe' && styles.walletCardActive,
            switching && styles.walletCardDisabled,
          ]}
          onPress={() => switchWallet('safe')}
          disabled={switching || walletInfo?.walletType === 'safe'}
        >
          <View style={styles.walletIconContainer}>
            <Text style={styles.walletIcon}>🛡️</Text>
          </View>
          <View style={styles.walletInfo}>
            <Text style={styles.walletTitle}>Safe Wallet</Text>
            <Text style={styles.walletDescription}>
              Gnosis Safe with browser wallet (MetaMask, Rainbow, etc.)
            </Text>
            <View style={styles.walletTags}>
              <View style={[styles.tag, styles.tagPurple]}>
                <Text style={styles.tagText}>High Security</Text>
              </View>
              <View style={[styles.tag, styles.tagBlue]}>
                <Text style={styles.tagText}>Self-Custody</Text>
              </View>
            </View>
          </View>
          {walletInfo?.walletType === 'safe' && (
            <View style={styles.activeIndicator}>
              <Text style={styles.activeIndicatorText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Toggle Comparison */}
      <TouchableOpacity
        style={styles.comparisonToggle}
        onPress={() => setShowComparison(!showComparison)}
      >
        <Text style={styles.comparisonToggleText}>
          {showComparison ? '▼ Hide Comparison' : '▶ Show Comparison'}
        </Text>
      </TouchableOpacity>

      {/* Wallet Comparison */}
      {showComparison && comparison && (
        <View style={styles.comparisonSection}>
          <Text style={styles.comparisonTitle}>📊 Wallet Comparison</Text>

          {/* Proxy Wallet Comparison */}
          <View style={styles.comparisonCard}>
            <Text style={styles.comparisonCardTitle}>📧 Proxy Wallet</Text>

            <View style={styles.comparisonBlock}>
              <Text style={styles.comparisonLabel}>✓ Pros</Text>
              {comparison.proxy.pros.map((pro, idx) => (
                <Text key={idx} style={styles.comparisonItem}>
                  • {pro}
                </Text>
              ))}
            </View>

            <View style={styles.comparisonBlock}>
              <Text style={styles.comparisonLabel}>✗ Cons</Text>
              {comparison.proxy.cons.map((con, idx) => (
                <Text key={idx} style={styles.comparisonItem}>
                  • {con}
                </Text>
              ))}
            </View>
          </View>

          {/* Safe Wallet Comparison */}
          <View style={styles.comparisonCard}>
            <Text style={styles.comparisonCardTitle}>🛡️ Safe Wallet</Text>

            <View style={styles.comparisonBlock}>
              <Text style={styles.comparisonLabel}>✓ Pros</Text>
              {comparison.safe.pros.map((pro, idx) => (
                <Text key={idx} style={styles.comparisonItem}>
                  • {pro}
                </Text>
              ))}
            </View>

            <View style={styles.comparisonBlock}>
              <Text style={styles.comparisonLabel}>✗ Cons</Text>
              {comparison.safe.cons.map((con, idx) => (
                <Text key={idx} style={styles.comparisonItem}>
                  • {con}
                </Text>
              ))}
            </View>
          </View>

          {/* Recommendations */}
          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationTitle}>💡 Recommendations</Text>
            <Text style={styles.recommendationText}>
              <Text style={styles.bold}>Proxy Wallet:</Text> Best for simple setup, mobile trading,
              and email-based authentication.
            </Text>
            <Text style={styles.recommendationText}>
              <Text style={styles.bold}>Safe Wallet:</Text> Best for maximum security, hardware
              wallet integration, and self-custody.
            </Text>
          </View>
        </View>
      )}

      {/* Switching Indicator */}
      {switching && (
        <View style={styles.switchingIndicator}>
          <ActivityIndicator size="small" color="#ffaa00" />
          <Text style={styles.switchingText}>Switching wallet type...</Text>
        </View>
      )}
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
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  statusCard: {
    margin: 15,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00aaff',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
  },
  statusBadgeInactive: {
    backgroundColor: 'rgba(255, 170, 0, 0.2)',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#00ff00',
  },
  statusTextInactive: {
    color: '#ffaa00',
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  walletCard: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#333',
    marginBottom: 15,
  },
  walletCardActive: {
    borderColor: '#00aaff',
    backgroundColor: 'rgba(0, 170, 255, 0.1)',
  },
  walletCardDisabled: {
    opacity: 0.5,
  },
  walletIconContainer: {
    marginRight: 15,
  },
  walletIcon: {
    fontSize: 40,
  },
  walletInfo: {
    flex: 1,
  },
  walletTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  walletDescription: {
    fontSize: 13,
    color: '#999',
    marginBottom: 10,
  },
  walletTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagGreen: {
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
  },
  tagBlue: {
    backgroundColor: 'rgba(0, 170, 255, 0.2)',
  },
  tagPurple: {
    backgroundColor: 'rgba(170, 0, 255, 0.2)',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  activeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00aaff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIndicatorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  comparisonToggle: {
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  comparisonToggleText: {
    color: '#00aaff',
    fontSize: 14,
    fontWeight: '600',
  },
  comparisonSection: {
    padding: 15,
  },
  comparisonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  comparisonCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    padding: 20,
    marginBottom: 15,
  },
  comparisonCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00aaff',
    marginBottom: 15,
  },
  comparisonBlock: {
    marginBottom: 15,
  },
  comparisonLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  comparisonItem: {
    fontSize: 13,
    color: '#999',
    marginBottom: 5,
    paddingLeft: 10,
  },
  recommendationCard: {
    backgroundColor: 'rgba(0, 170, 255, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00aaff',
    padding: 20,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00aaff',
    marginBottom: 10,
  },
  recommendationText: {
    fontSize: 13,
    color: '#ccc',
    marginBottom: 10,
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
    color: '#fff',
  },
  switchingIndicator: {
    margin: 15,
    padding: 15,
    backgroundColor: 'rgba(255, 170, 0, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffaa00',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  switchingText: {
    color: '#ffaa00',
    fontSize: 14,
  },
});
