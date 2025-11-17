# WebSocket and Polymarket Agent Integration

This document explains the real-time WebSocket notifications and Polymarket autonomous trading agent integration added to the Immortal AI Trading Bot.

## Overview

The integration adds two major features:
1. **Real-time WebSocket notifications** - Live updates for trades, opportunities, AI decisions, and Telegram messages
2. **Polymarket Agent Orchestrator** - Bridge between TypeScript backend and Python Polymarket agents with RAG/LLM capabilities

## Architecture

```
┌─────────────────┐         ┌──────────────────────┐         ┌─────────────────────┐
│   Frontend      │◄────────┤  WebSocket Manager   │◄────────┤  Polymarket Agent   │
│   (Next.js)     │  Socket │  (Socket.io Server)  │  Events │  Orchestrator       │
└─────────────────┘         └──────────────────────┘         └─────────────────────┘
                                       │                                │
                                       │                                │
                                       ▼                                ▼
                            ┌──────────────────────┐         ┌─────────────────────┐
                            │  Express API Server  │         │  Python Agent       │
                            │  (HTTP Endpoints)    │         │  (agents/trade.py)  │
                            └──────────────────────┘         └─────────────────────┘
                                       │                                │
                                       │                                │
                                       ▼                                ▼
                            ┌──────────────────────┐         ┌─────────────────────┐
                            │  Telegram API        │         │  LangChain + RAG    │
                            │  (Notifications)     │         │  (ChromaDB)         │
                            └──────────────────────┘         └─────────────────────┘
```

## 1. WebSocket Manager (`src/services/webSocketManager.ts`)

### Features
- Real-time bidirectional communication with frontend
- Multiple notification types: trade, opportunity, telegram, ai-decision, crosschain, error
- Connection/disconnection management
- Notification history (last 100 notifications)
- Automatic reconnection support

### Key Methods

```typescript
// Initialize WebSocket server
webSocketManager.initialize(httpServer);

// Send trade notification
webSocketManager.sendTradeNotification({
  id: 'trade_123',
  timestamp: Date.now(),
  type: 'dex',
  token: 'WBNB',
  action: 'buy',
  amount: 1.5,
  profit: 0.25,
  txHash: '0x...',
});

// Send AI decision notification
webSocketManager.sendAIDecisionNotification({
  id: 'decision_123',
  timestamp: Date.now(),
  action: 'buy',
  market: 'Will BTC reach $100k?',
  confidence: 0.85,
  reasoning: 'Strong momentum indicators...',
});

// Send generic notification
webSocketManager.sendNotification({
  type: 'success',
  title: 'Trade Executed',
  message: 'Successfully bought 1.5 WBNB',
  timestamp: Date.now(),
});
```

### WebSocket Connection (Frontend)

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  path: '/ws',
  transports: ['websocket'],
});

// Listen for notifications
socket.on('notification', (data) => {
  console.log('Received notification:', data);
});

// Listen for trade notifications
socket.on('trade', (trade) => {
  console.log('Trade executed:', trade);
});

// Listen for AI decisions
socket.on('ai-decision', (decision) => {
  console.log('AI Decision:', decision);
});

// Request notification history
socket.on('history', (history) => {
  console.log('Notification history:', history);
});

// Handle connection
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});
```

## 2. Polymarket Agent Orchestrator (`src/services/polymarketAgentOrchestrator.ts`)

### Features
- Manages Python Polymarket agent lifecycle (start/stop)
- Spawns Python agent as child process with proper environment
- Parses JSON output from Python agent in real-time
- Emits TypeScript events for decisions and trades
- Tracks decision and trade history
- Automatic process cleanup on errors

### Configuration

```typescript
const orchestrator = new PolymarketAgentOrchestrator({
  agentsPath: path.join(process.cwd(), 'agents'),
  maxTradeAmount: 100, // Max USDC per trade
  minConfidence: 0.7,  // Minimum confidence threshold
});
```

### Event Handling

```typescript
// Listen for AI decisions
orchestrator.on('decision', (decision) => {
  console.log('AI Decision:', decision);
  // decision = { id, timestamp, action, market, confidence, reasoning }
});

// Listen for trade executions
orchestrator.on('trade', (trade) => {
  console.log('Trade Executed:', trade);
  // trade = { id, timestamp, market, action, amount, profitLoss, transactionHash }
});

// Listen for agent lifecycle events
orchestrator.on('started', () => {
  console.log('Agent started');
});

orchestrator.on('stopped', () => {
  console.log('Agent stopped');
});
```

### Python Agent Integration

The orchestrator spawns `agents/application/trade.py` with environment variables:

```bash
PYTHONPATH=/path/to/agents
MAX_TRADE_AMOUNT=100
MIN_CONFIDENCE=0.7
POLYGON_WALLET_PRIVATE_KEY=...
OPENAI_API_KEY=...
```

The Python agent outputs JSON to stdout:

```json
{
  "type": "decision",
  "market": "Will BTC reach $100k by Dec 2024?",
  "action": "buy",
  "confidence": 0.85,
  "reasoning": "Strong bullish momentum with breakout pattern..."
}
```

```json
{
  "type": "trade",
  "market": "Will BTC reach $100k by Dec 2024?",
  "action": "buy",
  "amount": 50,
  "profitLoss": 12.5,
  "transactionHash": "0x..."
}
```

## 3. API Endpoints

### Polymarket Agent Control

**POST /api/polymarket-agent/start**
Start the Polymarket autonomous trading agent
```bash
curl -X POST http://localhost:3001/api/polymarket-agent/start \
  -H "Content-Type: application/json" \
  -d '{
    "maxTradeAmount": 100,
    "minConfidence": 0.75
  }'
