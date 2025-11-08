# 📋 Manual Testing Checklist

**Comprehensive testing guide for Immortal AI Trading Bot**

---

## ✅ Pre-Testing Setup

- [ ] Backend running: `bun run dev`
- [ ] Frontend running: `cd apps/frontend && npm run dev`
- [ ] MetaMask installed and configured
- [ ] Wallet has testnet BNB (>0.1 tBNB)
- [ ] `.env` configured with valid keys
- [ ] `apps/frontend/.env.local` configured

---

## 🔧 Backend API Testing

### Health Check
```bash
curl http://localhost:3001/health
```
**Expected**:
```json
{
  "status": "ok",
  "timestamp": 1699123456789,
  "botRunning": false
}
```
- [ ] Status is "ok"
- [ ] Timestamp is recent
- [ ] Bot running status correct

### Get Bot Status
```bash
curl http://localhost:3001/api/bot-status
```
**Expected**:
```json
{
  "running": false,
  "watchlist": [],
  "riskLevel": 5,
  "config": {
    "maxTradeAmount": 0.1,
    "stopLoss": 10,
    "network": "testnet"
  }
}
```
- [ ] Returns status object
- [ ] Config values match .env

### Discover Tokens
```bash
curl "http://localhost:3001/api/discover-tokens?limit=5"
```
**Expected**:
- [ ] Returns array of 5 tokens
- [ ] Each token has: symbol, address, liquidity, volume24h
- [ ] No errors

### Start Bot
```bash
curl -X POST http://localhost:3001/api/start-bot \
  -H "Content-Type: application/json" \
  -d '{"tokens":[],"risk":5}'
```
**Expected**:
```json
{
  "status": "started",
  "config": {...}
}
```
- [ ] Returns success
- [ ] Bot status changes to running

### Stop Bot
```bash
curl -X POST http://localhost:3001/api/stop-bot
```
**Expected**:
- [ ] Returns success
- [ ] Bot status changes to stopped

### Get Memories
```bash
curl "http://localhost:3001/api/memories?limit=10"
```
**Expected**:
- [ ] Returns array (may be empty initially)
- [ ] Each memory has correct structure

### Get Trading Stats
```bash
curl http://localhost:3001/api/trading-stats
```
**Expected**:
- [ ] Returns stats object
- [ ] totalTrades, winRate, totalPL present

---

## 🌐 Frontend Testing

### Navigation & UI Load
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Open http://localhost:3000 | Dashboard loads | ⬜ |
| 2 | Click "Dashboard" tab | Dashboard view shows | ⬜ |
| 3 | Click "Stats" tab | Stats view shows | ⬜ |
| 4 | Click "Memories" tab | Memories view shows | ⬜ |
| 5 | Click "Discover" tab | Discovery view shows | ⬜ |
| 6 | Click "Staking" tab | Staking view shows | ⬜ |

### Wallet Connection
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Click "Connect Wallet" button | RainbowKit modal opens | ⬜ |
| 2 | Select MetaMask | MetaMask popup appears | ⬜ |
| 3 | Approve connection | Modal closes | ⬜ |
| 4 | Check header | Wallet address displays (0x123...456) | ⬜ |
| 5 | Check network | Shows "opBNB Testnet" or chain ID 5611 | ⬜ |
| 6 | Switch network to mainnet | Wallet prompts network change | ⬜ |
| 7 | Switch back to testnet | Successfully switches | ⬜ |
| 8 | Click wallet dropdown | Shows disconnect option | ⬜ |
| 9 | Click disconnect | Wallet address disappears | ⬜ |

