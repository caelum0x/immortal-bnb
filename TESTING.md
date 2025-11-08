# 🧪 Production Testing Checklist

Complete guide for testing the Immortal AI Trading Bot before and after deployment.

## Pre-Test Setup

### Requirements
- [ ] Backend server installed and configured
- [ ] Frontend built and ready
- [ ] MetaMask browser extension installed
- [ ] opBNB Testnet configured in MetaMask
- [ ] Test BNB in wallet (from https://testnet.bnbchain.org/faucet-smart)
- [ ] .env file configured with valid API keys

### Environment Verification

```bash
# Backend (.env file should have):
OPENROUTER_API_KEY=sk-or-v1-[your-key]
WALLET_PRIVATE_KEY=0x[your-testnet-key]
RPC_URL_TESTNET=https://opbnb-testnet-rpc.bnbchain.org
NETWORK=testnet
CHAIN_ID=5611
API_PORT=3001
```

```bash
# Frontend (.env.local should have):
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=[your-project-id]
NEXT_PUBLIC_USE_MAINNET=false
```

---

## Phase 1: Backend Testing

### 1.1 Server Startup Tests

```bash
# Start backend
npm run dev  # or bun run dev
```

**Expected Output:**
```
🌟 Immortal AI Trading Bot - Production Mode

✅ Environment validation passed

📋 Current Configuration:
Network: TESTNET
Chain ID: 5611
RPC: https://opbnb-testnet-rpc.bnbchain.org...
Wallet: 0x[your-address]...

💰 Trading Parameters:
  Max Trade: 1.0 BNB
  Stop Loss: 10%
  Slippage: 2%
  Interval: 300s

🔌 Integrations:
  OpenRouter: ✅ Configured
  Telegram: ✅ Configured  (or ⚪ Optional)
  Greenfield: ⚪ Optional

API server listening on port 3001
🤖 Bot is ready - use the frontend to start trading
🌐 Frontend: http://localhost:3000
🌐 API Server: http://localhost:3001
```

**Checklist:**
- [ ] No error messages during startup
- [ ] Environment validation passes
- [ ] Configuration summary displays correctly
- [ ] All required integrations show as configured
- [ ] API server starts on correct port

### 1.2 Health Endpoint Test

```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": 1234567890000,
  "botRunning": false
}
```

**Checklist:**
- [ ] Returns HTTP 200 status
- [ ] JSON response is valid
- [ ] `status` is "ok"
- [ ] `timestamp` is present and recent
- [ ] `botRunning` reflects actual bot state

### 1.3 Bot Status Endpoint Test

```bash
curl http://localhost:3001/api/bot-status
```

**Expected Response (when stopped):**
```json
{
  "running": false,
  "watchlist": [],
  "riskLevel": 5,
  "config": null
}
```

**Checklist:**
- [ ] Returns HTTP 200 status
- [ ] `running` is false initially
- [ ] `watchlist` is empty array
- [ ] `riskLevel` has default value
- [ ] `config` is null when not running

### 1.4 Start Bot Endpoint Test

```bash
curl -X POST http://localhost:3001/api/start-bot \
  -H "Content-Type: application/json" \
  -d '{"tokens":[],"risk":5}'
```

**Expected Response:**
```json
{
  "status": "started",
  "message": "Bot is now running",
  "config": {
    "tokens": [],
    "riskLevel": 5,
    "interval": 300000,
    "maxTradeAmount": 1.0,
    "stopLoss": 10,
    "network": "testnet"
  }
}
```

**Checklist:**
- [ ] Returns HTTP 200 status
- [ ] Bot starts successfully
- [ ] Configuration is returned
- [ ] Backend logs show bot started
- [ ] Health endpoint now shows `botRunning: true`

### 1.5 Stop Bot Endpoint Test

```bash
curl -X POST http://localhost:3001/api/stop-bot
```

**Expected Response:**
```json
{
  "status": "stopped",
  "message": "Bot has been stopped"
}
```

**Checklist:**
- [ ] Returns HTTP 200 status
- [ ] Bot stops successfully
- [ ] Backend logs show bot stopped
- [ ] Health endpoint now shows `botRunning: false`

### 1.6 Trade Logs Endpoint Test

```bash
curl http://localhost:3001/api/trade-logs?limit=10
```

**Expected Response:**
```json
{
  "total": 0,
  "logs": []
}
```

**Checklist:**
- [ ] Returns HTTP 200 status
- [ ] Returns array (even if empty)
- [ ] Respects limit parameter

### 1.7 Trading Stats Endpoint Test

```bash
curl http://localhost:3001/api/trading-stats
```

**Expected Response:**
```json
{
  "totalTrades": 0,
  "wins": 0,
  "losses": 0,
  "winRate": 0,
  "totalPL": 0,
  "avgPL": 0
}
```

**Checklist:**
- [ ] Returns HTTP 200 status
- [ ] All stat fields present
- [ ] Values are numbers
- [ ] Initial values are zero

### 1.8 Error Handling Tests

**Test: Double Start**
```bash
# Start bot
curl -X POST http://localhost:3001/api/start-bot \
  -H "Content-Type: application/json" \
  -d '{"tokens":[],"risk":5}'

# Try to start again (should fail)
curl -X POST http://localhost:3001/api/start-bot \
  -H "Content-Type: application/json" \
  -d '{"tokens":[],"risk":5}'
```

**Expected:**
- [ ] Second request returns HTTP 400
- [ ] Error message: "Bot is already running"

**Test: Stop Non-Running Bot**
```bash
# Ensure bot is stopped first
curl -X POST http://localhost:3001/api/stop-bot

# Try to stop again (should fail)
curl -X POST http://localhost:3001/api/stop-bot
```

**Expected:**
- [ ] Returns HTTP 400
- [ ] Error message: "Bot is not running"

---

## Phase 2: Frontend Testing

### 2.1 Frontend Startup

```bash
# In a new terminal
cd apps/frontend
npm run dev  # or bun run dev
```

**Expected:**
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- ready in Xms
```

**Checklist:**
- [ ] Compiles without errors
- [ ] Starts on port 3000
- [ ] No build warnings for production issues

### 2.2 Initial Load Test

**Navigate to:** http://localhost:3000

**Expected:**
- [ ] Page loads without errors
- [ ] Header displays "Immortal AI Trading Bot"
- [ ] "Connect Wallet" button visible
- [ ] No console errors in browser DevTools
- [ ] Styles load correctly
- [ ] Gradient backgrounds render

### 2.3 Backend Connection Test

**Check:** Dashboard should detect backend

**Expected:**
- [ ] No "Backend Server Not Running" error
- [ ] If backend is down, error displays clearly
- [ ] If backend is up, dashboard shows normally
- [ ] Error messages are user-friendly

### 2.4 Wallet Connection Tests

**Test 1: Connect Wallet**
1. Click "Connect Wallet" button

**Expected:**
- [ ] RainbowKit modal appears
- [ ] MetaMask option is visible
- [ ] Can select wallet

**Test 2: MetaMask Connection**
1. Click MetaMask option
2. Approve connection in MetaMask

**Expected:**
- [ ] MetaMask opens
- [ ] Connection request appears
- [ ] After approval, wallet address displays
- [ ] Address is truncated (0x1234...5678)
- [ ] Balance shows (if available)

**Test 3: Network Switching**
1. Ensure on opBNB Testnet
2. Try switching to different network in MetaMask

**Expected:**
- [ ] App detects network change
- [ ] Warning appears if wrong network
- [ ] Can switch back to opBNB Testnet
- [ ] Chain ID 5611 is correct

**Test 4: Disconnect Wallet**
1. Click wallet address dropdown
2. Click "Disconnect"

**Expected:**
- [ ] Wallet disconnects
- [ ] "Connect Wallet" button appears again
- [ ] Can reconnect successfully

### 2.5 Dashboard Tab Tests

**Navigate to Dashboard tab (should be default)**

**Test 1: Bot Status Display**

**Expected:**
- [ ] Bot status card shows "Stopped" (red indicator)
- [ ] Configuration inputs are enabled
- [ ] Start button is visible and enabled

**Test 2: Token Watchlist**

**Test adding tokens:**
1. Enter token address: `0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82`
2. Click "+ Add Token"

**Expected:**
- [ ] Input accepts 0x format
- [ ] New input field appears
- [ ] Can add multiple tokens
- [ ] Can remove tokens (✕ button)
- [ ] Minimum 1 input always present

**Test auto-discovery:**
1. Leave all token inputs empty
2. Check hint text

**Expected:**
- [ ] Hint says "Leave empty to auto-discover trending tokens"
- [ ] Empty array is valid (no validation error)

**Test 3: Risk Level Slider**

1. Move slider from 1 to 10

**Expected:**
- [ ] Slider moves smoothly
- [ ] Value updates (1/10, 2/10, etc.)
- [ ] Label changes (Conservative → Moderate → Aggressive)
- [ ] Color changes (green → yellow → red)

**Test 4: Start Bot**

1. Configure settings (tokens + risk)
2. Click "🚀 Start Trading Bot"

**Expected:**
- [ ] Button shows loading state ("⏳ Starting...")
- [ ] API request sent to backend
- [ ] Bot status changes to "Running" (green animated indicator)
- [ ] Configuration inputs become disabled
- [ ] Stop button appears
- [ ] No errors in console

**Test 5: Stop Bot**

1. With bot running, click "🛑 Stop Bot"

**Expected:**
- [ ] Button shows loading state ("⏳ Stopping...")
- [ ] API request sent to backend
- [ ] Bot status changes to "Stopped" (red indicator)
- [ ] Configuration inputs become enabled
- [ ] Start button appears
- [ ] No errors

### 2.6 Trading Stats Tab Tests

**Navigate to Stats tab**

**Expected:**
- [ ] Stats cards display
- [ ] Shows: Total Trades, Win Rate, Total P/L
- [ ] Values are 0 initially (or real data if trades exist)
- [ ] Loading skeleton shows briefly
- [ ] Auto-refreshes every 30 seconds
- [ ] No errors in console

**Test Refresh:**
1. Wait 30+ seconds

**Expected:**
- [ ] Stats automatically update
- [ ] No page flicker
- [ ] Smooth update transition

### 2.7 Memories Tab Tests

**Navigate to Memories tab**

**Expected:**
- [ ] Memories list displays
- [ ] Shows empty state if no trades: "No trade memories yet"
- [ ] Filter buttons visible (All, Profit, Loss, Pending)
- [ ] Auto-refreshes every 60 seconds
- [ ] No errors

**Test Filters (if memories exist):**
1. Click "Profit" filter
2. Click "Loss" filter
3. Click "All" filter

**Expected:**
- [ ] List filters correctly
- [ ] Active filter is highlighted
- [ ] Empty state shows if no matches
- [ ] Filter state persists

**Test Refresh:**
1. Click refresh button (if available)

**Expected:**
- [ ] Loading state shows
- [ ] Data refreshes
- [ ] Returns to previous state

### 2.8 Discover Tab Tests

**Navigate to Discover tab**

**Expected:**
- [ ] Token cards display
- [ ] Shows trending tokens from DexScreener
- [ ] Each card shows: symbol, name, price, volume, liquidity
- [ ] Auto-refreshes every 120 seconds (2 min)
- [ ] No errors

**Test Token Card Features:**
1. Find a token card
2. Check links and copy button

**Expected:**
- [ ] DexScreener link works (opens in new tab)
- [ ] PancakeSwap link works (opens in new tab)
- [ ] Copy address button works
- [ ] Tooltip shows "Copied!" after clicking
- [ ] Address is valid (0x format)

### 2.9 Staking Tab Tests

**Navigate to Staking tab**

**Expected:**
- [ ] Staking UI displays
- [ ] Shows "Contracts Not Deployed" warning (if not deployed)
- [ ] Balance display shows 0.00 or real balance
- [ ] Staking tiers display (4 tiers)
- [ ] APY percentages show
- [ ] Stake button is disabled until contracts deployed

---

## Phase 3: Error Handling Tests

### 3.1 Backend Down Scenario

**Test:**
1. Stop backend server
2. Refresh frontend

**Expected:**
- [ ] "Backend Server Not Running" error displays
- [ ] Error message is clear and helpful
- [ ] Suggests starting API server
- [ ] Shows command: `npm run dev`
- [ ] All API-dependent features show errors
- [ ] No silent failures
- [ ] No infinite loading states

**Recovery:**
1. Start backend server
2. Wait or refresh frontend

**Expected:**
- [ ] Error disappears
- [ ] Frontend auto-recovers
- [ ] Can use all features again

### 3.2 Invalid Configuration Tests

**Test 1: Invalid Token Address**
1. Enter invalid address: `0xinvalid`
2. Try to start bot

**Expected:**
- [ ] Validation error (either client or server)
- [ ] Error message explains format
- [ ] Bot doesn't start
- [ ] User can correct

**Test 2: Out of Range Risk**
1. Try to set risk < 1 or > 10 (via DevTools if needed)

**Expected:**
- [ ] Slider prevents invalid values
- [ ] OR server validates and rejects
- [ ] Error message is clear

### 3.3 Network Issues

**Test 1: Wallet on Wrong Network**
1. Connect wallet
2. Switch MetaMask to different network (e.g., Ethereum mainnet)

**Expected:**
- [ ] App detects wrong network
- [ ] Warning/error message displays
- [ ] Bot operations are prevented
- [ ] User prompted to switch networks

**Test 2: Insufficient Balance**
1. Use wallet with < 0.01 BNB

**Expected:**
- [ ] Balance shows correctly
- [ ] Warning about low balance (if implemented)
- [ ] Bot may start but can't trade (logged in backend)

---

## Phase 4: Performance Tests

### 4.1 Page Load Performance

**Test:**
1. Open DevTools → Network tab
2. Hard refresh page (Ctrl+Shift+R)

**Metrics:**
- [ ] Initial HTML load < 200ms
- [ ] Total page load < 2 seconds
- [ ] No failed requests
- [ ] All assets load successfully

### 4.2 API Response Times

**Test:**
1. Open DevTools → Network tab
2. Start bot
3. Check API calls

**Metrics:**
- [ ] `/api/start-bot` responds < 500ms
- [ ] `/api/bot-status` responds < 100ms
- [ ] `/api/trading-stats` responds < 200ms
- [ ] No timeout errors

### 4.3 Real-Time Updates

**Test:**
1. Start bot
2. Watch Stats tab
3. Time updates

**Metrics:**
- [ ] Stats refresh exactly every 30s
- [ ] No duplicate requests
- [ ] No missed intervals
- [ ] No memory leaks (check DevTools Memory)

### 4.4 Memory Leaks

**Test:**
1. Open DevTools → Performance
2. Start recording
3. Navigate between tabs 10 times
4. Stop recording

**Expected:**
- [ ] Memory usage stays stable
- [ ] No unbounded growth
- [ ] Cleanup happens on tab change
- [ ] No console warnings about memory

---

## Phase 5: Security Tests

### 5.1 Environment Variables

**Check:**
```bash
# These should NOT be in frontend bundle:
grep -r "sk-or-v1" apps/frontend/.next/
grep -r "0xYOUR_ACTUAL" apps/frontend/.next/
```

**Expected:**
- [ ] No private keys in frontend code
- [ ] No API keys in frontend code
- [ ] Only NEXT_PUBLIC_ vars in frontend
- [ ] .env not committed to git

### 5.2 Network Tab Inspection

**Test:**
1. Open DevTools → Network
2. Perform actions (start bot, etc.)
3. Inspect all requests

**Expected:**
- [ ] No sensitive data in request headers
- [ ] No private keys in payloads
- [ ] HTTPS in production (HTTP OK for localhost)
- [ ] No leaked credentials

### 5.3 Console Inspection

**Test:**
1. Open DevTools → Console
2. Use all features
3. Check for leaks

**Expected:**
- [ ] No private keys logged
- [ ] No API secrets logged
- [ ] Error messages don't leak sensitive info
- [ ] Stack traces are helpful but safe

---

## Phase 6: Production Deployment Verification

### 6.1 Backend Production

**After deploying to VPS:**

```bash
# Test production API
curl https://api.yourdomain.com/health
```

**Expected:**
- [ ] Returns 200 OK
- [ ] HTTPS certificate valid
- [ ] Response time < 1 second
- [ ] Uptime monitoring active

### 6.2 Frontend Production

**After deploying to Vercel:**

**Visit:** https://yourdomain.com

**Expected:**
- [ ] Loads over HTTPS
- [ ] SSL certificate valid
- [ ] Connects to production API
- [ ] All features work
- [ ] No console errors
- [ ] Assets load from CDN

### 6.3 End-to-End Production Test

**Complete flow on production:**

1. Visit production frontend
2. Connect wallet
3. Configure and start bot
4. Check stats update
5. Check memories sync
6. Stop bot

**Expected:**
- [ ] All steps work smoothly
- [ ] Real data from DexScreener
- [ ] Real trades execute (testnet)
- [ ] Telegram alerts sent (if configured)
- [ ] Greenfield stores data (if configured)
- [ ] No errors in production logs

---

## Testing Summary

### Critical Tests (Must Pass)
- [x] Backend starts without errors
- [x] Frontend loads without errors
- [x] Wallet connection works
- [x] Bot can start and stop
- [x] Real-time data updates work
- [x] Error handling is graceful
- [x] No sensitive data leaks

### Important Tests (Should Pass)
- [ ] All API endpoints respond correctly
- [ ] Validation prevents invalid inputs
- [ ] Network switching works
- [ ] Performance meets targets
- [ ] Memory usage is stable

### Nice-to-Have Tests (Can Defer)
- [ ] Greenfield integration works
- [ ] Telegram alerts work
- [ ] Staking contracts deployed
- [ ] Advanced features tested

---

## Bug Reporting Template

If you find bugs during testing:

```markdown
### Bug Report

**Title:** [Short description]

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1.
2.
3.

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Screenshots:**
[If applicable]

**Environment:**
- Browser: [Chrome/Firefox/Safari]
- OS: [Windows/Mac/Linux]
- Backend: [Running/Stopped]
- Network: [Testnet/Mainnet]

**Console Errors:**
```
[Paste any console errors]
```

**Additional Notes:**
[Any other relevant information]
```

---

## Sign-Off

### Pre-Production Checklist
- [ ] All critical tests pass
- [ ] All important tests pass
- [ ] Known bugs documented
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Documentation complete

**Tested by:** _________________

**Date:** _________________

**Sign-off:** _________________

---

**Ready for Production:** YES / NO

**If NO, blocking issues:**
1.
2.
3.

