# Docker Deployment Guide

This guide covers deploying the Immortal AI Trading Bot using Docker containers.

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Building the Image](#building-the-image)
- [Running with Docker Compose](#running-with-docker-compose)
- [Running Standalone](#running-standalone)
- [Monitoring](#monitoring)
- [Logs](#logs)
- [Backup and Restore](#backup-and-restore)
- [Troubleshooting](#troubleshooting)
- [Production Best Practices](#production-best-practices)

## Quick Start

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit .env with your credentials
nano .env

# 3. Start with Docker Compose
docker-compose up -d

# 4. Check logs
docker-compose logs -f bot

# 5. Monitor health
docker-compose ps
```

## Prerequisites

- **Docker** 20.10+ installed
- **Docker Compose** 2.0+ installed
- **Environment file** (.env) configured with required variables
- **BNB** for gas fees (testnet or mainnet)

### Install Docker

**Ubuntu/Debian:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**macOS:**
```bash
brew install docker docker-compose
```

**Windows:**
- Download Docker Desktop from https://docker.com/products/docker-desktop

## Configuration

### Environment Variables

Create a `.env` file with required variables:

```bash
# Required
WALLET_PRIVATE_KEY=0x...
OPENROUTER_API_KEY=sk-or-v1-...
NETWORK=testnet  # or mainnet

# API Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000

# Trading Configuration
MAX_TRADE_AMOUNT_BNB=0.1
STOP_LOSS_PERCENTAGE=10
```

For complete configuration, see `.env.example`

### Using Environment Templates

```bash
# Development
cp .env.development .env

# Production
cp .env.production .env
# Edit and add your actual values
```

## Building the Image

### Standard Build

```bash
docker build -t immortal-bot .
```

### Multi-Architecture Build

```bash
# For ARM64 and AMD64 (Apple Silicon, Intel, AMD)
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t immortal-bot:latest \
  --push .
```

### Build Arguments

```bash
# Custom build
docker build \
  --build-arg NODE_ENV=production \
  -t immortal-bot:prod \
  .
```

## Running with Docker Compose

### Start Services

```bash
# Start in detached mode
docker-compose up -d

# Start with rebuild
docker-compose up -d --build

# View logs while starting
docker-compose up
```

### Stop Services

```bash
# Stop containers
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes
docker-compose down -v
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart bot
```

## Running Standalone

### Basic Run

```bash
docker run -d \
  --name immortal-bot \
  --env-file .env \
  -p 3001:3001 \
  --restart unless-stopped \
  immortal-bot
```

### With Volume Mounts

```bash
docker run -d \
  --name immortal-bot \
  --env-file .env \
  -p 3001:3001 \
  -v $(pwd)/logs:/app/logs \
  -v bot-data:/app/data \
  --restart unless-stopped \
  immortal-bot
```

### Interactive Mode (for debugging)

```bash
docker run -it \
  --name immortal-bot \
  --env-file .env \
  -p 3001:3001 \
  immortal-bot
```

## Monitoring

### Check Container Status

```bash
# List running containers
docker ps

# Check specific container
docker ps -f name=immortal-bot

# View container resource usage
docker stats immortal-bot
```

### Health Checks

```bash
# Manual health check
docker exec immortal-bot bun run healthcheck

# Check health status
docker inspect --format='{{.State.Health.Status}}' immortal-bot
```

### Bot Monitoring

```bash
# Run monitoring script
docker exec immortal-bot bun run scripts/monitor.ts

# Continuous monitoring
docker exec immortal-bot bun run scripts/monitor.ts --watch
```

## Logs

### View Logs

```bash
# Follow logs
docker-compose logs -f bot

# Last 100 lines
docker-compose logs --tail=100 bot

# Logs from last hour
docker-compose logs --since=1h bot

# Standalone container
docker logs -f immortal-bot
```

### Log Files

Logs are stored in the `logs/` directory (mounted volume):

```bash
# View from host
tail -f logs/combined.log
tail -f logs/error.log

# View from container
docker exec immortal-bot tail -f /app/logs/combined.log
```

### Export Logs

```bash
# Export to file
docker-compose logs bot > bot-logs-$(date +%Y%m%d).log

# Export last 24 hours
docker-compose logs --since=24h bot > bot-logs-recent.log
```

## Backup and Restore

### Create Backup

```bash
# Using backup script
docker exec immortal-bot bash scripts/backup.sh

# Manual backup of volumes
docker run --rm \
  -v immortal-bnb_bot-data:/data \
  -v $(pwd)/backups:/backup \
  ubuntu tar czf /backup/bot-data-$(date +%Y%m%d).tar.gz -C /data .
```

### Restore from Backup

```bash
# Stop container
docker-compose down

# Restore volume
docker run --rm \
  -v immortal-bnb_bot-data:/data \
  -v $(pwd)/backups:/backup \
  ubuntu bash -c "cd /data && tar xzf /backup/bot-data-YYYYMMDD.tar.gz"

# Start container
docker-compose up -d
```

### Backup Database (if using PostgreSQL)

```bash
# Backup PostgreSQL data
docker exec immortal-db pg_dump -U bot immortal_bot > backup.sql

# Restore
docker exec -i immortal-db psql -U bot immortal_bot < backup.sql
```

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker-compose logs bot
```

**Common issues:**
1. Port already in use
   ```bash
   # Check what's using port 3001
   sudo lsof -i :3001

   # Change port in .env
   PORT=3002
   ```

2. Missing environment variables
   ```bash
   # Validate .env file
   docker-compose config
   ```

3. Permission issues
   ```bash
   # Fix log directory permissions
   sudo chown -R $(id -u):$(id -g) logs/
   ```

### Container Keeps Restarting

```bash
# Check restart count
docker inspect immortal-bot | grep -A 5 RestartCount

# View recent logs
docker logs --tail=50 immortal-bot

# Disable auto-restart temporarily
docker update --restart=no immortal-bot
```

### Out of Memory

```bash
# Check memory usage
docker stats immortal-bot

# Increase memory limit in docker-compose.yml
services:
  bot:
    mem_limit: 2g
    mem_reservation: 1g
```

### Network Issues

```bash
# Check network connectivity
docker exec immortal-bot curl -I https://api.openrouter.ai

# Test RPC connection
docker exec immortal-bot curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  https://bsc-dataseed.binance.org
```

### Debugging Inside Container

```bash
# Enter container shell
docker exec -it immortal-bot /bin/bash

# Run commands inside
cd /app
bun run healthcheck
cat .env
ls -la logs/
```

## Production Best Practices

### 1. Security

**Use secrets instead of .env:**
```yaml
# docker-compose.yml
services:
  bot:
    secrets:
      - wallet_key
      - api_key

secrets:
  wallet_key:
    file: ./secrets/wallet_key.txt
  api_key:
    file: ./secrets/api_key.txt
```

**Run as non-root user:**
```dockerfile
# Already implemented in Dockerfile
USER botuser
```

### 2. Resource Limits

```yaml
# docker-compose.yml
services:
  bot:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G
```

### 3. Logging Configuration

```yaml
# docker-compose.yml
services:
  bot:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 4. Health Checks

```yaml
# docker-compose.yml
services:
  bot:
    healthcheck:
      test: ["CMD", "bun", "run", "healthcheck"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### 5. Auto-Restart Policies

```yaml
services:
  bot:
    restart: unless-stopped  # or always, on-failure
```

### 6. Monitoring with Prometheus

```yaml
# docker-compose.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    depends_on:
      - prometheus
```

### 7. Reverse Proxy with Nginx

```yaml
# docker-compose.yml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - bot
```

### 8. Database Persistence

```yaml
services:
  postgres:
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./backups:/backups

volumes:
  postgres-data:
    driver: local
```

## Docker Commands Reference

### Image Management

```bash
# List images
docker images

# Remove image
docker rmi immortal-bot

# Prune unused images
docker image prune -a
```

### Container Management

```bash
# List all containers
docker ps -a

# Remove container
docker rm immortal-bot

# Remove all stopped containers
docker container prune
```

### Volume Management

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect immortal-bnb_bot-data

# Remove volume
docker volume rm immortal-bnb_bot-data

# Prune unused volumes
docker volume prune
```

### Network Management

```bash
# List networks
docker network ls

# Inspect network
docker network inspect immortal-bnb_immortal-network

# Create network
docker network create bot-network
```

## CI/CD Integration

### GitHub Actions

See `.github/workflows/ci.yml` for automated Docker builds:

```yaml
- name: Build Docker image
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: immortal-bot:latest
```

### Push to Registry

```bash
# Tag for registry
docker tag immortal-bot registry.example.com/immortal-bot:latest

# Push to registry
docker push registry.example.com/immortal-bot:latest
```

## Support

- **Issues**: GitHub Issues
- **Documentation**: See README.md, DEPLOYMENT.md
- **Logs**: Check `logs/combined.log` and `logs/error.log`

---

**Remember**: Always test in a development environment before deploying to production!
