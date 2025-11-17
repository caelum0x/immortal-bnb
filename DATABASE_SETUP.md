# Database Setup Guide

## Overview

This guide will help you set up the production-ready PostgreSQL database for Immortal BNB.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ or Bun 1.0+
- Git

## Quick Start

### 1. Start Database Services

```bash
# Start PostgreSQL, Redis, Prometheus, and Grafana
docker compose up -d postgres redis prometheus grafana

# Verify services are running
docker compose ps
```

Expected output:
```
NAME                        STATUS    PORTS
immortal-bnb-postgres       Up        0.0.0.0:5432->5432/tcp
immortal-bnb-redis          Up        0.0.0.0:6379->6379/tcp
immortal-bnb-prometheus     Up        0.0.0.0:9090->9090/tcp
immortal-bnb-grafana        Up        0.0.0.0:3002->3000/tcp
```

### 2. Run Database Migrations

```bash
# Create and apply migrations
npx prisma migrate dev --name production_schema

# Or with Bun
bunx prisma migrate dev --name production_schema
```

### 3. Generate Prisma Client

```bash
# Generate TypeScript types and Prisma Client
npx prisma generate

# Or with Bun
bunx prisma generate
```

### 4. Verify Setup

```bash
# Open Prisma Studio to browse the database
npx prisma studio

# This will open http://localhost:5555
```

## Database Schema

The production database includes the following models:

### User Management
- **User** - User accounts with wallet addresses, profiles, settings
- **Follow** - Social following relationships

### Trading
- **Trade** - Trade execution history
- **Position** - Current market positions
- **Order** - Active and historical orders

### AI Agents
- **Agent** - AI trading agent configurations
- **AgentDecision** - Agent decision logs

### Staking & Token
- **StakingPosition** - User staking positions
- **TokenHolder** - IMMBOT token holder data

### DeFi
- **ArbitrageExecution** - Flash loan arbitrage history

### Social
- **CopyTrading** - Copy trading relationships

### System
- **Notification** - User notifications across all channels

## Environment Variables

Ensure your `.env` or `.env.development` file contains:

```env
# Database
DATABASE_URL=postgresql://immortal:immortal_dev_password@localhost:5432/immortal_bnb
DATABASE_PASSWORD=immortal_dev_password

# Redis
REDIS_URL=redis://localhost:6379

# Polygon (for Polymarket CLOB)
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGON_WALLET_PRIVATE_KEY=your_private_key_here

# Smart Contracts (after deployment)
IMMBOT_TOKEN_CONTRACT=0x...
STAKING_CONTRACT=0x...
FLASH_LOAN_ARBITRAGE_CONTRACT=0x...
```

## Database Migrations

### Create a New Migration

```bash
# Make changes to prisma/schema.prisma, then:
npx prisma migrate dev --name descriptive_migration_name
```

### Apply Migrations in Production

```bash
# In production, use migrate deploy instead of migrate dev
npx prisma migrate deploy
```

### Reset Database (Development Only)

```bash
# WARNING: This will delete all data!
npx prisma migrate reset
```

## Seeding the Database

### Create Seed File

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  // Create test user
  const testUser = await prisma.user.create({
    data: {
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      username: 'test_trader',
      displayName: 'Test Trader',
      bio: 'Testing the Immortal BNB platform',
      publicProfile: true,
    },
  });

  console.log('✅ Created test user:', testUser.username);

  // Create test agent
  const testAgent = await prisma.agent.create({
    data: {
      userId: testUser.id,
      name: 'Polymarket Pro',
      description: 'AI agent for Polymarket trading',
      agentType: 'POLYMARKET',
      strategyName: 'momentum_trading',
      config: {
        indicators: ['rsi', 'macd'],
        timeframe: '1h',
      },
      maxTradeAmount: 100,
      minConfidence: 0.7,
      riskTolerance: 0.5,
      allowedMarkets: [],
      active: false,
    },
  });

  console.log('✅ Created test agent:', testAgent.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Run Seed

```bash
# Add to package.json:
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}

# Then run:
npx prisma db seed
```

## Accessing Services

### PostgreSQL
- **Host:** localhost
- **Port:** 5432
- **Database:** immortal_bnb
- **Username:** immortal
- **Password:** immortal_dev_password

```bash
# Connect using psql
docker exec -it immortal-bnb-postgres psql -U immortal -d immortal_bnb

# Common queries
\dt          # List tables
\d users     # Describe users table
SELECT * FROM "User" LIMIT 10;
```

### Redis
- **Host:** localhost
- **Port:** 6379

```bash
# Connect using redis-cli
docker exec -it immortal-bnb-redis redis-cli

# Common commands
KEYS *          # List all keys
GET key_name    # Get value
FLUSHALL        # Clear all data (careful!)
```

### Prometheus
- **URL:** http://localhost:9090
- **Targets:** http://localhost:9090/targets
- **Queries:** http://localhost:9090/graph

```promql
# Example queries:
rate(http_requests_total[5m])
http_request_duration_seconds_bucket
```

### Grafana
- **URL:** http://localhost:3002
- **Username:** admin
- **Password:** admin

Import dashboards from `monitoring/grafana/dashboards/`.

## Production Deployment

### 1. Use Managed Database (Recommended)

**Recommended Providers:**
- **AWS RDS** for PostgreSQL
- **DigitalOcean Managed Databases**
- **Railway** (easiest, includes Redis)
- **Supabase** (PostgreSQL + realtime features)

### 2. Security Checklist

- [ ] Use strong passwords (not `immortal_dev_password`)
- [ ] Enable SSL/TLS for database connections
- [ ] Use connection pooling (PgBouncer)
- [ ] Set up automated backups
- [ ] Enable point-in-time recovery
- [ ] Restrict database access by IP
- [ ] Use read replicas for scaling
- [ ] Monitor query performance
- [ ] Set up alerts for high CPU/memory

### 3. Connection Pooling

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  relationMode = "prisma"  // For serverless
}

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch"]
}
```

Use connection pooling:

```typescript
import { PrismaClient } from '../generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### 4. Migration Strategy

