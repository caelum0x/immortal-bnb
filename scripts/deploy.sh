#!/bin/bash
# Production Deployment Script for Immortal AI Trading Bot

set -e

echo "🚀 Starting deployment process..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
ENV=${1:-production}
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

echo -e "${YELLOW}Environment: ${ENV}${NC}"

# 1. Pre-deployment checks
echo "📋 Running pre-deployment checks..."

if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: docker-compose.yml not found${NC}"
    exit 1
fi

# 2. Backup current state
echo "💾 Creating backup..."
mkdir -p "$BACKUP_DIR"

# Backup environment files
cp .env "$BACKUP_DIR/.env.backup"

# Backup database (if using)
if [ -f "./data/bot.db" ]; then
    cp ./data/bot.db "$BACKUP_DIR/bot.db.backup"
fi

# Export current Docker state
docker-compose config > "$BACKUP_DIR/docker-compose.backup.yml" || true

echo -e "${GREEN}✓ Backup created at $BACKUP_DIR${NC}"

# 3. Pull latest code
echo "📥 Pulling latest code..."
git fetch origin
git pull origin $(git rev-parse --abbrev-ref HEAD)

# 4. Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Python dependencies
cd agents && pip install -r requirements.txt && cd ..

# Frontend dependencies
cd frontend && npm ci && cd ..

# 5. Build applications
echo "🔨 Building applications..."
npm run build:all

# 6. Run tests
echo "🧪 Running tests..."
npm test || {
    echo -e "${RED}Tests failed! Aborting deployment.${NC}"
    exit 1
}

# 7. Stop current services
echo "🛑 Stopping current services..."
docker-compose down

# 8. Pull Docker images
echo "🐳 Pulling Docker images..."
docker-compose pull

# 9. Build new images
echo "🔧 Building new Docker images..."
docker-compose build

# 10. Start services
echo "▶️  Starting services..."
docker-compose up -d

# 11. Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check backend health
echo "Checking backend health..."
curl -f http://localhost:3001/api/health || {
    echo -e "${RED}Backend health check failed!${NC}"
    echo "Rolling back..."
    docker-compose down
    exit 1
}

# Check Python API health
echo "Checking Python API health..."
curl -f http://localhost:5000/health || {
    echo -e "${YELLOW}Warning: Python API health check failed${NC}"
}

# 12. Post-deployment tasks
echo "📊 Running post-deployment tasks..."

# Clear old Docker images
docker image prune -f

# Clear old backups (keep last 7 days)
find ./backups -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true

# 13. Display status
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Services:"
echo "  - Backend API: http://localhost:3001"
echo "  - Python API: http://localhost:5000"
echo "  - Frontend: http://localhost:3000"
echo "  - Prometheus Metrics: http://localhost:3001/metrics"
echo ""
echo "View logs:"
echo "  docker-compose logs -f"
echo ""
echo "Backup location: $BACKUP_DIR"
