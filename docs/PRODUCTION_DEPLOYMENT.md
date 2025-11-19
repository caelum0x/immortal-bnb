# Production Deployment Guide

Complete guide for deploying the Immortal AI Trading Bot to production.

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL database (managed or self-hosted)
- Redis instance (optional but recommended)
- BNB Chain wallet with private key
- OpenRouter API key
- BNB Greenfield account and bucket

## Step 1: Environment Setup

### 1.1 Create Production Environment File

```bash
cp .env.example .env.production
```

### 1.2 Configure Environment Variables

Edit `.env.production`:

```bash
# Network
NODE_ENV=production
NETWORK=mainnet
CHAIN_ID=56
TRADING_NETWORK=bnb

# Database
DATABASE_URL=postgresql://user:password@host:5432/immortal_bot

# Redis (optional)
REDIS_URL=redis://host:6379

# Wallet
WALLET_PRIVATE_KEY=0x...
WALLET_ADDRESS=0x...

# API Keys
OPENROUTER_API_KEY=sk-or-v1-...
GREENFIELD_BUCKET_NAME=immortal-bot-prod

# Security
JWT_SECRET=<generate-secure-random-string>
API_KEY=<generate-secure-random-string>

# Trading Limits
MAX_TRADE_AMOUNT_BNB=0.5
DAILY_TRADE_LIMIT_BNB=5.0
STOP_LOSS_PERCENTAGE=5

# Monitoring
ENABLE_TRACING=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

### 1.3 Generate Secure Secrets

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate API key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 2: Database Setup

### 2.1 Create Database

```bash
createdb immortal_bot
```

### 2.2 Run Migrations

```bash
bunx prisma migrate deploy
```

### 2.3 Verify Schema

```bash
bunx prisma studio
```

## Step 3: Build and Deploy

### 3.1 Build Docker Images

```bash
docker-compose -f docker-compose.prod.yml build
```

### 3.2 Start Services

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 3.3 Verify Deployment

```bash
# Check health
curl http://localhost:3001/health

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Step 4: Post-Deployment Verification

### 4.1 Health Checks

```bash
# Basic health
curl http://localhost:3001/health

# Detailed health
curl http://localhost:3001/api/health

# Readiness probe
curl http://localhost:3001/ready

# Liveness probe
curl http://localhost:3001/live
```

### 4.2 Test API Endpoints

```bash
# Get bot status
curl http://localhost:3001/api/bot-status

# Discover tokens
curl http://localhost:3001/api/discover-tokens?limit=5
```

### 4.3 Monitor Metrics

```bash
# Prometheus metrics
curl http://localhost:3001/metrics
```

## Step 5: Monitoring Setup

### 5.1 Configure Prometheus

Update `monitoring/prometheus.yml` with production targets.

### 5.2 Set Up Grafana

1. Import dashboards from `monitoring/grafana/dashboards/`
2. Configure data source (Prometheus)
3. Set up alerting rules

### 5.3 Configure Alertmanager

Update `monitoring/alertmanager.yml` with:
- PagerDuty integration
- Email notifications
- Slack webhooks

## Step 6: Backup Configuration

### 6.1 Set Up Automated Backups

Add to crontab:

```bash
# Daily database backup at 2 AM
0 2 * * * /path/to/scripts/backup-database.sh

# Weekly Greenfield backup on Sunday
0 3 * * 0 /path/to/scripts/backup-greenfield.sh
```

### 6.2 Test Backup Restoration

```bash
# Test restore procedure monthly
./scripts/restore.sh backups/db_backup_YYYYMMDD_HHMMSS.sql.gz
```

## Step 7: Security Hardening

### 7.1 Enable API Authentication

Update API server to require API keys for sensitive endpoints.

### 7.2 Configure Rate Limiting

Verify rate limits are appropriate for production traffic.

### 7.3 Set Up SSL/TLS

Use reverse proxy (nginx/traefik) with Let's Encrypt certificates.

## Step 8: Scaling (Optional)

### 8.1 Horizontal Scaling

```bash
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### 8.2 Load Balancer

Configure nginx or traefik as load balancer.

## Troubleshooting

### Service Won't Start

1. Check logs: `docker-compose logs backend`
2. Verify environment variables
3. Check database connection
4. Verify wallet private key format

### Database Connection Issues

1. Verify DATABASE_URL format
2. Check network connectivity
3. Verify database credentials
4. Check firewall rules

### High Memory Usage

1. Check for memory leaks
2. Increase container memory limits
3. Optimize queries
4. Enable Redis caching

## Rollback Procedure

If deployment fails:

```bash
# Rollback to previous version
./scripts/rollback.sh production previous-version

# Or manually
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

## Maintenance Windows

Schedule maintenance during low-traffic periods:

1. Notify users
2. Enable maintenance mode
3. Perform updates
4. Run health checks
5. Disable maintenance mode

## Support

For issues, contact:
- On-call engineer: [Contact]
- Infrastructure team: [Contact]

