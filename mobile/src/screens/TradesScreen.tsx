import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TradesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Trade History Screen</Text>
      <Text style={styles.subtext}>Coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 10,
  },
});
