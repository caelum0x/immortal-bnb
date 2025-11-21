# 🚀 START HERE - Complete Setup Guide

## ✅ What's Fixed

1. ✅ **Frontend package.json**: `start` now uses `next dev` (development mode)
2. ✅ **Database**: Made optional (app works without Prisma)
3. ✅ **Greenfield SDK**: Made optional (app works without it)
4. ✅ **Wallet initialization**: Better error handling
5. ✅ **Startup scripts**: Both Bun and Node.js versions available

## 🎯 Quick Start (Recommended)

### Option 1: Node.js (Recommended - avoids Bun/ethers v6 issue)

```bash
cd /Users/arhansubasi/immortal-bnb-1
./start-all-node.sh
```

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd /Users/arhansubasi/immortal-bnb-1
npx tsx src/index.ts
```

**Terminal 2 - Frontend:**
```bash
cd /Users/arhansubasi/immortal-bnb-1/frontend
bun run dev
```

## 📋 Prerequisites

1. **Node.js** (v18+): ✅ You have v24.3.0
2. **tsx**: ✅ Installed globally
3. **Bun**: ✅ Installed (for frontend)
4. **.env file**: ✅ Configured with test wallet

## 🔧 Known Issues & Solutions

### Issue: Bun/ethers v6 Compatibility
**Solution**: Use Node.js for backend (`./start-all-node.sh`)

### Issue: Prisma Client Not Generated
**Solution**: App works without it. To enable database features:
```bash
npx prisma generate
```

### Issue: Greenfield SDK Errors
**Solution**: App works without it. Greenfield is optional.

## 📊 Access Points

Once running:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **WebSocket**: ws://localhost:3001/ws

## 🐛 Troubleshooting

### Services Not Starting

1. **Check logs**:
   ```bash
   tail -f logs/backend.log
   tail -f logs/frontend.log
   ```

2. **Check ports**:
   ```bash
   lsof -i :3000
   lsof -i :3001
   ```

3. **Kill old processes**:
   ```bash
   pkill -f "tsx.*index"
   pkill -f "next"
   ```

### Database Errors

The app is configured to work **without** a database. If you see Prisma errors, they're warnings and won't stop the app.

To enable database:
```bash
npx prisma generate
npx prisma migrate dev
```

## ✅ Success Indicators

You'll know it's working when you see:

```
==================================================
🎉 All Services Started Successfully!
==================================================

📊 Access Points:
   Frontend:  http://localhost:3000
   Backend:   http://localhost:3001
```

And you can access:
- http://localhost:3000 (should show landing page)
- http://localhost:3001/health (should return health status)

## 🎯 Next Steps

1. Open http://localhost:3000 in your browser
2. Click "Connect Wallet" (MetaMask)
3. Start trading!

---

**All services are now configured to start together!** 🚀

