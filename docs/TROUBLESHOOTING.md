# Troubleshooting Guide

Common issues and solutions for the Immortal AI Trading Bot.

## Table of Contents

1. [Bot Won't Start](#bot-wont-start)
2. [Database Connection Issues](#database-connection-issues)
3. [API Errors](#api-errors)
4. [Trading Issues](#trading-issues)
5. [Performance Issues](#performance-issues)
6. [Memory/Storage Issues](#memorystorage-issues)

## Bot Won't Start

### Symptom
Bot status shows as "stopped" or API returns errors when starting.

### Solutions

1. **Check Environment Variables**
   ```bash
   # Verify required variables are set
   echo $WALLET_PRIVATE_KEY
   echo $OPENROUTER_API_KEY
   echo $DATABASE_URL
   ```

2. **Check Logs**
   ```bash
   docker-compose logs backend | tail -50
   ```

3. **Verify Wallet Balance**
   ```bash
   # Check if wallet has sufficient BNB
   curl http://localhost:3001/api/bot-status
   ```

4. **Check Database Connection**
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

## Database Connection Issues

### Symptom
Errors like "Connection refused" or "ECONNREFUSED".

### Solutions

1. **Verify Database is Running**
   ```bash
   docker-compose ps postgres
   ```

2. **Check Connection String**
   ```bash
   # Format: postgresql://user:password@host:port/database
   echo $DATABASE_URL
   ```

3. **Test Connection**
   ```bash
   psql $DATABASE_URL -c "SELECT version()"
   ```

4. **Check Network**
   ```bash
   # If using Docker, ensure services are on same network
   docker network ls
   ```

## API Errors

### Symptom
API returns 500 errors or timeouts.

### Solutions

1. **Check Service Status**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Review Error Logs**
   ```bash
   tail -f logs/error.log
   ```

3. **Check Rate Limiting**
   ```bash
   # Verify you're not hitting rate limits
   curl -v http://localhost:3001/api/bot-status
   ```

4. **Verify API Key**
   ```bash
   # Ensure API key is valid
   curl -H "X-API-Key: your-key" http://localhost:3001/api/bot-status
   ```

## Trading Issues

### Symptom
Bot is running but not executing trades.

### Solutions

1. **Check AI Confidence**
   - Low confidence decisions may result in HOLD
   - Review AI decision logs

2. **Verify Market Conditions**
   ```bash
   # Check if tokens have sufficient liquidity
   curl http://localhost:3001/api/discover-tokens
   ```

3. **Check Safeguards**
   - Verify trade amount limits
   - Check stop-loss settings
   - Review risk level

4. **Review Trade Logs**
   ```bash
   curl http://localhost:3001/api/trade-logs?limit=10
   ```

## Performance Issues

### Symptom
Slow API responses or high latency.

### Solutions

1. **Check Database Performance**
   ```bash
   # Check for slow queries
   psql $DATABASE_URL -c "
   SELECT query, mean_exec_time 
   FROM pg_stat_statements 
   ORDER BY mean_exec_time DESC 
   LIMIT 10;
   "
   ```

2. **Review Cache Hit Rate**
   ```bash
   # Check Redis stats
   redis-cli INFO stats
   ```

3. **Check System Resources**
   ```bash
   # CPU and memory usage
   docker stats
   ```

4. **Optimize Queries**
   - Add database indexes
   - Review query patterns
   - Enable query caching

## Memory/Storage Issues

### Symptom
Greenfield storage errors or memory sync failures.

### Solutions

1. **Verify Greenfield Connection**
   ```bash
   # Check Greenfield RPC
   echo $GREENFIELD_RPC_URL
   ```

2. **Check Bucket Access**
   ```bash
   # Verify bucket exists and is accessible
   echo $GREENFIELD_BUCKET_NAME
   ```

3. **Review Memory Sync Queue**
   ```bash
   # Check metrics
   curl http://localhost:3001/metrics | grep memory_sync
   ```

4. **Clear Sync Backlog**
   ```bash
   # If backlog is too large, may need to process manually
   # Check logs for sync errors
   ```

## Common Error Messages

### "Insufficient balance"

**Solution:** Add BNB to wallet
```bash
# Get testnet BNB from faucet
# Mainnet: Transfer BNB to wallet
```

### "Rate limit exceeded"

**Solution:** Wait for rate limit window to reset or upgrade API plan

### "Circuit breaker is OPEN"

**Solution:** External service is down. Wait for automatic recovery or check service status.

### "Database connection timeout"

**Solution:**
1. Check database is running
2. Verify network connectivity
3. Check connection pool settings

## Getting Help

If issues persist:

1. Check logs: `logs/error.log` and `logs/combined.log`
2. Review metrics: `http://localhost:3001/metrics`
3. Check health: `http://localhost:3001/api/health`
4. Contact support with:
   - Error messages
   - Log excerpts
   - System configuration
   - Steps to reproduce

