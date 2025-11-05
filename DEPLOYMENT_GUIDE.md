# 🚀 Production Deployment Guide

Complete guide for deploying the Immortal AI Trading Bot to production.

## ⚠️ Pre-Production Checklist

Before deploying to production, ensure you have:

- [ ] Tested thoroughly on testnet
- [ ] Verified all API keys are valid
- [ ] Configured proper risk management parameters
- [ ] Set up monitoring and alerts
- [ ] Have backup private keys secured
- [ ] Understand the financial risks involved
- [ ] Have sufficient BNB for gas fees
- [ ] Configured Greenfield storage properly
- [ ] Set appropriate trade limits

## 🔐 Security Best Practices

### 1. **Private Key Management**

```bash
# NEVER commit .env to git
echo ".env" >> .gitignore

# Use environment variables in production
export WALLET_PRIVATE_KEY="your_key_here"

# Consider using a secrets manager:
# - AWS Secrets Manager
# - HashiCorp Vault
# - Google Cloud Secret Manager
```

### 2. **API Key Security**

```bash
# Rotate keys regularly
# Use separate keys for dev/prod
# Limit key permissions where possible

# OpenRouter API Key
export OPENROUTER_API_KEY="sk-or-..."

# Telegram Bot Token
export TELEGRAM_BOT_TOKEN="..."
```

### 3. **Network Security**

```bash
# Use a VPN or private network
# Whitelist IP addresses where possible
# Enable firewall rules
# Use HTTPS for all communications
```

## 🌐 Deployment Options

### Option 1: Local Server / VPS

**Pros**: Full control, low cost
**Cons**: Requires maintenance, single point of failure

```bash
# 1. Set up a Ubuntu 20.04+ server
# 2. Install Bun
curl -fsSL https://bun.sh/install | bash

# 3. Clone repository
git clone https://github.com/caelum0x/immortal-bnb.git
cd immortal-bnb

# 4. Install dependencies
bun install

# 5. Configure environment
cp .env.example .env
nano .env  # Edit with your production values

# 6. Set to mainnet
NETWORK=mainnet
TRADING_NETWORK=opbnb

# 7. Run tests
bun test:integration

# 8. Start with PM2 (production process manager)
bun add -g pm2
pm2 start start-bot.ts --name immortal-bot
pm2 save
pm2 startup  # Enable auto-start on boot

# 9. Monitor
pm2 logs immortal-bot
pm2 monit
```

### Option 2: Docker Container

**Pros**: Consistent environment, easy scaling
**Cons**: Slightly more complex setup

```bash
# 1. Build Docker image
docker build -t immortal-bot:latest .

# 2. Run container
docker run -d \
  --name immortal-bot \
  --env-file .env \
  --restart unless-stopped \
  -p 3001:3001 \
  -v $(pwd)/logs:/app/logs \
  immortal-bot:latest

# 3. View logs
docker logs -f immortal-bot

# 4. Stop/start
docker stop immortal-bot
docker start immortal-bot

# 5. Update and redeploy
git pull
docker build -t immortal-bot:latest .
docker stop immortal-bot
docker rm immortal-bot
# Run step 2 again
```

### Option 3: Docker Compose (Bot + Frontend)

**Pros**: Full stack deployment, easy management
**Cons**: More resources needed

```bash
# 1. Configure environment
cp .env.example .env
nano .env

# 2. Start all services
docker-compose up -d

# 3. View logs
docker-compose logs -f

# 4. Scale if needed
docker-compose up -d --scale bot=2

# 5. Stop all
docker-compose down
```

### Option 4: Cloud Deployment (AWS/GCP/Azure)

**Pros**: Highly available, scalable
**Cons**: Higher cost, more complex

#### AWS EC2:
```bash
# 1. Launch EC2 instance (t3.small or larger)
# 2. Install Bun and dependencies
# 3. Use AWS Secrets Manager for keys
# 4. Set up CloudWatch for monitoring
# 5. Use Auto Scaling for high availability
```

#### AWS ECS/Fargate:
```bash
# 1. Build and push Docker image to ECR
# 2. Create ECS task definition
# 3. Create ECS service
# 4. Use AWS Secrets Manager
# 5. Set up CloudWatch alarms
```

