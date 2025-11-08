# 🔒 Security Best Practices & Guidelines

**Immortal AI Trading Bot - Security Documentation**

---

## 🎯 Security Overview

This document outlines security best practices, potential risks, and mitigation strategies for the Immortal AI Trading Bot.

---

## 🔑 Private Key Management

### **CRITICAL: Never Expose Private Keys**

1. **Environment Variables Only**
   ```bash
   # ✅ CORRECT: Use .env file (never committed to git)
   WALLET_PRIVATE_KEY=0x...

   # ❌ WRONG: Hardcoding in source
   const privateKey = "0x123..."; // NEVER DO THIS
   ```

2. **Git Protection**
   ```bash
   # Verify .env is in .gitignore
   cat .gitignore | grep "\.env"

   # Check git history for accidents
   git log --all --full-history --source -- '.env'

   # Remove from git history if leaked (URGENT!)
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Dedicated Trading Wallet** (RECOMMENDED)
   - Create separate wallet just for bot trading
   - Only fund with amount you're willing to risk
   - Never use your main wallet
   - Regularly rotate keys (monthly recommended)

### **Key Rotation Procedure**

```bash
# 1. Create new wallet
# 2. Transfer minimal funds from old to new
# 3. Update .env with new private key
WALLET_PRIVATE_KEY=0x... # new key

# 4. Restart bot
bun run dev

# 5. Verify new wallet is being used
# Check logs for wallet address

# 6. Once confirmed, remove funds from old wallet
```

---

## 🌐 API Key Security

### **OpenRouter API Key**

1. **Usage Limits**
   ```bash
   # Set strict limits on OpenRouter dashboard
   # Recommended for testing:
   - Daily limit: $5
   - Monthly limit: $50
   - Alert threshold: 80%
   ```

2. **Key Rotation**
   - Rotate every 30 days
   - Immediately rotate if:
     - Key is accidentally exposed
     - Unusual activity detected
     - Leaving testnet for mainnet

3. **Monitoring**
   ```bash
   # Check usage daily
   # https://openrouter.ai/activity

   # Set up alerts for:
   - Approaching limits
   - Unusual spike in requests
   - Failed authentication attempts
   ```

### **API Key Authentication (Backend API)**

1. **Generate Secure Key**
   ```bash
   # Use crypto module
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

   # Add to .env
   API_KEY=<generated-key>

   # Add to frontend/.env.local
   NEXT_PUBLIC_API_KEY=<same-key>
   ```

2. **Enable Authentication**
   ```typescript
   // In src/api-server.ts
   import { requireApiKey } from './middleware/auth';

   // Apply to all API routes
   app.use('/api/', requireApiKey);
   ```

3. **Key Rotation**
   ```bash
   # Generate new key
   # Update both .env files
   # Restart backend and frontend
   ```

---

## 🛡️ Rate Limiting

### **Current Configuration**

```typescript
// src/middleware/rateLimiting.ts

// General API: 100 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// Bot Control: 10 requests per 15 minutes
export const botControlLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10
});

// Health checks: 300 requests per 15 minutes
export const healthCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300
});
```

### **Testing Rate Limits**

```bash
# Test API rate limiting
for i in {1..150}; do
  curl -s http://localhost:3001/api/bot-status > /dev/null
  echo "Request $i"
done

# Should see 429 Too Many Requests after ~100
```

### **Adjusting for Production**

```typescript
// For production, consider more strict limits
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Reduced from 100
  message: 'Too many requests from this IP'
});
```

---

## 🔐 Input Validation

### **Token Address Validation**

```typescript
// src/middleware/validation.ts

// Validates Ethereum addresses
body('tokens.*').isEthereumAddress()

// Example valid: 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82
// Example invalid: 0x123, not-an-address, <script>alert('xss')</script>
```

### **Risk Level Validation**

```typescript
// Must be integer 1-10
body('risk').isInt({ min: 1, max: 10 })
```

### **XSS Protection**

```typescript
// src/middleware/validation.ts

// Sanitizes all request inputs
export const sanitizeRequest = (req, res, next) => {
  // Removes <script>, SQL injection attempts, etc.
};
```

---

## 💰 Trading Safeguards

### **Maximum Trade Amount**

```bash
# .env
MAX_TRADE_AMOUNT_BNB=0.1  # Start conservative!

# For mainnet, recommended:
MAX_TRADE_AMOUNT_BNB=0.05  # ~$20 at $400/BNB
```

### **Stop Loss**

```bash
# .env
STOP_LOSS_PERCENTAGE=10  # Exit if down 10%
```

### **Minimum Liquidity Check**

```bash
# .env
MIN_LIQUIDITY_USD=10000  # Only trade tokens with >$10k liquidity

# For mainnet:
MIN_LIQUIDITY_USD=100000  # Higher threshold for safety
```

### **AI Confidence Threshold**

```typescript
// src/index.ts line 137

if (confidence < 0.7) {
  logger.warn('❌ Trade rejected: Confidence too low (<70%)');
  return { success: false, message: 'Confidence too low' };
}

