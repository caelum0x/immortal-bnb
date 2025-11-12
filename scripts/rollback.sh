#!/bin/bash
# Rollback Script for Immortal AI Trading Bot

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

BACKUP_FILE=${1}

if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Please specify a backup file${NC}"
    echo "Usage: $0 <backup-file.tar.gz>"
    echo ""
    echo "Available backups:"
    ls -lht ./backups/*.tar.gz 2>/dev/null | head -5 || echo "No backups found"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  WARNING: This will stop all services and restore from backup${NC}"
echo "Backup file: $BACKUP_FILE"
read -p "Are you sure you want to continue? (yes/no): " -r
if [[ ! $REPLY =~ ^yes$ ]]; then
    echo "Rollback cancelled"
    exit 0
fi

# 1. Stop services
echo "🛑 Stopping services..."
docker-compose down

# 2. Create rollback backup
echo "💾 Creating rollback backup of current state..."
ROLLBACK_BACKUP="./backups/pre-rollback-$(date +%Y%m%d_%H%M%S).tar.gz"
./scripts/backup.sh || true

# 3. Extract backup
echo "📦 Extracting backup..."
RESTORE_DIR="./restore-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESTORE_DIR"
tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR"

# 4. Restore configuration
echo "⚙️  Restoring configuration..."
if [ -f "$RESTORE_DIR/config/.env.backup" ]; then
    cp "$RESTORE_DIR/config/.env.backup" .env
    echo -e "${GREEN}✓ Environment restored${NC}"
fi

if [ -f "$RESTORE_DIR/config/docker-compose.yml.backup" ]; then
    cp "$RESTORE_DIR/config/docker-compose.yml.backup" docker-compose.yml
    echo -e "${GREEN}✓ Docker Compose config restored${NC}"
fi

# 5. Restore data
echo "🗄️  Restoring data..."
if [ -f "$RESTORE_DIR/data/bot.db.backup" ]; then
    mkdir -p ./data
    cp "$RESTORE_DIR/data/bot.db.backup" ./data/bot.db
    echo -e "${GREEN}✓ Database restored${NC}"
fi

# 6. Restart services
echo "▶️  Restarting services..."
docker-compose up -d

# 7. Wait and verify
echo "⏳ Waiting for services..."
sleep 10

# Health check
curl -f http://localhost:3001/api/health && echo -e "${GREEN}✓ Backend is healthy${NC}" || echo -e "${RED}✗ Backend health check failed${NC}"

# 8. Cleanup
echo "🧹 Cleaning up..."
rm -rf "$RESTORE_DIR"

echo ""
echo -e "${GREEN}✅ Rollback complete!${NC}"
echo "Previous state backed up to: $ROLLBACK_BACKUP"