### Dashboard - Bot Control
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Open Dashboard tab | Bot status shows "Stopped" | ⬜ |
| 2 | Check backend indicator | Green if backend running | ⬜ |
| 3 | Add token address | Input accepts address | ⬜ |
| 4 | Try invalid address | Shows validation error | ⬜ |
| 5 | Remove token | Token removed from list | ⬜ |
| 6 | Set risk level to 8 | Slider moves, shows "Aggressive" | ⬜ |
| 7 | Set risk level to 3 | Shows "Conservative" | ⬜ |
| 8 | Leave tokens empty | Auto-discovery note shown | ⬜ |
| 9 | Click "Start Trading Bot" | Button shows loading state | ⬜ |
| 10 | Wait for API response | Success message OR error shown | ⬜ |
| 11 | Check bot status | Shows "Running" with green dot | ⬜ |
| 12 | Check backend logs | See "Bot started via API" | ⬜ |
| 13 | Wait 1-2 minutes | Trading cycle starts (check logs) | ⬜ |
| 14 | Click "Stop Bot" | Bot stops, status updates | ⬜ |

### Stats Tab
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Open Stats tab | Stats cards display | ⬜ |
| 2 | Check data | Shows real data OR "No trading data" | ⬜ |
| 3 | Wait 30 seconds | Data auto-refreshes | ⬜ |
| 4 | Stop backend | Shows error message | ⬜ |
| 5 | Restart backend | Data loads again | ⬜ |

### Memories Tab
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Open Memories tab | Memories list OR "No memories yet" | ⬜ |
| 2 | Click "All" filter | Shows all memories | ⬜ |
| 3 | Click "Profit" filter | Shows only profitable trades | ⬜ |
| 4 | Click "Loss" filter | Shows only losses | ⬜ |
| 5 | Click "Pending" filter | Shows pending trades | ⬜ |
| 6 | Click "Refresh" | Data reloads | ⬜ |
| 7 | Check memory details | Shows AI reasoning, market conditions | ⬜ |

### Token Discovery Tab
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Open Discover tab | Trending tokens load | ⬜ |
| 2 | Check token cards | Show symbol, price, volume, liquidity | ⬜ |
| 3 | Click "Copy" on address | Address copied to clipboard | ⬜ |
| 4 | Check "Copied" feedback | Button shows "✓ Copied" | ⬜ |
| 5 | Click "View on DexScreener" | Opens new tab with correct token | ⬜ |
| 6 | Click "Trade on PancakeSwap" | Opens new tab with swap UI | ⬜ |
| 7 | Click "Refresh" | New tokens load | ⬜ |

### Staking Tab
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Open Staking tab | Staking UI loads | ⬜ |
| 2 | Check warning (if no contracts) | Shows "Contracts Not Deployed" | ⬜ |
| 3 | Check balance | Shows 0.00 or actual balance | ⬜ |
| 4 | Select "30 Days" tier | Tier highlighted | ⬜ |
| 5 | Select "365 Days" tier | Shows 50% APY | ⬜ |
| 6 | Enter stake amount: 1000 | Input accepts | ⬜ |
| 7 | Click 50% button | Auto-fills 50% of balance | ⬜ |
| 8 | Check estimated rewards | Shows daily and yearly estimates | ⬜ |
| 9 | Try amount < 1000 | Shows minimum error | ⬜ |
| 10 | Click "Stake" (if contracts deployed) | MetaMask approval popup | ⬜ |

---

## 🔒 Security Testing

### Rate Limiting
```bash
# Test rate limiting
for i in {1..150}; do
  curl -s http://localhost:3001/health > /dev/null
  echo "Request $i"
done
```
- [ ] After ~300 requests, get 429 Too Many Requests

### Input Validation
```bash
# Invalid token address
curl -X POST http://localhost:3001/api/start-bot \
  -H "Content-Type: application/json" \
  -d '{"tokens":["invalid"],"risk":5}'
```
- [ ] Returns 400 Bad Request with validation error

```bash
# Invalid risk level
curl -X POST http://localhost:3001/api/start-bot \
  -H "Content-Type: application/json" \
  -d '{"tokens":[],"risk":15}'
```
- [ ] Returns 400 Bad Request

```bash
# XSS attempt
curl -X POST http://localhost:3001/api/start-bot \
  -H "Content-Type: application/json" \
  -d '{"tokens":["<script>alert(1)</script>"],"risk":5}'
```
- [ ] Sanitized/rejected

