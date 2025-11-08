# 📡 API Documentation

**Immortal AI Trading Bot - REST API Reference**

Base URL: `http://localhost:3001` (development)
Production URL: `https://your-domain.com` (configure in deployment)

---

## 🔐 Authentication

Optional API key authentication (can be enabled):

```bash
# Add to all requests
-H "X-API-Key: your-api-key-here"
```

See [SECURITY.md](./SECURITY.md) for setup instructions.

---

## 📋 Endpoints

### Health Check

**GET** `/health`

Check if the API server is running.

**Request:**
```bash
curl http://localhost:3001/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1699123456789,
  "botRunning": false
}
```

**Status Codes:**
- `200` - Server is healthy
- `500` - Server error

---

### Get Bot Status

**GET** `/api/bot-status`

Get current trading bot status and configuration.

**Request:**
```bash
curl http://localhost:3001/api/bot-status
```

**Response:**
```json
{
  "running": false,
  "watchlist": [
    "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"
  ],
  "riskLevel": 5,
  "config": {
    "maxTradeAmount": 0.1,
    "stopLoss": 10,
    "network": "testnet",
    "interval": 300000
  }
}
```

**Fields:**
- `running` (boolean) - Whether bot is currently running
- `watchlist` (string[]) - Token addresses being monitored
- `riskLevel` (number) - Risk level 1-10
- `config` (object) - Current configuration

**Status Codes:**
- `200` - Success
- `500` - Server error

---

### Start Bot

**POST** `/api/start-bot`

Start the trading bot with specified configuration.

**Request:**
```bash
curl -X POST http://localhost:3001/api/start-bot \
  -H "Content-Type: application/json" \
  -d '{
    "tokens": [
      "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"
    ],
    "risk": 5
  }'
```

**Request Body:**
```typescript
{
  tokens: string[];    // Array of token addresses (can be empty for auto-discovery)
  risk: number;        // Risk level 1-10
}
```

**Response:**
```json
{
  "status": "started",
  "message": "Bot is now running",
  "config": {
    "tokens": ["0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"],
    "riskLevel": 5,
    "interval": 300000,
    "maxTradeAmount": 0.1,
    "stopLoss": 10,
    "network": "testnet"
  }
}
```

**Validation:**
- `tokens` - Must be valid Ethereum addresses (0x + 40 hex chars)
- `risk` - Must be integer between 1 and 10

**Status Codes:**
- `200` - Bot started successfully
- `400` - Invalid request (validation failed, or bot already running)
- `500` - Server error

---

### Stop Bot

**POST** `/api/stop-bot`

Stop the trading bot.

**Request:**
```bash
curl -X POST http://localhost:3001/api/stop-bot
```

**Response:**
```json
{
  "status": "stopped",
  "message": "Bot has been stopped"
}
```

**Status Codes:**
- `200` - Bot stopped successfully
- `400` - Bot was not running
- `500` - Server error

---

### Get Trading Memories

**GET** `/api/memories`

Retrieve trading memories stored on BNB Greenfield.

**Query Parameters:**
- `limit` (optional) - Number of memories to return (default: 50, max: 100)

**Request:**
```bash
curl "http://localhost:3001/api/memories?limit=10"
```

**Response:**
```json
{
  "total": 42,
  "memories": [
    {
      "id": "memory-abc123",
      "timestamp": 1699123456789,
      "tokenAddress": "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
      "tokenSymbol": "CAKE",
      "action": "buy",
      "entryPrice": 3.45,
      "amount": 0.05,
      "outcome": "profit",
      "profitLoss": 0.002,
      "aiReasoning": "Strong bullish momentum with increasing volume...",
      "marketConditions": {
        "volume24h": 45000000,
        "liquidity": 120000000,
        "priceChange24h": 5.2,
        "buySellPressure": 1.35
      }
    }
  ],
  "message": "No memories yet - start trading!" // if empty
}
```

**Memory Object:**
- `id` (string) - Unique memory identifier
- `timestamp` (number) - Unix timestamp in milliseconds
- `tokenAddress` (string) - Token contract address
- `tokenSymbol` (string) - Token symbol (e.g., "CAKE")
- `action` (string) - "buy" or "sell"
- `entryPrice` (number) - Entry price in USD
- `amount` (number) - Amount in BNB
- `outcome` (string) - "pending", "profit", or "loss"
- `profitLoss` (number) - Profit/loss in BNB (if completed)
- `aiReasoning` (string) - AI's explanation for the trade
- `marketConditions` (object) - Market data at time of trade

**Status Codes:**
- `200` - Success
- `500` - Server error (e.g., Greenfield unavailable)

---

### Discover Trending Tokens

**GET** `/api/discover-tokens`

Get trending tokens from DexScreener on BNB Chain.

**Query Parameters:**
- `limit` (optional) - Number of tokens to return (default: 10, max: 50)

**Request:**
```bash
curl "http://localhost:3001/api/discover-tokens?limit=5"
```

**Response:**
```json
{
  "tokens": [
    {
      "address": "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
      "symbol": "CAKE",
      "name": "PancakeSwap Token",
      "priceUsd": "3.45",
      "priceChange24h": 5.2,
      "volume24h": 45000000,
      "liquidity": 120000000,
      "marketCap": 890000000
    }
  ],
  "timestamp": 1699123456789,
  "source": "DexScreener"
}
```

