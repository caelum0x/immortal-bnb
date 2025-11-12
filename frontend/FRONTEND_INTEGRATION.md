# Immortal AI Trading Bot - Frontend Integration Guide

## Overview

Complete Next.js 14 frontend implementation for the Immortal AI Trading Bot with multi-chain trading capabilities, real-time updates, and comprehensive bot control.

## Architecture

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Wallet**: Custom Web3 Provider (MetaMask integration)
- **Real-time**: Socket.IO Client
- **API**: Custom API Client with error handling

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx              # Root layout with Web3Provider
│   ├── page.tsx                # Landing page (redirects when connected)
│   ├── dashboard/
│   │   └── page.tsx            # Main dashboard with tabs
│   ├── trades/
│   │   └── page.tsx            # Trading history and discovery
│   ├── memory/
│   │   └── page.tsx            # Greenfield memory viewer
│   └── settings/
│       └── page.tsx            # Bot configuration
├── components/
│   ├── layout/
│   │   └── Header.tsx          # Navigation header
│   ├── providers/
│   │   ├── Web3Provider.tsx    # Wallet connection context
│   │   └── QueryProvider.tsx   # React Query provider
│   ├── dashboard/              # Dashboard components
│   ├── TokenDiscovery.tsx      # Token discovery from DexScreener
│   ├── PolymarketDashboard.tsx # Polymarket integration
│   ├── MemoriesView.tsx        # Greenfield memory display
│   ├── TradingStats.tsx        # Trading statistics
│   ├── UnifiedBotControl.tsx   # Bot control panel
│   ├── NotificationsPanel.tsx  # Real-time notifications
│   └── CrossChainOpportunities.tsx # Cross-chain arbitrage
└── lib/
    ├── apiClient.ts            # Centralized API client
    └── useWebSocket.ts         # WebSocket hook
```

## Pages

### 1. Landing Page (`/`)

**Features:**
- Hero section with gradient title
- 6 feature cards (AI, MEV Protection, Immortal Memory, Multi-Chain, Multi-DEX, Flash Loans)
- Platform statistics (trades, win rate, volume, uptime)
- "How It Works" 4-step process
- Auto-redirect to dashboard when wallet connected

**Components Used:**
- Header with wallet connect button

**Flow:**
```
User visits / → Not connected → Show landing page
              → Connected → Redirect to /dashboard