### CORS
```bash
# From unauthorized origin
curl -X POST http://localhost:3001/api/start-bot \
  -H "Origin: https://evil.com" \
  -H "Content-Type: application/json" \
  -d '{"tokens":[],"risk":5}'
```
- [ ] Blocked by CORS policy

---

## 🎯 End-to-End Bot Trading Test

### Setup
1. Ensure wallet has >0.1 tBNB
2. Start backend and frontend
3. Connect wallet
4. Open Dashboard tab

### Execute Trade Cycle
| Step | Action | Expected | Status |
|------|--------|----------|--------|
| 1 | Leave watchlist empty | Auto-discovery enabled | ⬜ |
| 2 | Set risk to 5 | Moderate risk | ⬜ |
| 3 | Click "Start Bot" | Bot starts | ⬜ |
| 4 | Watch backend logs | Token discovery begins | ⬜ |
| 5 | Wait 2-5 minutes | AI analyzes token | ⬜ |
| 6 | Check for trade decision | AI outputs reasoning | ⬜ |
| 7 | If trade executed | Telegram alert sent (if configured) | ⬜ |
| 8 | Check Memories tab | New memory appears | ⬜ |
| 9 | Check Stats tab | Stats updated | ⬜ |
| 10 | Stop bot | Bot stops cleanly | ⬜ |

---

## 📊 Performance Testing

### Backend Response Times
```bash
# Health check latency
time curl http://localhost:3001/health
```
- [ ] < 100ms

```bash
# Bot status
time curl http://localhost:3001/api/bot-status
```
- [ ] < 200ms

```bash
# Discover tokens (external API call)
time curl http://localhost:3001/api/discover-tokens
```
- [ ] < 3 seconds

### Frontend Load Times
- [ ] Initial page load: < 2 seconds
- [ ] Tab switching: < 100ms
- [ ] Data polling: < 500ms per update

---

## 🐛 Error Handling Testing

### Backend Down
| Step | Action | Expected | Status |
|------|--------|----------|--------|
| 1 | Stop backend | Frontend shows warning | ⬜ |
| 2 | Try to start bot | Error message displayed | ⬜ |
| 3 | Check stats tab | Shows error state | ⬜ |
| 4 | Restart backend | Automatically reconnects | ⬜ |

### Network Errors
| Step | Action | Expected | Status |
|------|--------|----------|--------|
| 1 | Disconnect internet | Graceful error messages | ⬜ |
| 2 | Reconnect | Data loads again | ⬜ |

### Invalid API Responses
- [ ] Missing data handles gracefully
- [ ] Malformed JSON doesn't crash app
- [ ] Timeout errors show user-friendly message

---

## ✅ Sign-Off Checklist

Before deploying to production, confirm all tests pass:

### Backend
- [ ] All API endpoints working
- [ ] Rate limiting functional
- [ ] Input validation working
- [ ] Error handling comprehensive
- [ ] Logging working correctly

### Frontend
- [ ] All pages/tabs load
- [ ] Wallet connection working
- [ ] Bot control working
- [ ] Data displays correctly
- [ ] Error states handled

### Security
- [ ] Private keys not exposed
- [ ] CORS configured
- [ ] Rate limiting active
- [ ] Input sanitization working
- [ ] HTTPS enforced (production)

### Integration
- [ ] End-to-end trade cycle works
- [ ] Telegram alerts sent (if configured)
- [ ] Greenfield memory storage works
- [ ] DexScreener integration works
- [ ] AI decision-making functional

---

## 📝 Bug Report Template

When you find a bug, document it:

```markdown
## Bug: [Short Description]

**Severity**: Critical / High / Medium / Low

**Steps to Reproduce**:
1.
2.
3.

**Expected Behavior**:

**Actual Behavior**:

**Screenshots** (if applicable):

**Environment**:
- OS:
- Browser:
- Node version:
- Network: Testnet / Mainnet

**Logs**:
```
[Paste relevant logs from logs/error.log]
```

---

**Last Updated**: 2025-11-08
**Version**: 1.0.0
