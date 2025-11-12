#!/bin/bash
# Backup Script for Immortal AI Trading Bot

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
RETENTION_DAYS=30

echo "💾 Starting backup process..."

# Create backup directory
mkdir -p "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR/data"
mkdir -p "$BACKUP_DIR/logs"
mkdir -p "$BACKUP_DIR/config"

# 1. Backup environment configuration
echo "📁 Backing up configuration files..."
if [ -f ".env" ]; then
    cp .env "$BACKUP_DIR/config/.env.backup"
    echo -e "${GREEN}✓ Environment file backed up${NC}"
fi

if [ -f "docker-compose.yml" ]; then
    cp docker-compose.yml "$BACKUP_DIR/config/docker-compose.yml.backup"
    echo -e "${GREEN}✓ Docker Compose config backed up${NC}"
fi

# 2. Backup database
echo "🗄️  Backing up database..."
if [ -f "./data/bot.db" ]; then
    cp ./data/bot.db "$BACKUP_DIR/data/bot.db.backup"
    echo -e "${GREEN}✓ Database backed up${NC}"
else
    echo -e "${YELLOW}⚠ No database found${NC}"
fi

# 3. Backup logs
echo "📝 Backing up logs..."
if [ -d "./logs" ]; then
    cp -r ./logs/* "$BACKUP_DIR/logs/" 2>/dev/null || true
    echo -e "${GREEN}✓ Logs backed up${NC}"
fi

# 4. Export Docker container data
echo "🐳 Exporting Docker data..."
docker-compose ps > "$BACKUP_DIR/docker-status.txt" 2>/dev/null || true

# 5. Backup memory data (if available)
echo "🧠 Backing up memory data..."
if [ -d "./data/memories" ]; then
    cp -r ./data/memories "$BACKUP_DIR/data/" 2>/dev/null || true
    echo -e "${GREEN}✓ Memory data backed up${NC}"
fi

# 6. Create archive
echo "📦 Creating archive..."
ARCHIVE_NAME="immortal-bot-backup-$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "./backups/$ARCHIVE_NAME" -C "$BACKUP_DIR" .

# Get archive size
ARCHIVE_SIZE=$(du -h "./backups/$ARCHIVE_NAME" | cut -f1)

echo -e "${GREEN}✓ Archive created: $ARCHIVE_NAME ($ARCHIVE_SIZE)${NC}"

# 7. Clean up temporary backup directory
rm -rf "$BACKUP_DIR"

# 8. Clean old backups
echo "🧹 Cleaning old backups (older than $RETENTION_DAYS days)..."
find ./backups -name "*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

# 9. List current backups
echo ""
echo "📋 Current backups:"
ls -lh ./backups/*.tar.gz 2>/dev/null | tail -5 || echo "No backups found"

echo ""
echo -e "${GREEN}✅ Backup complete!${NC}"
echo "Backup location: ./backups/$ARCHIVE_NAME"
echo ""
echo "To restore from this backup:"
echo "  tar -xzf ./backups/$ARCHIVE_NAME -C ./restore"
