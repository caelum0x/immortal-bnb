# Production Deployment Guide

Complete guide for deploying the Immortal AI Trading Bot to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Security Configuration](#security-configuration)
4. [Deployment Process](#deployment-process)
5. [Monitoring & Alerts](#monitoring--alerts)
6. [Backup & Recovery](#backup--recovery)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)

---

## Prerequisites

### System Requirements

- **OS**: Linux (Ubuntu 20.04+ recommended) or macOS
- **Node.js**: v18.0.0 or higher
- **Python**: 3.9 or higher
- **Docker**: 20.10+ with Docker Compose
- **Memory**: Minimum 4GB RAM (8GB+ recommended)
- **Storage**: Minimum 20GB free space
- **Network**: Stable internet connection with open ports 3000, 3001, 5000

### Required Accounts & Keys

- [ ] BNB Chain wallet with private key
- [ ] BNB Greenfield account and bucket
- [ ] OpenAI API key (for GPT-4)
- [ ] OpenRouter API key (optional, for alternative LLMs)
- [ ] Polymarket account (for prediction markets)
- [ ] GitHub account (for CI/CD)

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-username/immortal-bnb.git
cd immortal-bnb
git submodule update --init --recursive
```

### 2. Configure Environment

Run the interactive setup script:

```bash
./scripts/setup-env.sh
```

Or manually create `.env`:

```bash
cp .env.example .env
nano .env
```

### 3. Critical Environment Variables

**Blockchain Configuration:**
```env
IS_MAINNET=true                # Set to true for production
TRADING_NETWORK=mainnet
CHAIN_ID=56                    # BSC Mainnet
PRIVATE_KEY=0x...             # Your wallet private key
WALLET_ADDRESS=0x...          # Your wallet address
```

**Greenfield Storage:**
```env
GREENFIELD_RPC_URL=https://gnfd-mainnet-fullnode-tendermint-us.bnbchain.org
GREENFIELD_CHAIN_ID=1017
GREENFIELD_BUCKET_NAME=immortal-trading-bot-prod
```

**API Keys:**
```env
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-...
POLYMARKET_PRIVATE_KEY=0x...
POLYMARKET_PROXY_ADDRESS=0x...
```

**Security:**
```env
JWT_SECRET=<generate-strong-random-secret>
JWT_EXPIRES_IN=24h
```

**Generate secure JWT secret:**
```bash
openssl rand -base64 32
```

### 4. Install Dependencies

```bash
# Backend (TypeScript)
npm ci

# Python API
cd agents
pip install -r requirements.txt
cd ..

# Frontend
cd frontend
npm ci
cd ..
```

---

## Security Configuration

### 1. API Rate Limiting

Rate limits are configured in `/src/middleware/rateLimiting.ts`:

- **General API**: 100 requests/15min
- **Trading**: 10 requests/minute
- **Auth**: 5 requests/15min
- **Read**: 200 requests/15min

### 2. Authentication

All protected endpoints require JWT authentication:

```bash
# Get token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0x..."}'

# Use token
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/protected-endpoint
```

### 3. Firewall Configuration

**Required ports:**
- 3000: Frontend (can be behind reverse proxy)
- 3001: Backend API (can be behind reverse proxy)
- 5000: Python API (internal only)

**Using UFW (Ubuntu):**
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 4. HTTPS/SSL Setup

**Using Nginx + Let's Encrypt:**

```bash
sudo apt install nginx certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Nginx config
sudo nano /etc/nginx/sites-available/immortal-bot
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/immortal-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Deployment Process

### Option 1: Docker Deployment (Recommended)

**1. Build and start services:**
```bash
./scripts/deploy.sh production
```

**2. Verify services:**
```bash
docker-compose ps
docker-compose logs -f
```

**3. Health checks:**
```bash
curl http://localhost:3001/api/health
curl http://localhost:5000/health
```

### Option 2: Manual Deployment

**1. Build applications:**
```bash
npm run build:all
```

**2. Start services:**
```bash
# Backend
npm run backend &

# Python API
cd agents && python api/server.py &

# Frontend
npm run frontend &
```

### Option 3: CI/CD with GitHub Actions

The GitHub Actions workflow (`.github/workflows/ci.yml`) automatically:
- ✅ Runs tests on push/PR
- ✅ Builds Docker images
- ✅ Deploys to production (on main branch)

**Enable GitHub Actions:**
1. Add secrets in GitHub repo settings:
   - `DOCKER_USERNAME`
   - `DOCKER_PASSWORD`
   - `PRODUCTION_SSH_KEY`
   - `PRODUCTION_HOST`

2. Push to main branch triggers deployment

---

## Monitoring & Alerts

### 1. Prometheus Metrics

Metrics are exposed at `http://localhost:3001/metrics`

**Key metrics:**
- `http_requests_total` - Total HTTP requests
- `trades_total` - Total trades executed
- `ai_decisions_total` - AI decisions made
- `wallet_balance` - Current wallet balance
- `memory_sync_pending` - Pending memory uploads

### 2. Grafana Dashboard

**Install Grafana:**
```bash
docker run -d -p 3000:3000 \
  -v grafana-storage:/var/lib/grafana \
  grafana/grafana
```

**Add Prometheus data source:**
1. Open http://localhost:3000 (admin/admin)
2. Add Prometheus: http://localhost:9090

**Import dashboard:**
- Use the pre-built dashboard JSON from `/monitoring/grafana-dashboard.json`

### 3. Alert Configuration

Alerts are configured in `/monitoring/alerts.yml`:

- High error rate (>5%)
- High response time (>5s)
- Low wallet balance (<0.1 BNB)
- High trade failure rate (>30%)
- Python API down

### 4. Log Management

**View logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

**Log rotation (using logrotate):**
```bash
sudo nano /etc/logrotate.d/immortal-bot
```

```
/path/to/immortal-bnb/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 root root
}
```

---

## Backup & Recovery

### 1. Automated Backups

**Run backup script:**
```bash
./scripts/backup.sh
```

**Schedule automatic backups (cron):**
```bash
crontab -e

# Add line for daily 2 AM backups
0 2 * * * /path/to/immortal-bnb/scripts/backup.sh
```

### 2. What Gets Backed Up

- ✅ Environment configuration (.env)
- ✅ Docker configuration (docker-compose.yml)
- ✅ Database files
- ✅ Log files
- ✅ Memory data
- ✅ Docker container state

### 3. Restore from Backup

```bash
# List available backups
ls -lht ./backups/*.tar.gz | head -5

# Restore specific backup
./scripts/rollback.sh ./backups/immortal-bot-backup-20250112_020000.tar.gz
```

### 4. Greenfield Data Recovery

All trade memories are permanently stored on BNB Greenfield and can be recovered:

```bash
# Query all memories
curl -X POST http://localhost:3001/api/memory/query \
  -H "Content-Type: application/json" \
  -d '{}'

# Force sync from Greenfield
curl -X POST http://localhost:3001/api/memory/force-sync
```

---

## Troubleshooting

### Common Issues

**1. Services won't start:**
```bash
# Check logs
docker-compose logs

# Restart services
docker-compose restart

# Full reset
docker-compose down
docker-compose up -d
```

**2. Python API connection failed:**
```bash
# Check Python API health
curl http://localhost:5000/health

# Restart Python API
docker-compose restart python-api

# Check logs
docker-compose logs python-api
```

**3. Frontend not loading:**
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
npm run build:frontend
docker-compose up -d --build frontend
```

**4. Trade execution failures:**
```bash
# Check wallet balance
curl http://localhost:3001/api/wallet/balance

# Check gas prices
# May need to increase GAS_PRICE_MULTIPLIER in .env

# View failed trades
curl http://localhost:3001/api/stats
```

**5. Memory sync issues:**
```bash
# Check sync status
curl http://localhost:3001/api/memory/sync-status

# Force sync
curl -X POST http://localhost:3001/api/memory/force-sync

# Check Greenfield connection
# Verify GREENFIELD_RPC_URL in .env
```

### Debug Mode

Enable verbose logging:
```env
LOG_LEVEL=debug
```

Restart services:
```bash
docker-compose restart
```

---

## Maintenance

### Regular Tasks

**Daily:**
- [ ] Check system health (`curl /api/health`)
- [ ] Review error logs
- [ ] Monitor wallet balance

**Weekly:**
- [ ] Review trade performance (`curl /api/stats`)
- [ ] Check memory sync status
- [ ] Review Prometheus alerts
- [ ] Update AI model parameters if needed

**Monthly:**
- [ ] Update dependencies (`npm update`)
- [ ] Review and optimize strategies
- [ ] Clean old logs
- [ ] Test backup restoration
- [ ] Security audit

### Updates & Patches

**1. Update code:**
```bash
git pull origin main
```

**2. Update dependencies:**
```bash
npm update
cd agents && pip install -U -r requirements.txt
cd frontend && npm update
```

**3. Run tests:**
```bash
npm test
```

**4. Deploy update:**
```bash
./scripts/deploy.sh production
```

### Performance Optimization

**1. Monitor metrics:**
```bash
curl http://localhost:3001/metrics
```

**2. Database optimization:**
```bash
# If using SQLite
sqlite3 ./data/bot.db "VACUUM;"
```

**3. Docker cleanup:**
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune
```

### Security Audits

**Monthly security checklist:**
- [ ] Review API access logs
- [ ] Check for unauthorized access attempts
- [ ] Update all dependencies (npm audit)
- [ ] Review wallet permissions
- [ ] Rotate JWT secrets
- [ ] Review firewall rules

**Run security audit:**
```bash
# npm audit
npm audit

# Python safety check
cd agents && safety check -r requirements.txt
```

---

## Support & Resources

- **GitHub Issues**: https://github.com/your-username/immortal-bnb/issues
- **Documentation**: See `/docs` directory
- **Phase Completion**: See `PHASE_*_COMPLETE.md` files
- **CI/CD Pipeline**: `.github/workflows/ci.yml`

---

**Last Updated**: 2025-01-12  
**Version**: 1.0 (Phase 7 Complete)