```

### 2. Dashboard (`/dashboard`)

**Features:**
- 4 tabs: Overview, DEX Trading, Polymarket, Opportunities
- Real-time bot status & controls
- Portfolio balance & P&L
- Performance charts
- Trading history
- Token discovery integration
- Polymarket markets
- Flash loan opportunities
- MEV protection status
- Cross-chain opportunities

**Components Used:**
- UnifiedBotControl
- BotStatus
- WalletInfo
- PerformanceChart
- TradingHistory
- TokenDiscovery
- PolymarketDashboard
- CrossChainOpportunities
- NotificationsPanel

**Tabs:**
- **Overview**: Bot controls, status, performance, recent trades
- **DEX Trading**: Token discovery, DEX status, DEX trades
- **Polymarket**: Polymarket markets and trades
- **Opportunities**: Flash loans, arbitrage, MEV protection stats

### 3. Trades Page (`/trades`)

**Features:**
- Complete trading history table
- Filters: All / DEX / Polymarket
- Sort: Newest / Profit / Volume
- Real-time trade updates via WebSocket
- Trading statistics (total trades, win rate, volume)
- Export options (CSV, PDF)
- Detailed trade information (time, type, chain, platform, pair, amount, P&L, status)

**Data Fetching:**
- Auto-refresh every 30 seconds
- Manual refresh button
- Filters and sorting applied server-side

### 4. Memory Page (`/memory`)

**Features:**
- Analytics overview (total trades, win rate, profit factor, volume)
- AI learnings (top strategies, best timeframes, optimal tokens)
- Memory entries from BNB Greenfield
- Search and filter by category
- Detailed memory cards with metadata
- Greenfield storage information

**Integration:**
- Fetches from `/api/memory/list` and `/api/memory/analytics`
- Displays Greenfield object IDs and bucket names
- Shows trade-specific metadata (pair, profit, strategy)

### 5. Settings Page (`/settings`)

**Features:**
- Account information (wallet, network)
- Risk management (slippage, trade size, stop loss, take profit)
- Trading strategy toggles (DEX, Polymarket, Flash Loans, MEV Protection)
- Advanced settings (gas multiplier, profit threshold, daily trade limit, auto-compound)
- Notifications (trade, profit, loss, email)
- Save/Reset functionality

**Configuration:**
- All settings stored via `/api/settings` endpoint
- Real-time validation
- Success/error messages

## Components

### Layout Components

#### Header (`components/layout/Header.tsx`)

**Features:**
- Logo with home link
- Navigation links (Dashboard, Trades, Memory, Settings) - only when connected
- Active page highlighting
- Wallet connection status
- Connect/Disconnect button
- Mobile responsive navigation

**Conditional Rendering:**
- Navigation only shows when wallet is connected
- Mobile navigation at bottom on small screens

### Provider Components

#### Web3Provider (`components/providers/Web3Provider.tsx`)

**Features:**
- Custom wallet connection (not using RainbowKit despite being installed)
- Auto-detect existing connection
- Network detection (Ethereum, BNB Chain, opBNB)
- Balance fetching
- Account change listeners
- Network change listeners

**API:**
```typescript
const {
  isConnected,
  address,
  isConnecting,
  error,
  network,
  balance,
  connect,
  disconnect,
  switchNetwork
} = useWeb3()
```

### Existing Components

The following components already exist and are integrated:

- **BotStatus**: Real-time bot status display
- **WalletInfo**: Wallet balance and network info
- **PerformanceChart**: Trading performance visualization
- **TradingHistory**: Recent trades table
- **TokenDiscovery**: DexScreener token discovery
- **PolymarketDashboard**: Polymarket markets and positions
- **MemoriesView**: Greenfield memory display
- **TradingStats**: Aggregate trading statistics
- **UnifiedBotControl**: Start/stop bot controls
- **NotificationsPanel**: Real-time notifications
- **CrossChainOpportunities**: Cross-chain arbitrage opportunities

## Utilities

### API Client (`lib/apiClient.ts`)

Centralized API communication with error handling.

**Error Handling:**
```typescript
class APIError extends Error {
  status: number
  data?: any
}
```

**Available Methods:**

**Bot Control:**
- `getBotStatus()` - Get current bot status
- `getPortfolio()` - Get portfolio balances and P&L
- `startBot(type)` - Start bot (dex/polymarket/all)
- `stopBot(type)` - Stop bot

**Trading:**
- `getTradeHistory(params)` - Get trade history with filters
- `executeTrade(tradeData)` - Execute a trade

**Multi-DEX & Flash Loans:**
- `getBestDEXQuote(params)` - Compare prices across DEXs
- `getFlashLoanOpportunities(minProfit)` - Find arbitrage opportunities
- `executeFlashLoan(params)` - Execute flash loan arbitrage

**Memory & Analytics:**
- `getMemoryList(params)` - Get Greenfield memories
- `getMemoryAnalytics()` - Get AI learnings and stats
- `storeMemory(memory)` - Store new memory

**Discovery:**
- `discoverTokens(params)` - Discover tokens from DexScreener
- `discoverPolymarketMarkets(params)` - Discover Polymarket markets

**Settings:**
- `getSettings()` - Get current settings
- `updateSettings(settings)` - Update settings

**MEV Protection:**
- `getMEVProtectionStatus()` - Get MEV protection stats
- `configureProtectedTrade(params)` - Configure protected trade

**AI & Orchestrator:**
- `getOrchestratorMetrics()` - Get AI orchestrator metrics
- `requestAIDecision(params)` - Request AI decision

**Cross-Chain:**
- `getCrossChainOpportunities()` - Get cross-chain opportunities

**Usage Example:**
```typescript
import api from '@/lib/apiClient'

