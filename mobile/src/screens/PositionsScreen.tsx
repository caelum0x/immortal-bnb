/**
 * Positions Screen - Active Positions
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchPositions } from '../api';

export default function PositionsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [positions, setPositions] = useState<any[]>([]);

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    try {
      const data = await fetchPositions();
      setPositions(data.positions || []);
    } catch (error) {
      console.error('Error loading positions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPositions();
  };

  const closePosition = async (positionId: string) => {
    // TODO: Implement position closing
    console.log('Close position:', positionId);
  };

  const renderPosition = ({ item }: { item: any }) => (
    <View style={styles.positionCard}>
      <View style={styles.positionHeader}>
        <Text style={styles.tokenSymbol}>{item.tokenSymbol}</Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === 'active'
                  ? '#22c55e20'
                  : item.status === 'pending'
                  ? '#eab30820'
                  : '#64748b20',
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  item.status === 'active'
                    ? '#22c55e'
                    : item.status === 'pending'
                    ? '#eab308'
                    : '#64748b',
              },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.priceRow}>
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Entry</Text>
          <Text style={styles.priceValue}>${item.entryPrice.toFixed(4)}</Text>
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Current</Text>
          <Text style={styles.priceValue}>${item.currentPrice.toFixed(4)}</Text>
        </View>
      </View>

      <View style={styles.pnlRow}>
        <View>
          <Text style={styles.detailLabel}>P&L</Text>
          <Text
            style={[
              styles.pnlValue,
              { color: item.pnl >= 0 ? '#22c55e' : '#ef4444' },
            ]}
          >
            {item.pnl >= 0 ? '+' : ''}${item.pnl.toFixed(2)}
          </Text>
        </View>
        <View>
          <Text style={styles.detailLabel}>P&L %</Text>
          <Text
            style={[
              styles.pnlValue,
              { color: item.pnlPercent >= 0 ? '#22c55e' : '#ef4444' },
            ]}
          >
            {item.pnlPercent >= 0 ? '+' : ''}
            {item.pnlPercent.toFixed(2)}%
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => closePosition(item.id)}
      >
        <Text style={styles.closeButtonText}>Close Position</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading positions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={positions}
        renderItem={renderPosition}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>No active positions</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  listContent: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  positionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tokenSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  priceBox: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
  },
  priceLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  pnlRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  pnlValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
  },
});
