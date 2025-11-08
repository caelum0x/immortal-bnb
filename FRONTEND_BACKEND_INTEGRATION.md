# 🚀 Frontend-Backend Integration Guide

This guide shows how to connect the frontend dashboard to the backend trading bot.

## 📋 Current Status

✅ **Backend**: Fully functional with TypeScript compilation passing  
✅ **Frontend**: Modern Next.js dashboard with proper error handling  
✅ **Integration**: API client with mock data fallbacks for development  
⚠️ **Configuration**: Requires environment setup for full functionality

## 🔧 Quick Setup

### 1. Install Dependencies
```bash
# Install all dependencies
npm run install:all

# Or install separately
npm install          # Backend dependencies
cd frontend && npm install  # Frontend dependencies
```

### 2. Configure Environment
```bash
# Copy example configuration
cp .env.example .env

# Edit .env with your actual values
nano .env  # or use your preferred editor
```

**Required Configuration:**
- `WALLET_PRIVATE_KEY` - Your wallet private key for trading
- `OPENROUTER_API_KEY` - API key for AI decision making

### 3. Start Development Servers
```bash
# Option 1: Start both frontend and backend together
npm run dev:full

# Option 2: Start separately
npm run dev:backend    # Backend API on port 3001
npm run dev:frontend   # Frontend on port 3000
```

### 4. Access Dashboard
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## 📡 API Integration

### Backend Endpoints Available:
- `GET /api/status` - Bot status and configuration
- `GET /api/wallet/balance` - Wallet balance information  
- `GET /api/trades` - Trading history
- `GET /api/stats` - Performance statistics
- `POST /api/bot/start` - Start trading bot (future feature)
- `POST /api/bot/stop` - Stop trading bot (future feature)

### Frontend Features:
- **Real-time Status**: Shows bot configuration status
- **Wallet Connection**: MetaMask integration with network detection
- **Smart Fallbacks**: Mock data when backend is not configured
- **Error Handling**: Graceful degradation for missing configurations

## 🔄 Development Workflow

### Without Configuration (Demo Mode):
1. Start frontend: `npm run dev:frontend`
2. Dashboard shows demo mode with setup instructions
3. All components work with mock data

### With Configuration (Live Mode):
1. Configure `.env` file with your keys
2. Start both: `npm run dev:full` 
3. Dashboard connects to live backend
4. Real trading data and wallet integration

## 🎛️ Component Structure

### Frontend Components:
```
frontend/
├── app/
│   ├── layout.tsx          # Main app layout
│   └── page.tsx           # Dashboard homepage
├── components/
│   ├── dashboard/
│   │   ├── BotStatus.tsx    # Bot status and controls ✅
│   │   ├── WalletInfo.tsx   # Wallet connection ✅
│   │   ├── SetupGuide.tsx   # Configuration guide ✅
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── TradingHistory.tsx
│   │   └── PerformanceChart.tsx
│   ├── layout/
│   │   └── Header.tsx
│   └── providers/
│       ├── Web3Provider.tsx  # Wallet connection ✅
│       └── QueryProvider.tsx
└── lib/
    ├── api.ts              # Backend API client ✅
    └── hooks.ts            # React hooks for data ✅
```

### Key Features Implemented:

✅ **Smart API Client**: Automatically handles backend unavailability  
✅ **Wallet Integration**: Full MetaMask support with network switching  
✅ **Configuration Detection**: Shows setup instructions when needed  
✅ **Responsive Design**: Works on desktop and mobile  
✅ **Error Boundaries**: Graceful error handling throughout  

## 🔌 Connection Flow

1. **Frontend loads** → Checks backend availability
2. **Backend available** → Fetches real data 
3. **Backend unavailable** → Shows demo mode with setup guide
4. **User configures** → Backend becomes available
5. **Real-time updates** → Dashboard shows live trading data

## 🚨 Security Notes

⚠️ **Never commit private keys to version control**  
⚠️ **Start with testnet for development**  
⚠️ **Use small amounts for initial testing**  
⚠️ **Validate all transactions before execution**

## 📝 Common Issues

### Backend Not Starting:
- Check if all dependencies are installed
- Verify `.env` file exists and has correct format
- Check for TypeScript compilation errors: `npm run build`

### Frontend Not Connecting:
- Ensure backend is running on port 3001
- Check browser console for CORS errors
- Verify API_BASE_URL in frontend configuration

### Wallet Not Connecting:
- Install MetaMask or another Web3 wallet
- Switch to correct network (BNB Chain or opBNB)
- Check if wallet has sufficient balance for gas

## 🎯 Next Steps

1. **Configure environment variables** 
2. **Test with small amounts on testnet**
3. **Verify all integrations work**
4. **Scale up for production use**

The integration is ready to use - just add your configuration! 🚀