```

**POST /api/polymarket-agent/stop**
Stop the Polymarket agent
```bash
curl -X POST http://localhost:3001/api/polymarket-agent/stop
```

**GET /api/polymarket-agent/status**
Get agent status and statistics
```bash
curl http://localhost:3001/api/polymarket-agent/status
```

Response:
```json
{
  "isRunning": true,
  "startedAt": 1699564800000,
  "uptime": 3600000,
  "totalDecisions": 25,
  "totalTrades": 12,
  "totalProfit": 125.50,
  "config": {
    "maxTradeAmount": 100,
    "minConfidence": 0.7
  }
}
```

**GET /api/polymarket-agent/decisions**
Get recent AI decisions
```bash
curl http://localhost:3001/api/polymarket-agent/decisions?limit=20
```

**GET /api/polymarket-agent/trades**
Get recent trades
```bash
curl http://localhost:3001/api/polymarket-agent/trades?limit=20
```

## 4. Event Flow

### Example: Polymarket Trade Execution

1. **Python Agent** (agents/application/trade.py) makes decision using LangChain + RAG
2. **Python Agent** outputs JSON decision to stdout
3. **Orchestrator** parses JSON and emits `decision` event
4. **WebSocket Manager** receives `decision` event and broadcasts to all connected clients
5. **Frontend** displays real-time AI decision notification
6. **Python Agent** executes trade on Polymarket CLOB
7. **Python Agent** outputs JSON trade result to stdout
8. **Orchestrator** parses JSON and emits `trade` event
9. **WebSocket Manager** receives `trade` event and broadcasts to frontend
10. **Telegram Integration** checks if notifications are enabled
11. **Telegram Bot** sends formatted message via Telegram API
12. **WebSocket Manager** broadcasts Telegram notification to frontend
13. **Frontend** updates trade log, portfolio, and shows Telegram message

## 5. Telegram Integration

When Polymarket agent executes a trade, automatic Telegram notification is sent if enabled:

```
💚 Polymarket Trade

Market: Will BTC reach $100k by Dec 2024?
Action: BUY
Amount: 50 USDC
P/L: +12.50 USDC
Time: 11/17/2024, 2:30:00 PM
```

Configuration is managed via `/api/telegram/config` endpoint.

## 6. RAG/LLM Integration

The Python Polymarket agents use:
- **LangChain** - Framework for building LLM applications
- **ChromaDB** - Vector database for storing and retrieving relevant context
- **OpenAI GPT-4** - LLM for decision making
- **Tavily Search** - Real-time web search for market research
- **News API** - Financial news integration

The RAG pipeline:
1. Fetch market data from Polymarket Gamma API
2. Search web for relevant news and analysis
3. Store articles in ChromaDB vector database
4. Query ChromaDB for similar historical markets and outcomes
5. Feed context + market data to GPT-4
6. GPT-4 makes decision with reasoning
7. Execute trade if confidence > threshold

## 7. Testing

### Start WebSocket Server
```bash
npm run dev
# Server will start with WebSocket on ws://localhost:3001/ws
```

### Test WebSocket Connection
```javascript
// In browser console or Node.js
const io = require('socket.io-client');
const socket = io('http://localhost:3001', { path: '/ws' });

socket.on('connect', () => console.log('Connected!'));
socket.on('notification', (data) => console.log('Notification:', data));
```

### Start Polymarket Agent
```bash
curl -X POST http://localhost:3001/api/polymarket-agent/start \
  -H "Content-Type: application/json" \
  -d '{"maxTradeAmount": 100, "minConfidence": 0.75}'
```

### Check Agent Status
```bash
curl http://localhost:3001/api/polymarket-agent/status | jq
```

## 8. Production Deployment

### Environment Variables
```bash
# Backend API
PORT=3001
FRONTEND_URL=https://your-domain.com

# Polymarket Agents
POLYGON_WALLET_PRIVATE_KEY=your_private_key
OPENAI_API_KEY=your_openai_key
TAVILY_API_KEY=your_tavily_key  # Optional: for web search
NEWS_API_KEY=your_news_key      # Optional: for news

# Agent Configuration
MAX_TRADE_AMOUNT=100
MIN_CONFIDENCE=0.7
```

### Python Setup
```bash
cd agents/
virtualenv --python=python3.9 .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Docker Deployment (Optional)
```bash
# Build agents Docker image
cd agents/
docker build -t polymarket-agents .

# Run agents container
docker run -d \
  --name polymarket-agents \
  -e POLYGON_WALLET_PRIVATE_KEY=... \
  -e OPENAI_API_KEY=... \
  polymarket-agents
```

## 9. Security Considerations

1. **WebSocket Authentication** - Consider adding WebSocket authentication for production
2. **API Rate Limiting** - All endpoints use express-rate-limit
3. **Private Key Storage** - Use environment variables, never commit private keys
4. **CORS Configuration** - Configure `FRONTEND_URL` for production domain
5. **Process Isolation** - Python agent runs as isolated child process
6. **Error Handling** - Automatic process cleanup and error logging

## 10. Total API Endpoints

The backend now has **30 total API endpoints**:
- 13 original bot/trading endpoints
- 6 cross-chain endpoints
- 6 AI/Greenfield endpoints
- 4 Telegram/Settings endpoints
- 5 Polymarket agent endpoints
- 1 health check

Plus WebSocket server on `/ws` for real-time updates.

## Next Steps

1. **Frontend Integration** - Update frontend pages to connect to WebSocket
2. **Agent Dashboard** - Create dedicated page for Polymarket agent monitoring
3. **Notification Center** - Build UI component for WebSocket notifications
4. **Multi-Agent Support** - Extend to support multiple concurrent agents
5. **Portfolio Tracking** - Track Polymarket positions across multiple markets
6. **Backtesting** - Add historical backtesting using Polymarket data