```bash
# 1. Backup production database
pg_dump -U immortal -d immortal_bnb > backup.sql

# 2. Test migrations on staging
export DATABASE_URL="postgresql://user:pass@staging-db:5432/db"
npx prisma migrate deploy

# 3. Apply to production (zero-downtime)
export DATABASE_URL="postgresql://user:pass@prod-db:5432/db"
npx prisma migrate deploy

# 4. Verify
npx prisma migrate status
```

## Performance Optimization

### Indexes

The schema includes strategic indexes on:
- User lookups (walletAddress, username)
- Trading queries (userId, marketId, createdAt)
- Agent performance (totalPnL, winRate)
- Social queries (followerId, leaderId)

### Query Optimization

```typescript
// Bad: N+1 query
const users = await prisma.user.findMany();
for (const user of users) {
  const trades = await prisma.trade.findMany({ where: { userId: user.id } });
}

// Good: Include related data
const users = await prisma.user.findMany({
  include: {
    trades: {
      take: 10,
      orderBy: { createdAt: 'desc' },
    },
  },
});
```

### Caching Strategy

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getUserWithCache(userId: string) {
  // Try cache first
  const cached = await redis.get(`user:${userId}`);
  if (cached) return JSON.parse(cached);

  // Query database
  const user = await prisma.user.findUnique({ where: { id: userId } });

  // Cache for 5 minutes
  await redis.setex(`user:${userId}`, 300, JSON.stringify(user));

  return user;
}
```

## Troubleshooting

### Migration Conflicts

```bash
# If migrations are out of sync:
npx prisma migrate resolve --applied "20241117_migration_name"

# Or reset (development only):
npx prisma migrate reset
```

### Connection Issues

```bash
# Test database connection
docker exec -it immortal-bnb-postgres pg_isready -U immortal

# Check logs
docker logs immortal-bnb-postgres

# Restart database
docker compose restart postgres
```

### Performance Issues

```sql
-- Find slow queries
SELECT * FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Monitoring

### Health Checks

```typescript
import { prisma } from './lib/prisma';

app.get('/health/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});
```

### Metrics to Track

- Connection pool utilization
- Query duration (p50, p95, p99)
- Active connections
- Database size
- Index usage
- Cache hit ratio

## Backup & Recovery

### Automated Backups

```bash
# Backup script (add to cron)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
docker exec immortal-bnb-postgres pg_dump -U immortal immortal_bnb > "$BACKUP_DIR/backup_$DATE.sql"

# Compress
gzip "$BACKUP_DIR/backup_$DATE.sql"

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

### Restore from Backup

```bash
# Restore from backup
gunzip backup_20241117_120000.sql.gz
docker exec -i immortal-bnb-postgres psql -U immortal -d immortal_bnb < backup_20241117_120000.sql
```

## Next Steps

1. ✅ Database schema created
2. ⏭️  Run migrations: `npx prisma migrate dev`
3. ⏭️  Generate Prisma client: `npx prisma generate`
4. ⏭️  Create seed data: `npx prisma db seed`
5. ⏭️  Implement backend services using Prisma Client
6. ⏭️  Set up monitoring dashboards in Grafana
7. ⏭️  Configure production database (RDS, Railway, etc.)

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/docs/)
- [Prometheus Query Guide](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)