**Token Object:**
- `address` (string) - Token contract address
- `symbol` (string) - Token ticker symbol
- `name` (string) - Full token name
- `priceUsd` (string) - Current price in USD
- `priceChange24h` (number) - 24h price change percentage
- `volume24h` (number) - 24h trading volume in USD
- `liquidity` (number) - Total liquidity in USD
- `marketCap` (number) - Market capitalization in USD

**Status Codes:**
- `200` - Success
- `500` - Server error (e.g., DexScreener API unavailable)

---

### Get Trading Statistics

**GET** `/api/trading-stats`

Get aggregated trading statistics.

**Request:**
```bash
curl http://localhost:3001/api/trading-stats
```

**Response:**
```json
{
  "totalTrades": 42,
  "wins": 28,
  "losses": 14,
  "winRate": 66.67,
  "totalPL": 0.125,
  "avgPL": 0.00298,
  "currentSession": {
    "totalTrades": 5,
    "wins": 3,
    "losses": 2,
    "winRate": 60,
    "totalPL": 0.015,
    "avgPL": 0.003
  }
}
```

**Fields:**
- `totalTrades` (number) - All-time total trades
- `wins` (number) - Profitable trades
- `losses` (number) - Losing trades
- `winRate` (number) - Win rate percentage
- `totalPL` (number) - Total profit/loss in BNB
- `avgPL` (number) - Average profit/loss per trade
- `currentSession` (object) - Stats for current session only

**Status Codes:**
- `200` - Success
- `500` - Server error

---

### Get Trade Logs

**GET** `/api/trade-logs`

Get recent trade logs from current session.

**Query Parameters:**
- `limit` (optional) - Number of logs to return (default: 50, max: 100)

**Request:**
```bash
curl "http://localhost:3001/api/trade-logs?limit=20"
```

**Response:**
```json
{
  "total": 20,
  "logs": [
    {
      "id": "log-123abc",
      "timestamp": 1699123456789,
      "token": "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
      "tokenSymbol": "CAKE",
      "action": "buy",
      "amount": 0.05,
      "price": 3.45,
      "status": "success",
      "txHash": "0xabc...def",
      "profitLoss": 0.002
    }
  ]
}
```

**Log Object:**
- `id` (string) - Log identifier
- `timestamp` (number) - Unix timestamp
- `token` (string) - Token address
- `tokenSymbol` (string) - Token symbol
- `action` (string) - "buy" or "sell"
- `amount` (number) - Amount in BNB
- `price` (number) - Entry price
- `status` (string) - "pending", "success", or "failed"
- `txHash` (string) - Transaction hash
- `error` (string) - Error message (if failed)
- `profitLoss` (number) - P/L if completed

**Status Codes:**
- `200` - Success
- `500` - Server error

---

## ⚠️ Error Responses

All endpoints may return errors in this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

**Common Error Codes:**
- `VALIDATION_ERROR` - Invalid request parameters
- `BOT_ALREADY_RUNNING` - Attempted to start bot when already running
- `BOT_NOT_RUNNING` - Attempted to stop bot when not running
- `INTERNAL_ERROR` - Server-side error

**HTTP Status Codes:**
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid API key)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## 🔒 Rate Limiting

Requests are rate limited per IP address:

| Endpoint Category | Limit |
|------------------|-------|
| General API | 100 requests / 15 minutes |
| Bot Control | 10 requests / 15 minutes |
| Health Checks | 300 requests / 15 minutes |

**Rate Limit Response:**
```json
{
  "error": "Too many requests, please try again later"
}
```

**HTTP Status:** `429 Too Many Requests`

**Headers:**
- `X-RateLimit-Limit` - Request limit
- `X-RateLimit-Remaining` - Requests remaining
- `X-RateLimit-Reset` - Time when limit resets (Unix timestamp)

---

## 📊 Example Workflows

### Start Trading Bot
```bash
# 1. Check bot status
curl http://localhost:3001/api/bot-status

# 2. Discover trending tokens
curl "http://localhost:3001/api/discover-tokens?limit=5"

# 3. Start bot with discovered tokens
curl -X POST http://localhost:3001/api/start-bot \
  -H "Content-Type: application/json" \
  -d '{
    "tokens": ["0x...token1", "0x...token2"],
    "risk": 5
  }'

# 4. Monitor status
curl http://localhost:3001/api/bot-status

# 5. Check trade logs
curl http://localhost:3001/api/trade-logs

# 6. Stop bot
curl -X POST http://localhost:3001/api/stop-bot
```

### Monitor Trading Activity
```bash
# Poll for updates every 30 seconds
while true; do
  echo "--- $(date) ---"
  curl http://localhost:3001/api/trading-stats
  sleep 30
done
```

---

## 🧪 Testing

### Using cURL
```bash
# Health check
curl -i http://localhost:3001/health

# With API key
curl -i http://localhost:3001/api/bot-status \
  -H "X-API-Key: your-key"

# POST with data
curl -i -X POST http://localhost:3001/api/start-bot \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d '{"tokens":[],"risk":5}'
```

### Using JavaScript (fetch)
```javascript
// Get bot status
const status = await fetch('http://localhost:3001/api/bot-status', {
  headers: {
    'X-API-Key': 'your-key'
  }
}).then(r => r.json());

// Start bot
const result = await fetch('http://localhost:3001/api/start-bot', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-key'
  },
  body: JSON.stringify({
    tokens: [],
    risk: 5
  })
}).then(r => r.json());
```

---

**API Version**: 1.0.0
**Last Updated**: 2025-11-08
