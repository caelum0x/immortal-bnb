# API Documentation

Complete API reference for the Immortal AI Trading Bot.

## Base URL

- **Development**: `http://localhost:3001`
- **Production**: `https://api.immortal-bot.com`

## Authentication

Most endpoints require authentication via API key:

```bash
curl -H "X-API-Key: your-api-key" http://localhost:3001/api/endpoint
```

## Endpoints

### Health Check

#### GET /health

Basic health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-20T12:00:00.000Z",
  "botRunning": false
}
```

#### GET /api/health

Detailed health check with dependency status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T12:00:00.000Z",
  "checks": {
    "database": { "status": "up", "latency": 5 },
    "redis": { "status": "up", "latency": 2 },
    "blockchain": { "status": "up", "latency": 150 }
  }
}
```

### Bot Control

#### POST /api/start-bot

Start the trading bot.

**Request:**
```json
{
  "tokens": ["0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"],
  "risk": 5
}
```

**Response:**
```json
{
  "status": "started",
  "config": {
    "tokens": [],
    "riskLevel": 5,
    "maxTradeAmount": 0.1
  }
}
```

#### POST /api/stop-bot

Stop the trading bot.

**Response:**
```json
{
  "status": "stopped"
}
```

#### GET /api/bot-status

Get current bot status.

**Response:**
```json
{
  "running": true,
  "riskLevel": 5,
  "watchlist": [],
  "stats": {
    "totalTrades": 10,
    "winRate": 0.7
  }
}
```

### Trading Data

#### GET /api/discover-tokens

Discover trending tokens.

**Query Parameters:**
- `limit` (optional): Number of tokens to return (default: 20)

**Response:**
```json
{
  "tokens": [
    {
      "address": "0x...",
      "symbol": "CAKE",
      "price": 2.5,
      "volume24h": 1000000
    }
  ],
  "timestamp": "2025-01-20T12:00:00.000Z"
}
```

#### GET /api/trade-logs

Get trade history.

**Query Parameters:**
- `limit` (optional): Number of logs to return (default: 50)
- `offset` (optional): Pagination offset
- `tokenAddress` (optional): Filter by token

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "tokenAddress": "0x...",
      "action": "buy",
      "amount": "0.1",
      "txHash": "0x...",
      "outcome": "profit",
      "createdAt": "2025-01-20T12:00:00.000Z"
    }
  ],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

#### GET /api/trading-stats

Get trading statistics.

**Response:**
```json
{
  "totalTrades": 100,
  "successfulTrades": 70,
  "failedTrades": 30,
  "winRate": 0.7,
  "totalProfitLoss": "5.5",
  "avgTradeTime": 5000
}
```

### Memories

#### GET /api/memories

Get stored memories from Greenfield.

**Query Parameters:**
- `limit` (optional): Number of memories (default: 50)
- `tokenAddress` (optional): Filter by token

**Response:**
```json
{
  "memories": [
    {
      "id": "memory-id",
      "tokenSymbol": "CAKE",
      "action": "buy",
      "outcome": "profit",
      "confidence": 0.8,
      "createdAt": "2025-01-20T12:00:00.000Z"
    }
  ]
}
```

### Metrics

#### GET /metrics

Prometheus metrics endpoint.

**Response:** Prometheus format metrics

## Error Responses

All errors follow this format:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

### Status Codes

- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

## Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Bot Control**: 10 requests per 15 minutes
- **Auth Endpoints**: 5 requests per 15 minutes
- **Read Endpoints**: 200 requests per 15 minutes

Rate limit headers:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

## WebSocket Events

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {
  console.log('Connected');
});
```

### Events

- `trade`: New trade executed
- `bot-status`: Bot status change
- `error`: Error occurred
- `memory-stored`: New memory stored

### Example

```javascript
ws.on('message', (data) => {
  const event = JSON.parse(data);
  console.log('Event:', event.type, event.data);
});
```
