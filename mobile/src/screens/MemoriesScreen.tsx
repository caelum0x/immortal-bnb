/**
 * Memories Screen - AI Trading Memories
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchMemories } from '../api';

export default function MemoriesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [memories, setMemories] = useState<any[]>([]);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      const data = await fetchMemories();
      setMemories(data.memories || []);
    } catch (error) {
      console.error('Error loading memories:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMemories();
  };

  const renderMemory = ({ item }: { item: any }) => (
    <View style={styles.memoryCard}>
      <View style={styles.memoryHeader}>
        <Text style={styles.tokenSymbol}>{item.tokenSymbol}</Text>
        <View
          style={[
            styles.outcomeBadge,
            {
              backgroundColor:
                item.outcome === 'profit'
                  ? '#22c55e20'
                  : item.outcome === 'loss'
                  ? '#ef444420'
                  : '#eab30820',
            },
          ]}
        >
          <Text
            style={[
              styles.outcomeText,
              {
                color:
                  item.outcome === 'profit'
                    ? '#22c55e'
                    : item.outcome === 'loss'
                    ? '#ef4444'
                    : '#eab308',
              },
            ]}
          >
            {item.outcome}
          </Text>
        </View>
      </View>

      <Text style={styles.reasoning} numberOfLines={3}>
        {item.aiReasoning}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Entry</Text>
          <Text style={styles.statValue}>${item.entryPrice.toFixed(2)}</Text>
        </View>

        {item.exitPrice && (
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Exit</Text>
            <Text style={styles.statValue}>${item.exitPrice.toFixed(2)}</Text>
          </View>
        )}

        {item.profitLoss && (
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>P&L</Text>
            <Text
              style={[
                styles.statValue,
                { color: item.profitLoss >= 0 ? '#22c55e' : '#ef4444' },
              ]}
            >
              ${item.profitLoss.toFixed(2)}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleDateString()}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading memories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={memories}
        renderItem={renderMemory}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🧠</Text>
            <Text style={styles.emptyText}>No memories yet</Text>
            <Text style={styles.emptySubtext}>
              Start trading to build AI memories
            </Text>
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
  memoryCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#a855f720',
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tokenSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  outcomeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  outcomeText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  reasoning: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 12,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  timestamp: {
    fontSize: 12,
    color: '#64748b',
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
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
});
