# Deployment Guide - Immortal AI Trading Bot

This guide covers the complete production deployment process for the Immortal AI Trading Bot.

## Prerequisites

- [ ] All environment variables configured in `.env`
- [ ] WALLET_PRIVATE_KEY with sufficient BNB for gas
- [ ] OPENROUTER_API_KEY with credits
- [ ] Node.js 18+ or Bun installed on production server
- [ ] Domain name (optional but recommended)
- [ ] SSL certificate for HTTPS (Let's Encrypt recommended)

## Pre-Deployment Validation

Run the deployment validation script:

```bash
npx ts-node scripts/validate-deployment.ts
```

This will check:
- ✅ All required environment variables
- ✅ Critical dependencies installed
- ✅ Security middleware configured
- ✅ Network configuration
- ✅ Deployment readiness

## Phase 1: Smart Contract Deployment

### 1.1 Deploy IMMBOT Token (Testnet First)

```bash
# Navigate to contracts directory
cd contracts

# Install dependencies
npm install

# Deploy to BSC Testnet
npx hardhat run scripts/deploy-token.ts --network bscTestnet

# Save the deployed contract address
# Add to .env: IMMBOT_TOKEN_ADDRESS=0x...
```

### 1.2 Deploy Staking Contract

```bash
# Deploy staking contract (requires IMMBOT token address)
npx hardhat run scripts/deploy-staking.ts --network bscTestnet

# Save the deployed contract address
# Add to .env: STAKING_CONTRACT_ADDRESS=0x...
```

### 1.3 Verify Contracts on BscScan

```bash
# Verify token contract
npx hardhat verify --network bscTestnet <TOKEN_ADDRESS>

# Verify staking contract
npx hardhat verify --network bscTestnet <STAKING_ADDRESS> <TOKEN_ADDRESS>
```

### 1.4 Update Frontend Environment

Update `apps/frontend/.env`:

```bash
NEXT_PUBLIC_IMMBOT_TOKEN_TESTNET=0x...  # From step 1.1
NEXT_PUBLIC_STAKING_TESTNET=0x...       # From step 1.2
```

## Phase 2: Backend Deployment

### Option A: VPS Deployment (Recommended)

#### 2.1 Server Setup

```bash
# Connect to your VPS
ssh user@your-server.com

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or install Bun (faster)
curl -fsSL https://bun.sh/install | bash

# Install PM2 for process management
npm install -g pm2
```

#### 2.2 Clone and Setup

```bash
# Clone repository
git clone https://github.com/your-username/immortal-bnb.git
cd immortal-bnb

# Install dependencies
npm install  # or: bun install

# Copy environment file
cp .env.example .env

# Edit .env with production values
nano .env
```

**Critical production .env settings:**

```bash
# Network
NETWORK=mainnet  # Use mainnet for production
NODE_ENV=production

# API
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com

# Security
API_KEY=<generate-with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">

# Blockchain
WALLET_PRIVATE_KEY=0x...  # Your actual private key
RPC_URL=https://bsc-dataseed.binance.org/  # Mainnet RPC

# AI
OPENROUTER_API_KEY=sk-or-v1-...  # Your actual API key

# Storage (optional)
GREENFIELD_BUCKET_NAME=immortal-bot-prod
GREENFIELD_ACCESS_KEY=...
GREENFIELD_SECRET_KEY=...

# Alerts (optional)
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

#### 2.3 Build and Start

```bash
# Build TypeScript (if using tsc)
npm run build

# Start with PM2
pm2 start src/index.ts --name immortal-bot --interpreter bun
# Or with Node.js:
pm2 start dist/index.js --name immortal-bot

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### 2.4 Setup Nginx Reverse Proxy (Optional)

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/immortal-bot
```

Add configuration:

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:

```bash
sudo ln -s /etc/nginx/sites-available/immortal-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.your-domain.com
```

### Option B: Docker Deployment

#### 2.1 Create Dockerfile

```dockerfile
FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Expose port
EXPOSE 3001

# Start application
CMD ["bun", "run", "src/index.ts"]
```

#### 2.2 Build and Run

```bash
# Build image
docker build -t immortal-bot .

# Run container
docker run -d \
  --name immortal-bot \
  --env-file .env \
  -p 3001:3001 \
  --restart unless-stopped \
  immortal-bot

# View logs
docker logs -f immortal-bot
```

#### 2.3 Docker Compose (Alternative)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  bot:
    build: .
    container_name: immortal-bot
    env_file: .env
    ports:
      - "3001:3001"
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
```

Run:

```bash
docker-compose up -d
```

## Phase 3: Frontend Deployment (Vercel)

### 3.1 Prepare Frontend

```bash
cd apps/frontend

# Update production environment
nano .env.production
```

Set production variables:

```bash
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_USE_MAINNET=true
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_IMMBOT_TOKEN_MAINNET=0x...
NEXT_PUBLIC_STAKING_MAINNET=0x...
```

### 3.2 Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Follow prompts to:
# 1. Link to Vercel project
# 2. Configure build settings
# 3. Set environment variables
```

Or use Vercel GitHub integration:
1. Push code to GitHub
2. Import project in Vercel dashboard
3. Configure environment variables in Vercel UI
4. Deploy automatically on push

### 3.3 Configure Custom Domain (Optional)

In Vercel dashboard:
1. Go to project settings > Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Wait for SSL certificate provisioning

## Phase 4: Post-Deployment Testing

### 4.1 Health Check

```bash
# Check backend health
curl https://api.your-domain.com/health

# Expected response:
# {"status":"ok","timestamp":1234567890,"botRunning":false}
```

### 4.2 Manual Testing Checklist

Follow the comprehensive testing guide in `TESTING.md`:

- [ ] Backend API endpoints responding
- [ ] Rate limiting working
- [ ] Input validation working
- [ ] Frontend loads correctly
- [ ] Wallet connection works
- [ ] Bot can be started/stopped
- [ ] Trade logs displayed
- [ ] Real-time updates working
- [ ] Memory storage functional
- [ ] Token discovery working

### 4.3 Test Trade (Small Amount)

1. Start bot with minimal trade amount (0.01 BNB)
2. Select 1-2 stable tokens
3. Set risk to lowest (1)
4. Monitor for 30 minutes
5. Check logs for any errors
6. Verify memory storage

## Phase 5: Monitoring and Maintenance

### 5.1 Setup Monitoring

#### Option A: PM2 Monitoring

```bash
# Install PM2 Plus (optional)
pm2 link <secret> <public>

# Monitor in browser
# https://app.pm2.io/
```

#### Option B: Sentry Error Tracking

```bash
# Install Sentry
npm install @sentry/node

# Initialize in src/index.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

#### Option C: UptimeRobot

1. Sign up at https://uptimerobot.com
2. Add HTTP(s) monitor for your API endpoint
3. Set up email/SMS alerts
4. Monitor every 5 minutes

### 5.2 Log Management

```bash
# View PM2 logs
pm2 logs immortal-bot

# View Docker logs
docker logs -f immortal-bot

# Setup log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 5.3 Backup Strategy

**Critical data to backup:**
- Wallet private key (encrypted, offline storage)
- Trade memories (if using local storage)
- Configuration files (.env)
- Log files (for analysis)

```bash
# Example backup script
#!/bin/bash
BACKUP_DIR="/backup/immortal-bot/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Backup logs
cp -r /app/logs $BACKUP_DIR/

# Backup configuration (without secrets)
cp .env.example $BACKUP_DIR/

# Compress
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR
```

### 5.4 Update Procedure

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Run tests
npm test

# Restart bot
pm2 restart immortal-bot

# Monitor logs for errors
pm2 logs immortal-bot --lines 100
```

## Phase 6: Security Hardening

### 6.1 Server Security

```bash
# Setup firewall
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable

# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd

# Setup fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
```

### 6.2 Application Security

- [ ] Enable API key authentication in production
- [ ] Restrict CORS to your frontend domain only
- [ ] Use HTTPS for all communications
- [ ] Rotate API keys regularly
- [ ] Monitor rate limit violations
- [ ] Review logs for suspicious activity
- [ ] Keep dependencies updated

### 6.3 Wallet Security

- [ ] Use hardware wallet for large funds
- [ ] Keep trading wallet funded with minimal amounts
- [ ] Transfer profits to cold storage regularly
- [ ] Never commit private keys to git
- [ ] Use encrypted .env files
- [ ] Limit wallet permissions on contracts

## Troubleshooting

### Backend won't start

```bash
# Check logs
pm2 logs immortal-bot

# Common issues:
# 1. Missing environment variables → Check .env
# 2. Port already in use → Change PORT in .env
# 3. Permission denied → Check file permissions
# 4. Module not found → Run npm install
```

### Frontend can't connect to backend

```bash
# Check CORS settings in src/api-server.ts
# Ensure FRONTEND_URL matches your frontend domain

# Test backend directly
curl https://api.your-domain.com/health

# Check browser console for errors
# Verify NEXT_PUBLIC_API_URL in frontend .env
```

### Trades not executing

```bash
# Check wallet balance
# Verify RPC_URL is correct
# Check slippage settings
# Review bot logs for errors
# Ensure OPENROUTER_API_KEY has credits
```

### Memory storage failing

```bash
# Check Greenfield credentials
# Verify bucket exists and is accessible
# Review permissions on bucket
# Check network connectivity to Greenfield
```

## Performance Optimization

### Backend Optimization

```bash
# Increase Node.js memory limit
pm2 start dist/index.js --name immortal-bot --node-args="--max-old-space-size=2048"

# Use cluster mode for load balancing
pm2 start dist/index.js --name immortal-bot -i max
```

### Database Optimization (Future)

If implementing PostgreSQL for trade history:

```bash
# Create indexes on frequently queried fields
CREATE INDEX idx_trades_timestamp ON trades(timestamp);
CREATE INDEX idx_trades_token ON trades(token_address);

# Regular vacuum
VACUUM ANALYZE trades;
```

## Cost Estimation

**Monthly costs (approximate):**

- VPS (2GB RAM, 2 CPU): $10-20/month
- Domain name: $10-15/year
- Vercel (Hobby plan): Free
- OpenRouter API: $5-50/month (depending on usage)
- BNB for gas fees: Variable (0.1-1 BNB/month)
- Greenfield storage: $0-5/month
- Monitoring (UptimeRobot): Free
- Total: ~$30-100/month

## Support and Resources

- Documentation: See README.md and QUICKSTART.md
- Testing: See TESTING.md
- Issues: GitHub Issues
- Community: Discord/Telegram (if applicable)

## Next Steps After Deployment

1. **Monitor Performance**
   - Track win rate and profit/loss
   - Analyze trade patterns
   - Optimize parameters

2. **Scale Gradually**
   - Start with small trade amounts
   - Add more tokens carefully
   - Increase risk level slowly

3. **Continuous Improvement**
   - Review AI decision quality
   - Update market analysis logic
   - Add new features based on feedback

4. **Community Building**
   - Share results (without sensitive data)
   - Gather user feedback
   - Build documentation

---

**🎉 Congratulations on deploying Immortal AI Trading Bot!**

Remember: Start small, test thoroughly, and scale gradually. Never invest more than you can afford to lose.