// For mainnet, increase:
if (confidence < 0.85) { // 85% minimum
  return { success: false };
}
```

---

## 🌐 Network Security

### **CORS Configuration**

```typescript
// src/api-server.ts

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// For production:
origin: 'https://your-domain.com', // Exact domain only
```

### **HTTPS in Production**

```bash
# Never run production without HTTPS!

# Using nginx reverse proxy:
server {
  listen 443 ssl;
  server_name your-bot.com;

  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;

  location / {
    proxy_pass http://localhost:3001;
  }
}
```

---

## 📊 Monitoring & Alerts

### **Telegram Alerts**

Enable Telegram to get notified of:
- Bot start/stop
- Trades executed
- Errors/failures
- Low balance warnings

```bash
# .env
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

### **Log Monitoring**

```bash
# Watch for errors in real-time
tail -f logs/error.log

# Check for suspicious activity
grep "401\|403\|429" logs/combined.log

# Monitor trade activity
grep "Trade executed" logs/combined.log
```

### **Sentry Integration** (Optional)

```typescript
// src/index.ts

import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Capture errors
try {
  // ... code
} catch (error) {
  Sentry.captureException(error);
}
```

---

## 🚨 Security Checklist (Pre-Production)

### **Environment**
- [ ] .env files in .gitignore
- [ ] No private keys in git history
- [ ] All keys use strong entropy (32+ bytes)
- [ ] API keys have usage limits set
- [ ] Environment variables validated on startup

### **Code**
- [ ] All user inputs validated
- [ ] XSS protection enabled
- [ ] SQL injection not applicable (no SQL DB)
- [ ] Rate limiting configured
- [ ] CORS properly restricted
- [ ] HTTPS enforced (production)

### **Wallet**
- [ ] Using dedicated trading wallet
- [ ] Wallet only has minimal funds
- [ ] Private key backed up securely (offline)
- [ ] Key rotation procedure documented
- [ ] Multi-sig considered for large amounts

### **Trading**
- [ ] Max trade amount set conservatively
- [ ] Stop loss configured
- [ ] Minimum liquidity threshold set
- [ ] AI confidence threshold >= 70%
- [ ] All trades logged immutably (Greenfield)

### **Monitoring**
- [ ] Telegram alerts configured
- [ ] Error logging to Sentry (optional)
- [ ] Log rotation configured
- [ ] Health check monitoring set up
- [ ] Wallet balance alerts enabled

### **Deployment**
- [ ] Running latest stable versions
- [ ] Dependencies audited (npm audit)
- [ ] Docker container scanned (optional)
- [ ] Firewall configured
- [ ] SSH keys rotated
- [ ] Server hardened (fail2ban, etc.)

---

## ⚠️ Known Risks

### **Smart Contract Risk**
- Contracts are immutable after deployment
- **Mitigation**: Thoroughly audit before mainnet deployment
- Use OpenZeppelin contracts (battle-tested)
- Deploy to testnet first, test extensively

### **AI Decision Risk**
- AI can make bad trades
- **Mitigation**:
  - High confidence threshold (>70%)
  - Conservative max trade amount
  - Stop loss always enabled
  - Human monitoring recommended

### **API Key Exposure**
- If leaked, attacker could drain OpenRouter credits or execute trades
- **Mitigation**:
  - Never commit keys to git
  - Rotate regularly
  - Set strict usage limits
  - Monitor for unusual activity

### **Greenfield Availability**
- If Greenfield is down, bot cannot store memories
- **Mitigation**:
  - Graceful degradation (continue trading)
  - Local backup of critical data
  - Retry logic with exponential backoff

### **DexScreener API Rate Limits**
- Free API may rate limit
- **Mitigation**:
  - Cache responses
  - Use token watchlist instead of auto-discovery
  - Implement exponential backoff

---

## 🆘 Incident Response

### **If Private Key is Compromised**

1. **IMMEDIATELY**: Transfer all funds from compromised wallet to secure wallet
2. Generate new private key
3. Update .env with new key
4. Restart bot
5. Review logs for unauthorized transactions
6. Report to authorities if significant loss

### **If API Key is Exposed**

1. **IMMEDIATELY**: Revoke key on service dashboard
2. Generate new key
3. Update .env
4. Restart services
5. Review usage logs for abuse
6. Set stricter limits on new key

### **If Unauthorized Trades Detected**

1. **IMMEDIATELY**: Stop bot
   ```bash
   # Via frontend
   # Or kill process
   pkill -f "bun.*index.ts"
   ```
2. Review logs for cause
3. Check wallet for unauthorized access
4. Verify API key not compromised
5. Fix vulnerability
6. Restart with enhanced monitoring

---

## 📞 Reporting Vulnerabilities

If you discover a security vulnerability:

1. **DO NOT** open a public GitHub issue
2. **DO NOT** disclose publicly
3. Email: security@your-domain.com (replace with your contact)
4. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if known)

We will respond within 48 hours and work with you to resolve responsibly.

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web3 Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [MetaMask Security Tips](https://metamask.io/security/)
- [OpenZeppelin Security Audits](https://blog.openzeppelin.com/security-audits/)

---

**Last Updated**: 2025-11-08
**Version**: 1.0.0
**Status**: Production Security Guidelines
