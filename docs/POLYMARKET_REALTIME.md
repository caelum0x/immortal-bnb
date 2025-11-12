# Polymarket Real-Time Data Integration

## Overview

The Immortal AI Trading Bot integrates with Polymarket's real-time data streaming service to provide live updates for prediction markets, orderbooks, trades, and price feeds.

## Architecture

```
┌──────────────────────┐
│   Frontend Client    │
│  (Socket.IO Client)  │
└──────────┬───────────┘
           │
           │ WebSocket
           ↓
┌──────────────────────┐
│   API Server         │
│  (Socket.IO Server)  │
└──────────┬───────────┘
           │
           │ Event Bridge
           ↓
┌──────────────────────┐
│  Realtime Service    │
│  (Polymarket WS)     │
└──────────┬───────────┘
           │
           │ WebSocket
           ↓
┌──────────────────────┐
│  Polymarket Servers  │
│  (Real-Time Data)    │
└──────────────────────┘
```

## Components

### 1. PolymarketRealtimeService (`src/polymarket/realtimeDataService.ts`)

WebSocket client that connects to Polymarket's real-time data streaming service.

**Features:**
- Automatic reconnection with exponential backoff
- Subscription management
- Heartbeat for connection health
- Event-driven architecture using EventEmitter

**Topics Supported:**
- `clob_market` - Market data (prices, orderbook, tick size changes)
- `clob_user` - User orders and trades (requires authentication)
- `activity` - Trading activity  - `crypto_prices` - Cryptocurrency price updates
- `equity_prices` - Equity price updates

### 2. WebSocket Service Integration (`src/services/websocket.ts`)

Socket.IO server that relays Polymarket events to connected frontend clients.

**Events Emitted:**
- `polymarket_price_change` - Market price changes
- `polymarket_orderbook` - Orderbook updates
- `polymarket_last_trade` - Last trade prices
- `polymarket_user_order` - User order updates
- `polymarket_user_trade` - User trade updates
- `polymarket_trade_activity` - Trading activity
- `crypto_price_update` - Crypto price updates
- `equity_price_update` - Equity price updates
- `polymarket_market_created` - New market created
- `polymarket_market_resolved` - Market resolved
- `polymarket_status` - Connection status

### 3. API Routes (`src/polymarket/polymarketApiRoutes.ts`)

REST API endpoints for Polymarket integration.

**Endpoints:**

#### Market Data
- `GET /api/polymarket/status` - Integration status
- `GET /api/polymarket/balance` - Wallet balances (USDC, MATIC)
- `GET /api/polymarket/markets` - Active markets list
- `GET /api/polymarket/market/:id` - Specific market details
- `GET /api/polymarket/orderbook/:marketId` - Market orderbook

#### Trading
- `POST /api/polymarket/order` - Create limit order
- `DELETE /api/polymarket/order/:orderId` - Cancel order
- `GET /api/polymarket/orders` - Get open orders
- `GET /api/polymarket/positions` - Get positions
- `POST /api/polymarket/market-buy` - Execute market buy
- `POST /api/polymarket/market-sell` - Execute market sell

#### Real-Time Control
- `POST /api/polymarket/realtime/start` - Start real-time stream
- `POST /api/polymarket/realtime/stop` - Stop real-time stream

## Usage

### Backend Setup

#### 1. Environment Variables

```bash
# Polymarket Configuration
POLYMARKET_HOST=https://clob.polymarket.com
POLYMARKET_CHAIN_ID=137
POLYGON_RPC=https://polygon-rpc.com
POLYMARKET_ENABLED=true
```

#### 2. Start Real-Time Stream

```typescript
import { getWebSocketService } from './services/websocket';

const wsService = getWebSocketService();

// Start streaming market data for specific tokens
wsService?.startPolymarketStream({
  tokenIds: ['100', '200', '300'], // Market token IDs
  marketSlugs: ['presidential-election-2024'],
  cryptoSymbols: ['BTCUSDT', 'ETHUSDT'],
  equitySymbols: ['AAPL', 'TSLA'],
});
```

### Frontend Integration

#### 1. Connect to WebSocket

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});
```

#### 2. Subscribe to Events

```typescript
// Market price changes
socket.on('polymarket_price_change', (data) => {
  console.log('Price change:', data);
  // Update UI with new prices
});

// Orderbook updates
socket.on('polymarket_orderbook', (data) => {
  console.log('Orderbook:', data);
  // Update orderbook display
});

// Last trade
socket.on('polymarket_last_trade', (data) => {
  console.log('Last trade:', data);
  // Update last trade price
});

// User orders (requires authentication)
socket.on('polymarket_user_order', (data) => {
  console.log('User order:', data);
  // Update user's orders list
});

// Crypto prices
socket.on('crypto_price_update', (data) => {
  console.log('Crypto price:', data);
  // Update crypto price display
});
```

#### 3. Start/Stop Stream via API

```typescript
// Start stream
await fetch('http://localhost:3001/api/polymarket/realtime/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tokenIds: ['100', '200'],
    cryptoSymbols: ['BTCUSDT'],
  }),
});

