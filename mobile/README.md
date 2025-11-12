# Immortal Bot - Mobile App

React Native mobile app for monitoring and controlling the Immortal AI Trading Bot.

## Features

- Real-time bot status monitoring
- Portfolio P&L tracking
- Trade history
- Bot control (start/stop)
- Push notifications for trades
- Multi-DEX price comparison
- Flash loan opportunities
- MEV protection controls

## Setup

1. Install Expo CLI:
```bash
npm install -g expo-cli
```

2. Install dependencies:
```bash
cd mobile
npm install
```

3. Configure API URL:
Update `src/services/apiClient.ts` with your backend URL.

4. Run the app:
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## Build for Production

```bash
expo build:ios
expo build:android
```

## Push Notifications

The app uses Expo Notifications for real-time trade alerts.

To test push notifications:
1. Get your Expo push token from the app logs
2. Send test notification using Expo API

## Screens

- **Dashboard**: Overview of bot status and P&L
- **Bot Control**: Start/stop bots and configure features
- **Trades**: View trade history
- **Settings**: App configuration

## Tech Stack

- React Native
- Expo
- TypeScript
- React Navigation
- Axios
- Expo Notifications

## License

MIT
