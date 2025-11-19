# Operational Runbooks

Common operational procedures for the Immortal AI Trading Bot.

## Table of Contents

1. [Starting the Bot](#starting-the-bot)
2. [Stopping the Bot](#stopping-the-bot)
3. [Checking Bot Status](#checking-bot-status)
4. [Viewing Logs](#viewing-logs)
5. [Restarting Services](#restarting-services)
6. [Database Maintenance](#database-maintenance)
7. [Clearing Cache](#clearing-cache)
8. [Rotating API Keys](#rotating-api-keys)
9. [Emergency Stop](#emergency-stop)

## Starting the Bot

### Via API

```bash
curl -X POST http://localhost:3001/api/start-bot \
  -H "Content-Type: application/json" \
  -d '{
    "tokens": [],
    "risk": 5
  }'
```

### Via Docker

```bash
docker-compose exec backend bun run src/index.ts
```

## Stopping the Bot

### Via API

```bash
curl -X POST http://localhost:3001/api/stop-bot
```

### Via Docker

```bash
docker-compose stop backend
```

## Checking Bot Status

```bash
# Basic status
curl http://localhost:3001/api/bot-status

# Health check
curl http://localhost:3001/health

# Detailed health
curl http://localhost:3001/api/health
```

## Viewing Logs

### Docker Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Log Files

```bash
# Error logs
tail -f logs/error.log

# Combined logs
tail -f logs/combined.log

# Structured JSON logs
tail -f logs/structured.json | jq
```

## Restarting Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend

# Full restart (stop and start)
docker-compose down
docker-compose up -d
```

## Database Maintenance

### Run Migrations

```bash
bunx prisma migrate deploy
```

### Check Database Size

```bash
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size(current_database()));"
```

### Vacuum Database

```bash
psql $DATABASE_URL -c "VACUUM ANALYZE;"
```

### Check Table Sizes

```bash
psql $DATABASE_URL -c "
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

## Clearing Cache

### Redis Cache

```bash
# Connect to Redis
redis-cli

# Clear all cache
FLUSHALL

# Clear specific pattern
KEYS "immortal-bot:token:*" | xargs redis-cli DEL
```

### Application Cache

```bash
# Via API (if endpoint exists)
curl -X POST http://localhost:3001/api/cache/clear
```

## Rotating API Keys

### Generate New API Key

```bash
# Via script
bun run scripts/generate-api-key.ts

# Or manually
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Update Environment

1. Add new key to `.env.production`
2. Update API clients
3. Revoke old key after migration period

## Emergency Stop

### Immediate Stop

```bash
# Stop bot
curl -X POST http://localhost:3001/api/stop-bot

# Pause wallet
# (Requires wallet manager integration)
```

### Complete Shutdown

```bash
# Stop all services
docker-compose down

# Stop database (if local)
docker-compose stop postgres
```

## Performance Tuning

### Increase Memory Limits

Edit `docker-compose.prod.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
```

### Optimize Database

```bash
# Analyze query performance
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM \"Trade\" WHERE \"tokenAddress\" = '0x...';"

# Create indexes if needed
bunx prisma migrate dev --create-only
```

## Monitoring

### Check Metrics

```bash
# Prometheus metrics
curl http://localhost:3001/metrics

# Specific metric
curl http://localhost:3001/metrics | grep trades_total
```

### View Grafana Dashboards

1. Open Grafana: http://localhost:3000
2. Navigate to dashboards
3. Select relevant dashboard

## Troubleshooting Common Issues

### Bot Not Starting

1. Check logs: `docker-compose logs backend`
2. Verify environment variables
3. Check database connection
4. Verify wallet balance

### High Error Rate

1. Check error logs: `tail -f logs/error.log`
2. Review recent errors
3. Check external service status
4. Review circuit breaker states

### Slow Performance

1. Check database query performance
2. Review cache hit rates
3. Check API response times
4. Review system resources

