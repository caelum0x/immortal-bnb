# ⚡ Quick Start Guide

## One Command to Rule Them All

```bash
bun start
```

That's it! This single command starts:
- ✅ Backend API (Port 3001) with all services
- ✅ Frontend Dashboard (Port 3000)
- ✅ AI Orchestrator
- ✅ Order Monitoring
- ✅ Price Feed
- ✅ Risk Management
- ✅ Analytics
- ✅ WebSocket Real-time Updates
- ✅ Polymarket Integration

## URLs

- **Dashboard**: http://localhost:3000
- **API**: http://localhost:3001
- **Health**: http://localhost:3001/health

## Stop Everything

Press `Ctrl+C` in the terminal

## View Logs

```bash
# All logs
tail -f logs/*.log

# Just backend
tail -f logs/backend.log

# Just frontend
tail -f logs/frontend.log
```

## First Time Setup

```bash
# Install dependencies
bun install
cd frontend && bun install && cd ..

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start everything
bun start
```

## What You'll See

```
==================================================
🚀 Starting Immortal AI Trading Bot
==================================================

✅ Starting Backend API Server (Port 3001)
   - AI Orchestrator
   - Order Monitoring Service
   - Price Feed Service
   - Risk Management Service
   - Analytics Service
   - WebSocket Manager
   - Polymarket Services

⏳ Waiting for backend to initialize...
✅ Backend API Server is ready!

✅ Starting Frontend Dashboard (Port 3000)

==================================================
🎉 All Services Started Successfully!
==================================================

📊 Access Points:
   Frontend:  http://localhost:3000
   Backend:   http://localhost:3001
   WebSocket: ws://localhost:3001/ws
   Health:    http://localhost:3001/health

🛑 To stop: Press Ctrl+C
```

## Connect Your Wallet

1. Open http://localhost:3000
2. Click "Connect Wallet"
3. Approve MetaMask connection
4. You're ready to trade!

---

For more details, see [README-STARTUP.md](./README-STARTUP.md)
