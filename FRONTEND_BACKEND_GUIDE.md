# Frontend-Backend Connection Guide

This guide explains how to run both the frontend and backend together for the Immortal AI Trading Bot.

## Quick Start

### 1. Install Dependencies

First, install the main backend dependencies:
```bash
bun install
```

Then install frontend dependencies:
```bash
cd frontend && bun install && cd ..
```

### 2. Set Up Environment Variables

Copy the environment files and configure them:

**Backend (.env):**
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

**Frontend (.env):**
```bash
cp frontend/.env.example frontend/.env
# The frontend .env is already configured to connect to localhost:3001
```

### 3. Run Both Frontend and Backend

**Option A: Run both together (recommended):**
```bash
bun run dev:full
```

**Option B: Run separately in different terminals:**

Terminal 1 (Backend):
```bash
bun run dev:backend
```

Terminal 2 (Frontend):
```bash
bun run dev:frontend
```

## Access Points

- **Frontend Dashboard:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/api/health
- **Connection Test:** http://localhost:3001/api/ping

## API Endpoints

The backend exposes these REST endpoints for the frontend:

### Core Endpoints
- `GET /api/health` - Server health check
- `GET /api/ping` - Connection test
- `GET /api/status` - Bot status and summary

### Trading Data
- `GET /api/trades?limit=50` - Get recent trades
- `GET /api/trades/:memoryId` - Get specific trade
- `GET /api/stats` - Trading statistics

### Wallet & Tokens
- `GET /api/wallet/balance` - Get wallet balance
- `GET /api/token/:address` - Get token data
- `GET /api/token/:address/balance` - Get token balance

## Troubleshooting

### Connection Issues

1. **"Network error: Cannot connect to backend"**
   - Make sure the backend is running on port 3001
   - Check if another process is using port 3001: `lsof -i :3001`
   - Verify environment variables are set correctly

2. **CORS Errors**
   - The backend is configured to allow frontend origins
   - Make sure you're accessing frontend from http://localhost:5173

3. **Port Conflicts**
   - Backend runs on port 3001 (configurable via API_PORT in .env)
   - Frontend runs on port 5173 (Vite default)
   - Change ports if they conflict with other services

### Backend Issues

1. **Missing Environment Variables**
   - Copy `.env.example` to `.env`
   - Set required variables like `OPENROUTER_API_KEY`
   - Set `WALLET_PRIVATE_KEY` for testnet

2. **Database Issues**
   - The bot uses BNB Greenfield for memory storage
   - Configure Greenfield credentials in .env if needed

### Frontend Issues

1. **Build Errors**
   - Make sure all dependencies are installed: `cd frontend && bun install`
   - Check TypeScript errors: `cd frontend && bun run build`

2. **API Connection**
   - Verify VITE_API_URL in frontend/.env points to the correct backend URL
   - Default: `VITE_API_URL=http://localhost:3001`

## Development Scripts

### Main Project
- `bun run dev:full` - Run both frontend and backend
- `bun run dev:backend` - Run only backend with auto-reload
- `bun run dev:frontend` - Run only frontend dev server
- `bun run build:all` - Build both frontend and backend
- `bun start` - Run the trading bot (production)

### Frontend Only
- `cd frontend && bun dev` - Start development server
- `cd frontend && bun build` - Build for production
- `cd frontend && bun preview` - Preview production build

## Production Deployment

For production deployment:

1. Build both applications:
```bash
bun run build:all
```

2. Set production environment variables
3. Run the backend:
```bash
bun start
```

4. Serve the frontend build (frontend/dist) with a web server like nginx

## API Rate Limiting

The backend includes basic CORS protection and connects to:
- OpenRouter API for AI decisions
- DexScreener API for token data  
- BNB Chain RPC for blockchain operations
- PancakeSwap for trading

Monitor API usage to avoid rate limits.
