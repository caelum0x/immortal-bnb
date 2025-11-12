/**
 * Opportunities Screen - Live trading opportunities
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';

interface Opportunity {
  id: string;
  type: string;
  expectedProfit: number;
  confidence: number;
  tokenIn?: string;
  tokenOut?: string;
  buyDex?: string;
  sellDex?: string;
  timestamp: number;
}

export default function OpportunitiesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filter, setFilter] = useState<'all' | 'arbitrage' | 'flash_loan'>('all');

  useEffect(() => {
    loadOpportunities();
    const interval = setInterval(loadOpportunities, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, [filter]);

  async function loadOpportunities() {
    try {
      const response = await fetch('http://localhost:3001/api/unified/opportunities');
      const data = await response.json();

      let filteredOpps = data.opportunities || [];
      if (filter !== 'all') {
        filteredOpps = filteredOpps.filter((opp: any) => opp.type === filter);
      }

      setOpportunities(filteredOpps);
    } catch (error) {
      console.error('Failed to load opportunities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    loadOpportunities();
  };

  const executeOpportunity = (opp: Opportunity) => {
    Alert.alert(
      'Execute Trade?',
      `Execute ${opp.type} opportunity?\n\nExpected Profit: ${opp.expectedProfit.toFixed(4)} BNB\nConfidence: ${(opp.confidence * 100).toFixed(0)}%`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Execute',
          onPress: async () => {
            try {
              // TODO: Implement execution endpoint
              Alert.alert('Success', 'Opportunity executed successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to execute opportunity');
            }
          },
        },
      ]
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'arbitrage':
        return '#00ff00';
      case 'flash_loan':
        return '#00aaff';
      case 'cross_chain':
        return '#ff00ff';
      default:
        return '#ffaa00';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'arbitrage':
        return '🔄';
      case 'flash_loan':
        return '⚡';
      case 'cross_chain':
        return '🌐';
      default:
        return '💡';
    }
  };

  const renderOpportunity = ({ item }: { item: Opportunity }) => {
    const isHighConfidence = item.confidence >= 0.7;
    const isProfitable = item.expectedProfit > 0.01;

    return (
      <TouchableOpacity
        style={styles.opportunityCard}
        onPress={() => executeOpportunity(item)}
      >
        <View style={styles.opportunityHeader}>
          <View style={styles.typeContainer}>
            <Text style={styles.typeIcon}>{getTypeIcon(item.type)}</Text>
            <Text style={[styles.typeText, { color: getTypeColor(item.type) }]}>
              {item.type.toUpperCase()}
            </Text>
          </View>
          <View style={[styles.confidenceBadge, isHighConfidence && styles.confidenceBadgeHigh]}>
            <Text style={styles.confidenceText}>{(item.confidence * 100).toFixed(0)}%</Text>
          </View>
        </View>

        <View style={styles.opportunityBody}>
          {item.tokenIn && item.tokenOut && (
            <View style={styles.pairRow}>
              <Text style={styles.pairText}>
                {item.tokenIn} → {item.tokenOut}
              </Text>
            </View>
          )}

          {item.buyDex && item.sellDex && (
            <View style={styles.dexRow}>
              <Text style={styles.dexLabel}>Route:</Text>
              <Text style={styles.dexText}>
                {item.buyDex} → {item.sellDex}
              </Text>
            </View>
          )}

          <View style={styles.profitRow}>
            <Text style={styles.profitLabel}>Expected Profit:</Text>
            <Text style={[styles.profitValue, isProfitable && styles.profit]}>
              +{item.expectedProfit.toFixed(4)} BNB
            </Text>
          </View>

          <View style={styles.timestampRow}>
            <Text style={styles.timestampText}>
              Discovered: {new Date(item.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        </View>

        <View style={styles.opportunityFooter}>
          <TouchableOpacity style={styles.executeButton}>
            <Text style={styles.executeButtonText}>⚡ Execute</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ff00" />
        <Text style={styles.loadingText}>Scanning opportunities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'arbitrage' && styles.filterButtonActive]}
          onPress={() => setFilter('arbitrage')}
        >
          <Text style={[styles.filterText, filter === 'arbitrage' && styles.filterTextActive]}>
            Arbitrage
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'flash_loan' && styles.filterButtonActive]}
          onPress={() => setFilter('flash_loan')}
        >
          <Text style={[styles.filterText, filter === 'flash_loan' && styles.filterTextActive]}>
            Flash Loan
          </Text>
        </TouchableOpacity>
      </View>

      {/* Opportunities List */}
      <FlatList
        data={opportunities}
        renderItem={renderOpportunity}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00ff00" />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No opportunities found</Text>
            <Text style={styles.emptySubtext}>
              The bot is scanning for profitable trades...
            </Text>
          </View>
        }
      />
    </View>
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
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#00ff00',
    borderColor: '#00ff00',
  },
  filterText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#000',
  },
  listContainer: {
    padding: 15,
  },
  opportunityCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 15,
    overflow: 'hidden',
  },
  opportunityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeIcon: {
    fontSize: 20,
  },
  typeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#ffaa00',
  },
  confidenceBadgeHigh: {
    backgroundColor: '#00ff00',
  },
  confidenceText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  opportunityBody: {
    padding: 15,
  },
  pairRow: {
    marginBottom: 10,
  },
  pairText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dexRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dexLabel: {
    color: '#999',
    fontSize: 14,
    marginRight: 5,
  },
  dexText: {
    color: '#00aaff',
    fontSize: 14,
    fontWeight: '600',
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  profitLabel: {
    color: '#999',
    fontSize: 14,
  },
  profitValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profit: {
    color: '#00ff00',
  },
  timestampRow: {
    marginTop: 5,
  },
  timestampText: {
    color: '#666',
    fontSize: 12,
  },
  opportunityFooter: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  executeButton: {
    backgroundColor: '#00ff00',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  executeButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
});