// Fetch bot status
const status = await api.getBotStatus()

// Execute trade
const result = await api.executeTrade({
  tokenIn: '0x...',
  tokenOut: '0x...',
  amountIn: '1.0',
  slippage: 1.0
})

// Error handling
try {
  const data = await api.getPortfolio()
} catch (error) {
  if (error instanceof APIError) {
    console.error(`API Error ${error.status}:`, error.message)
  }
}
```

### WebSocket Hook (`lib/useWebSocket.ts`)

Real-time updates from backend Socket.IO server.

**Events:**
- `trade_executed` - New trade executed
- `bot_status_update` - Bot status changed
- `price_update` - Token price updated
- `opportunity_found` - New arbitrage opportunity

**API:**
```typescript
const {
  isConnected,          // WebSocket connection status
  lastTrade,            // Latest trade update
  botStatus,            // Latest bot status
  latestPrice,          // Latest price update
  newOpportunity,       // Latest opportunity
  subscribeToToken,     // Subscribe to token prices
  unsubscribeFromToken, // Unsubscribe from token
  refreshBotStatus      // Request status update
} = useWebSocket()
```

**Usage Example:**
```typescript
import useWebSocket from '@/lib/useWebSocket'

function Dashboard() {
  const { isConnected, lastTrade, botStatus } = useWebSocket()

  useEffect(() => {
    if (lastTrade) {
      console.log('New trade:', lastTrade)
      // Update UI or show notification
    }
  }, [lastTrade])

  return (
    <div>
      <div>WebSocket: {isConnected ? '✅' : '❌'}</div>
      <div>Bot Status: {botStatus?.dex.status}</div>
    </div>
  )
}
```

## User Flows

### Flow 1: New User Onboarding

```
1. User visits landing page (/)
2. Sees hero, features, stats, "How It Works"
3. Clicks "Connect Wallet"
4. MetaMask prompt appears
5. User approves connection
6. Auto-redirected to /dashboard
7. Sees bot controls and status
8. Configures settings in /settings
9. Starts bot via UnifiedBotControl
10. Monitors trades in real-time
```

### Flow 2: Existing User Dashboard

```
1. User visits / with wallet already connected
2. Auto-redirected to /dashboard
3. Overview tab shows:
   - Bot controls (start/stop)
   - Current status (running/stopped)
   - Portfolio balance & P&L
   - Performance chart
   - Recent trades
4. User switches to "Opportunities" tab
5. Sees flash loan arbitrage opportunities
6. Clicks "Execute Flash Loan"
7. Transaction sent via MEV protection
8. Real-time update via WebSocket
9. Trade appears in /trades page
10. Memory stored on Greenfield
```

### Flow 3: Token Discovery & Trading

```
1. User navigates to /dashboard → DEX Trading tab
2. TokenDiscovery component loads
3. Fetches trending tokens from DexScreener
4. User sees tokens with:
   - Liquidity
   - 24h volume
   - Price change
   - DexScreener link
5. User clicks token
6. Bot analyzes via AI orchestrator
7. If profitable, executes trade
8. Trade protected by MEV (Flashbots)
9. WebSocket sends update
10. UI updates instantly
11. Memory stored on Greenfield
```

### Flow 4: Memory & Learning

```
1. User navigates to /memory
2. Views analytics:
   - Total trades learned
   - Win rate
   - Profit factor
3. Sees AI learnings:
   - Top strategies
   - Best timeframes
   - Optimal tokens
4. Searches memories
5. Filters by category
6. Views detailed memory cards with:
   - Timestamp
   - Content
   - Metadata
   - Greenfield object ID
7. Bot uses this data for future decisions
```

## Environment Variables

Create `.env.local` in frontend directory:

```bash
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# WebSocket Server
NEXT_PUBLIC_WS_URL=http://localhost:3001

