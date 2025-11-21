# 🚀 Immortal AI Trading Bot - Startup Guide

## Quick Start (One Command)

Start everything (backend + frontend + all services) with a single command:

```bash
bun start
# or
./start-all.sh
```

This will start:
- ✅ Backend API Server (Port 3001)
- ✅ Frontend Dashboard (Port 3000)
- ✅ All Integrated Services:
  - AI Orchestrator
  - Order Monitoring Service
  - Price Feed Service
  - Risk Management Service
  - Analytics Service
  - WebSocket Manager
  - Polymarket Services

## Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main dashboard UI |
| **Backend API** | http://localhost:3001 | REST API endpoints |
| **WebSocket** | ws://localhost:3001/ws | Real-time updates |
| **Health Check** | http://localhost:3001/health | Server health status |

## What's Running

### Backend (Port 3001)

The backend includes all these integrated services:

1. **AI Orchestrator** - Routes decisions to TypeScript/Python agents
2. **Order Monitoring Service** - Tracks LIMIT/STOP orders (checks every 5s)
3. **Price Feed Service** - Multi-source price aggregation (updates every 10s)
4. **Risk Management Service** - Portfolio risk validation before trades
5. **Analytics Service** - Records all trades and decisions
6. **WebSocket Manager** - Broadcasts real-time events to frontend
7. **Polymarket Services** - Prediction market trading integration

### Frontend (Port 3000)

- Next.js dashboard
- Wallet connection (MetaMask/Web3)
- Real-time data updates
- WebSocket live notifications

## Logs

View real-time logs:

```bash
# Backend logs
tail -f logs/backend.log

# Frontend logs
tail -f logs/frontend.log

# All logs
tail -f logs/*.log
```

## Stop All Services

Press `Ctrl+C` in the terminal where you ran `bun start`

The script will automatically cleanup and stop all services.

## Manual Start (Separate Terminals)

If you prefer to run services in separate terminals:

### Terminal 1: Backend
```bash
bun run backend
# or
bun run src/index.ts
```

### Terminal 2: Frontend
```bash
cd frontend
bun dev
```

## Environment Setup

Make sure you have configured your `.env` file:

```bash
# AI
OPENROUTER_API_KEY=sk-xxx

# Blockchain
BNB_RPC=https://bsc-testnet.bnbchain.org
WALLET_PRIVATE_KEY=0xxx

# Trading
MAX_TRADE_AMOUNT_BNB=0.1
STOP_LOSS_PERCENTAGE=5
```

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

```bash
# Check what's using the ports
lsof -i :3000  # Frontend
lsof -i :3001  # Backend

# Kill the process
kill -9 <PID>
```

### Services Not Starting

Check the logs:

```bash
cat logs/backend.log
cat logs/frontend.log
```

### Backend Not Responding

Test the backend health:

```bash
curl http://localhost:3001/health
```

### Missing Dependencies

Install all dependencies:

```bash
bun run install:all
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Port 3000)                 │
│  Next.js Dashboard + Wallet Connect + Real-time UI     │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTP/WebSocket
                  ↓
┌─────────────────────────────────────────────────────────┐
│              Backend API (Port 3001)                    │
├─────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐   │
│  │  Service Orchestration Layer                   │   │
│  ├────────────────────────────────────────────────┤   │
│  │  • AI Orchestrator (TS/Python routing)         │   │
│  │  • Order Monitoring (LIMIT/STOP tracking)      │   │
│  │  • Price Feed (multi-source aggregation)       │   │
│  │  • Risk Management (portfolio validation)      │   │
│  │  • Analytics (performance tracking)            │   │
│  │  • WebSocket Manager (real-time events)        │   │
│  │  • Polymarket Services (prediction markets)    │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  Trading Loop (Every 5 minutes)                        │
│    → AI Decision → Risk Check → Execute → Track        │
└─────────────────────────────────────────────────────────┘
```

## Features Active

- ✅ **AI-Powered Decisions**: GPT-4 via OpenRouter
- ✅ **Multi-Platform Trading**: DEX (PancakeSwap) + Polymarket
- ✅ **Risk Management**: Portfolio limits and position sizing
- ✅ **Order Monitoring**: Automatic LIMIT/STOP execution
- ✅ **Price Aggregation**: Multi-source price feeds
- ✅ **Real-time Updates**: WebSocket notifications
- ✅ **Immortal Memory**: BNB Greenfield storage
- ✅ **Analytics**: Performance tracking and insights

## Next Steps

1. **Connect Wallet**: Click "Connect Wallet" on http://localhost:3000
2. **Configure Bot**: Set risk parameters and watchlist
3. **Start Trading**: Click "Start Bot" to begin automated trading
4. **Monitor**: Watch real-time updates in the dashboard

## Support

For issues or questions:
- Check logs in `logs/` directory
- Review `ARCHITECTURE.md` for system details
- See `TROUBLESHOOTING.md` for common issues

---

**"An AI that never forgets"** 🧠💾

