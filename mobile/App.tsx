/**
 * Immortal AI Trading Bot - Mobile App
 * React Native app for monitoring and controlling the trading bot
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications';

// Screens
import DashboardScreen from './src/screens/DashboardScreen';
import TradesScreen from './src/screens/TradesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import BotControlScreen from './src/screens/BotControlScreen';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Stack = createStackNavigator();

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');

  useEffect(() => {
    // Register for push notifications
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token || ''));

    // Listen for notifications
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    return () => subscription.remove();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#000',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: 'Immortal Bot Dashboard' }}
        />
        <Stack.Screen
          name="BotControl"
          component={BotControlScreen}
          options={{ title: 'Bot Control' }}
        />
        <Stack.Screen
          name="Trades"
          component={TradesScreen}
          options={{ title: 'Trade History' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

async function registerForPushNotificationsAsync() {
  let token;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }

  token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log('Push token:', token);

  return token;
}