## 📊 Monitoring & Logging

### 1. **Application Logs**

```bash
# View logs
tail -f logs/app.log

# With PM2
pm2 logs immortal-bot

# With Docker
docker logs -f immortal-bot

# With Docker Compose
docker-compose logs -f bot
```

### 2. **Health Monitoring**

```bash
# Use the CLI tool
bun cli.ts status
bun cli.ts balance
bun cli.ts stats

# Set up automated health checks
# Add to crontab:
*/5 * * * * curl http://localhost:3001/api/health || echo "Bot down!" | mail -s "Alert" you@email.com
```

### 3. **Telegram Alerts**

```bash
# Configure in .env
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id

# You'll receive alerts for:
# - Bot start/stop
# - Trade executions
# - Errors and failures
# - Balance warnings
```

### 4. **External Monitoring**

Consider using:
- **UptimeRobot**: Ping health endpoint
- **Datadog**: Comprehensive monitoring
- **Sentry**: Error tracking
- **Grafana**: Custom dashboards

## ⚙️ Production Configuration

### Mainnet Configuration (.env)

```bash
# Network
NETWORK=mainnet
TRADING_NETWORK=opbnb  # Use opBNB for 99% gas savings

# RPCs - use paid RPC for reliability
OPBNB_RPC=https://opbnb-mainnet-rpc.bnbchain.org
# Or use private RPC:
# OPBNB_RPC=https://your-private-rpc.com

# Wallet - use a dedicated trading wallet
WALLET_PRIVATE_KEY=your_private_key_here

# Trading Limits - START SMALL!
MAX_TRADE_AMOUNT_BNB=0.1  # Start with 0.1 BNB per trade
STOP_LOSS_PERCENTAGE=5    # 5% stop loss
MAX_SLIPPAGE_PERCENTAGE=2  # 2% max slippage

# Loop Interval - Don't be too aggressive
BOT_LOOP_INTERVAL_MS=300000  # 5 minutes

# Greenfield - Mainnet
GREENFIELD_RPC_URL=https://greenfield-chain.bnbchain.org
GREENFIELD_CHAIN_ID=1017
GREENFIELD_BUCKET_NAME=immortal-bot-mainnet

# AI
OPENROUTER_API_KEY=sk-or-...

# Alerts
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

### Risk Management

```bash
# Conservative Settings (Recommended)
MAX_TRADE_AMOUNT_BNB=0.1
STOP_LOSS_PERCENTAGE=5
MAX_SLIPPAGE_PERCENTAGE=2
BOT_LOOP_INTERVAL_MS=600000  # 10 minutes

# Moderate Settings
MAX_TRADE_AMOUNT_BNB=0.5
STOP_LOSS_PERCENTAGE=7
MAX_SLIPPAGE_PERCENTAGE=3
BOT_LOOP_INTERVAL_MS=300000  # 5 minutes

# Aggressive Settings (High Risk!)
MAX_TRADE_AMOUNT_BNB=1.0
STOP_LOSS_PERCENTAGE=10
MAX_SLIPPAGE_PERCENTAGE=5
BOT_LOOP_INTERVAL_MS=180000  # 3 minutes
```

## 🔄 Continuous Deployment

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy Bot

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run tests
        run: bun test

      - name: Deploy to production
        env:
          SSH_KEY: ${{ secrets.SSH_KEY }}
          SERVER: ${{ secrets.SERVER }}
        run: |
          # SSH to server and redeploy
          ssh -i $SSH_KEY user@$SERVER 'cd /app && git pull && pm2 restart immortal-bot'
```

## 📈 Scaling Considerations

### Horizontal Scaling

```bash
# Run multiple instances with different strategies
# Instance 1: Conservative, small trades
# Instance 2: Moderate, medium trades
# Instance 3: High frequency, very small trades

# Use different wallets for each instance
# Configure different loop intervals
# Use different Greenfield buckets
```

### Database/Storage

```bash
# Greenfield automatically scales
# But consider:
# - Bucket quotas
# - Storage costs
# - Access patterns

# Monitor Greenfield usage:
bun cli.ts memory
```