# Chain Configuration
NEXT_PUBLIC_BNB_CHAIN_ID=0x38
NEXT_PUBLIC_POLYGON_CHAIN_ID=0x89
```

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:3000`

## Integration with Backend

### Required Backend Endpoints

The frontend expects the following endpoints to be available:

**Status & Control:**
- `GET /api/unified/status`
- `GET /api/unified/portfolio`
- `POST /api/bot/start`
- `POST /api/bot/stop`

**Trading:**
- `GET /api/trades`
- `POST /api/trades/execute`

**Multi-DEX:**
- `POST /api/dex/best-quote`

**Flash Loans:**
- `GET /api/flashloan/opportunities`
- `POST /api/flashloan/execute`

**Memory:**
- `GET /api/memory/list`
- `GET /api/memory/analytics`
- `POST /api/memory/store`

**Discovery:**
- `GET /api/discovery/tokens`
- `GET /api/discovery/polymarket`

**Settings:**
- `GET /api/settings`
- `POST /api/settings`

**MEV:**
- `GET /api/mev/status`
- `POST /api/mev/protected-trade`

**AI:**
- `GET /api/orchestrator/metrics`
- `POST /api/orchestrator/decision`

**Cross-Chain:**
- `GET /api/unified/cross-chain-opportunities`

### WebSocket Events

**Client → Server:**
- `subscribe_token` - Subscribe to token price updates
- `unsubscribe_token` - Unsubscribe from token
- `request_bot_status` - Request current bot status

**Server → Client:**
- `trade_executed` - Trade executed notification
- `bot_status_update` - Bot status changed
- `price_update` - Token price updated
- `opportunity_found` - New opportunity detected

## Security Considerations

1. **Non-Custodial**: User maintains full control of funds
2. **Approval Required**: Each trade requires user approval
3. **MEV Protection**: Trades sent via Flashbots when enabled
4. **Rate Limiting**: API client respects backend rate limits
5. **Error Handling**: All API calls wrapped with try-catch
6. **Input Validation**: All user inputs validated before submission

## Mobile Responsiveness

- All pages responsive (mobile, tablet, desktop)
- Mobile navigation in Header (bottom tabs)
- Touch-friendly buttons and controls
- Optimized for iOS and Android browsers

## Performance Optimizations

1. **Code Splitting**: Next.js automatic code splitting
2. **Server Components**: Use Server Components where possible
3. **Client Components**: Only for interactive features
4. **Image Optimization**: Next.js Image component
5. **API Caching**: React Query for data caching
6. **WebSocket**: Single connection for real-time updates
7. **Lazy Loading**: Components loaded on demand

## Testing

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```bash
# Build Docker image
docker build -t immortal-frontend .

# Run container
docker run -p 3000:3000 immortal-frontend
```

## Troubleshooting

### Wallet Not Connecting

1. Check MetaMask is installed
2. Check correct network (BNB Chain or Polygon)
3. Check browser console for errors

### API Errors

1. Verify backend is running (`http://localhost:3001`)
2. Check environment variables
3. Check CORS configuration on backend

### WebSocket Not Connecting

1. Verify Socket.IO server is running
2. Check WS_URL environment variable
3. Check browser console for connection errors

## Future Enhancements

- [ ] Multi-wallet support (WalletConnect, Coinbase Wallet)
- [ ] Dark/Light theme toggle
- [ ] Advanced charting with TradingView
- [ ] Portfolio tracking with historical data
- [ ] Social features (follow traders, share strategies)
- [ ] Mobile app (React Native)
- [ ] Push notifications (Expo)
- [ ] Email alerts
- [ ] Telegram bot integration
- [ ] More chains (Ethereum, Arbitrum, Optimism)

## Support

For issues or questions:
- Check documentation in `/docs`
- Review backend API documentation
- Check Phase 8 completion guide: `PHASE_8_COMPLETE.md`

## License

MIT License - See LICENSE file for details

---

**Built with ❤️ for the BNB Chain and Polymarket ecosystems**
