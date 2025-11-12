/**
 * Bot Control Screen - Start/Stop trading bots
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';

export default function BotControlScreen() {
  const [dexEnabled, setDexEnabled] = useState(false);
  const [polymarketEnabled, setPolymarketEnabled] = useState(false);
  const [mevProtection, setMevProtection] = useState(true);
  const [flashLoans, setFlashLoans] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Trading Bots</Text>

        <View style={styles.controlRow}>
          <View>
            <Text style={styles.controlLabel}>DEX Trading (PancakeSwap)</Text>
            <Text style={styles.controlSubtext}>
              {dexEnabled ? 'Active' : 'Paused'}
            </Text>
          </View>
          <Switch
            value={dexEnabled}
            onValueChange={setDexEnabled}
            trackColor={{ false: '#333', true: '#00ff00' }}
            thumbColor={dexEnabled ? '#fff' : '#999'}
          />
        </View>

        <View style={styles.controlRow}>
          <View>
            <Text style={styles.controlLabel}>Polymarket Trading</Text>
            <Text style={styles.controlSubtext}>
              {polymarketEnabled ? 'Active' : 'Paused'}
            </Text>
          </View>
          <Switch
            value={polymarketEnabled}
            onValueChange={setPolymarketEnabled}
            trackColor={{ false: '#333', true: '#00ff00' }}
            thumbColor={polymarketEnabled ? '#fff' : '#999'}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Advanced Features</Text>

        <View style={styles.controlRow}>
          <View>
            <Text style={styles.controlLabel}>MEV Protection</Text>
            <Text style={styles.controlSubtext}>
              Flashbots private transactions
            </Text>
          </View>
          <Switch
            value={mevProtection}
            onValueChange={setMevProtection}
            trackColor={{ false: '#333', true: '#00ff00' }}
            thumbColor={mevProtection ? '#fff' : '#999'}
          />
        </View>

        <View style={styles.controlRow}>
          <View>
            <Text style={styles.controlLabel}>Flash Loan Arbitrage</Text>
            <Text style={styles.controlSubtext}>
              High-capital arbitrage opportunities
            </Text>
          </View>
          <Switch
            value={flashLoans}
            onValueChange={setFlashLoans}
            trackColor={{ false: '#333', true: '#00ff00' }}
            thumbColor={flashLoans ? '#fff' : '#999'}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Emergency Controls</Text>

        <TouchableOpacity style={styles.emergencyButton}>
          <Text style={styles.emergencyButtonText}>🛑 STOP ALL BOTS</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.withdrawButton}>
          <Text style={styles.withdrawButtonText}>💰 Withdraw Profits</Text>
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
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  controlLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  controlSubtext: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  emergencyButton: {
    backgroundColor: '#ff0000',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  withdrawButton: {
    backgroundColor: '#00ff00',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  withdrawButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