## 🛡️ Backup & Recovery

### 1. **Backup Private Keys**

```bash
# Encrypt and store securely
# Use hardware wallet for large amounts
# Have recovery phrases in multiple secure locations
```

### 2. **Backup Configuration**

```bash
# Version control (without secrets)
git commit -m "Update configuration"
git push

# Backup .env separately (encrypted)
gpg -c .env
# Store .env.gpg in secure location
```

### 3. **Backup Greenfield Data**

```bash
# Export all memories
bun cli.ts memory 1000 > memories-backup-$(date +%Y%m%d).json

# Automate with cron
0 0 * * * cd /app && bun cli.ts memory 1000 > /backups/memories-$(date +%Y%m%d).json
```

## 🚨 Incident Response

### Bot Stopped Unexpectedly

```bash
# 1. Check logs
tail -f logs/app.log

# 2. Check status
bun cli.ts status

# 3. Restart safely
pm2 restart immortal-bot
# or
docker restart immortal-bot

# 4. Verify
bun cli.ts balance
bun cli.ts stats
```

### Unexpected Losses

```bash
# 1. Stop the bot immediately
pm2 stop immortal-bot

# 2. Review recent trades
bun cli.ts trades 50

# 3. Check market conditions
# Look for flash crashes, exploits, rug pulls

# 4. Review AI decisions
# Check if confidence thresholds need adjustment

# 5. Update configuration if needed
nano .env

# 6. Restart with caution
pm2 start immortal-bot
```

### API Key Compromised

```bash
# 1. Immediately revoke the key
# 2. Generate new key
# 3. Update .env
# 4. Restart bot
# 5. Review all trades made during compromise
```

## 💰 Cost Estimation

### Mainnet Costs

```
opBNB (Recommended):
- Gas per trade: ~$0.001
- 100 trades/day: ~$0.10/day = $3/month

BNB Chain:
- Gas per trade: ~$0.10
- 100 trades/day: ~$10/day = $300/month

Greenfield Storage:
- ~1 KB per memory
- 10,000 memories = 10 MB
- Cost: ~$0.01/month (negligible)

OpenRouter API:
- GPT-4o-mini: ~$0.001 per decision
- 100 decisions/day: ~$3/month

Total Monthly Cost (opBNB): ~$6-10
Total Monthly Cost (BNB): ~$300-310
```

### Infrastructure Costs

```
VPS (DigitalOcean, Linode):
- Basic Droplet: $5-10/month
- Medium Droplet: $20-40/month

AWS EC2:
- t3.small: ~$15/month
- t3.medium: ~$30/month

Docker on Cloud Run:
- Pay per use: ~$5-20/month
```

## 📞 Support & Community

- **Issues**: https://github.com/caelum0x/immortal-bnb/issues
- **Discord**: Join BNB Chain Discord
- **Telegram**: BNB Chain Community
- **Docs**: https://docs.bnbchain.org

## ⚖️ Legal & Compliance

```
⚠️ IMPORTANT DISCLAIMERS:

1. This is experimental software - use at your own risk
2. Trading involves significant financial risk
3. Past performance does not guarantee future results
4. Ensure compliance with local regulations
5. You are responsible for your own trading decisions
6. The bot can lose money - only invest what you can afford to lose
7. Tax implications vary by jurisdiction - consult a tax professional
8. Market conditions can change rapidly
9. Smart contract risks apply to all DeFi interactions
10. No warranty is provided - use at your own risk

By deploying this bot, you acknowledge these risks.
```

---

## 🎯 Final Production Deployment Checklist

Before going live:

- [ ] All tests passing (`bun test:integration`)
- [ ] Testnet trading successful
- [ ] Environment variables set correctly
- [ ] Using opBNB for gas savings
- [ ] Conservative trade limits configured
- [ ] Telegram alerts working
- [ ] Health monitoring set up
- [ ] Backups configured
- [ ] Emergency stop procedure documented
- [ ] Team notified of deployment
- [ ] Monitoring dashboard accessible
- [ ] Private keys backed up securely
- [ ] Understand all risks involved

**Start with SMALL amounts and monitor closely!**

Good luck and trade safely! 🚀