// Stop stream
await fetch('http://localhost:3001/api/polymarket/realtime/stop', {
  method: 'POST',
});
```

## Data Structures

### Price Change Event

```typescript
interface PriceChange {
  a: string; // asset_id
  h: string; // hash
  p: string; // price
  s: string; // side (BUY/SELL)
  si: string; // size
  ba: string; // best_ask
  bb: string; // best_bid
}
```

### Orderbook Event

```typescript
interface AggOrderbook {
  asks: { price: string; size: string }[];
  asset_id: string;
  bids: { price: string; size: string }[];
  hash: string;
  market: string;
  min_order_size: string;
  neg_risk: boolean;
  tick_size: string;
  timestamp: string;
}
```

### Last Trade Event

```typescript
interface LastTradePrice {
  asset_id: string;
  fee_rate_bps: string;
  market: string;
  price: string;
  side: string;
  size: string;
}
```

### User Order Event

```typescript
interface ClobOrder {
  asset_id: string;
  created_at: string;
  expiration: string;
  id: string;
  maker_address: string;
  market: string;
  order_type: string;
  original_size: string;
  outcome: string;
  owner: string;
  price: string;
  side: string;
  size_matched: string;
  status: string;
  type: string;
}
```

## Subscription Topics

### Market Data (No Auth Required)

| Topic | Type | Description | Filters |
|-------|------|-------------|---------|
| `clob_market` | `price_change` | Price updates | Token IDs array |
| `clob_market` | `agg_orderbook` | Aggregated orderbook | Token IDs array |
| `clob_market` | `last_trade_price` | Last trade price | Token IDs array |
| `clob_market` | `tick_size_change` | Tick size changes | Token IDs array |
| `clob_market` | `market_created` | New market | None |
| `clob_market` | `market_resolved` | Market resolved | None |

### User Data (Auth Required)

| Topic | Type | Description |
|-------|------|-------------|
| `clob_user` | `order` | User order updates |
| `clob_user` | `trade` | User trade updates |

### Activity Data

| Topic | Type | Description | Filters |
|-------|------|-------------|---------|
| `activity` | `trades` | Trading activity | `{market_slug: "slug"}` |
| `activity` | `orders_matched` | Orders matched | `{market_slug: "slug"}` |

### Price Feeds

| Topic | Type | Description | Filters |
|-------|------|-------------|---------|
| `crypto_prices` | `update` | Crypto prices | `{symbol: "BTCUSDT"}` |
| `equity_prices` | `update` | Equity prices | `{symbol: "AAPL"}` |

### Supported Symbols

**Crypto:**
- BTCUSDT, ETHUSDT, XRPUSDT, SOLUSDT, DOGEUSDT

**Equity:**
- AAPL, TSLA, MSFT, GOOGL, AMZN, META, NVDA, NFLX, PLTR, OPEN, RKLB, ABNB

## Error Handling

### Connection Errors

The real-time service includes automatic reconnection with exponential backoff:

```typescript
reconnectAttempts: 0 to 10
reconnectDelay: 5000ms (increases exponentially)
```

### Event Error Handling

```typescript
polymarketRealtimeService.on('error', (error) => {
  console.error('Polymarket WebSocket error:', error);
});

polymarketRealtimeService.on('disconnected', () => {
  console.warn('Disconnected from Polymarket');
  // UI should show "reconnecting" state
});

polymarketRealtimeService.on('max_reconnects', () => {
  console.error('Max reconnection attempts reached');
  // UI should show error state and manual reconnect option
});
```

## Performance Considerations

1. **Subscription Management**: Only subscribe to markets you're actively displaying
2. **Data Throttling**: Consider throttling rapid updates on the frontend
3. **Connection Pooling**: Single WebSocket connection serves all clients via Socket.IO
4. **Heartbeat**: 30-second ping/pong to keep connection alive

## Security

### Authentication for User Data

User-specific events (`clob_user` topic) require API key authentication:

```typescript
const auth = {
  key: 'your-api-key',
  secret: 'your-api-secret',
  passphrase: 'your-passphrase',
};

polymarketRealtimeService.subscribeToUserOrders(auth);
polymarketRealtimeService.subscribeToUserTrades(auth);
```

## Monitoring

### Health Checks

```typescript
// Check connection status
const isConnected = polymarketRealtimeService.isConnected();
const subscriptionCount = polymarketRealtimeService.getSubscriptionCount();

// Check via API
const response = await fetch('/api/polymarket/status');
const { enabled, realtime } = await response.json();
```

### Metrics

- Connection status (connected/disconnected)
- Active subscriptions count
- Message rate (events per second)
- Reconnection attempts

## Troubleshooting

### Connection Issues

1. **Check WebSocket URL**: Verify `wss://streaming.polymarket.com/ws/v1` is accessible
2. **Firewall**: Ensure WebSocket connections are allowed
3. **Authentication**: For user data, verify API credentials are correct
4. **Rate Limiting**: Check if you've exceeded Polymarket's rate limits

### Data Issues

1. **Missing Events**: Verify subscription filters are correctly formatted (JSON strings)
2. **Stale Data**: Check heartbeat is working (30s interval)
3. **Duplicate Events**: Implement deduplication on frontend using event IDs

## Examples

### Complete Trading Dashboard

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

// Setup all Polymarket subscriptions
socket.on('connect', async () => {
  // Start real-time stream
  await fetch('/api/polymarket/realtime/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tokenIds: ['100', '200', '300'],
      cryptoSymbols: ['BTCUSDT', 'ETHUSDT'],
    }),
  });
});

// Price updates
socket.on('polymarket_price_change', (data) => {
  updateMarketPrices(data);
});

// Orderbook
socket.on('polymarket_orderbook', (data) => {
  updateOrderbook(data);
});

// Trades
socket.on('polymarket_last_trade', (data) => {
  updateLastTrade(data);
});

// Crypto prices
socket.on('crypto_price_update', (data) => {
  updateCryptoPrices(data);
});
```

## References

- [Polymarket CLOB Client](https://github.com/Polymarket/clob-client)
- [Polymarket API Docs](https://docs.polymarket.com)
- [Socket.IO Documentation](https://socket.io/docs/v4/)

## Support

For issues or questions:
1. Check logs in `logs/` directory
2. Verify environment variables are set correctly
3. Test connection with `GET /api/polymarket/status`
4. Review error events from WebSocket service
