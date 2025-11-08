#!/bin/bash
# Backup Script for Immortal AI Trading Bot
# Backs up logs, configuration, and trade data

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="immortal-bot-backup-${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 Starting backup...${NC}\n"

# Create backup directory
mkdir -p "${BACKUP_PATH}"
echo -e "${GREEN}✅${NC} Created backup directory: ${BACKUP_PATH}"

# Backup logs
if [ -d "logs" ]; then
    echo -e "${BLUE}📝${NC} Backing up logs..."
    cp -r logs "${BACKUP_PATH}/"
    echo -e "${GREEN}✅${NC} Logs backed up"
else
    echo -e "${YELLOW}⚠️${NC}  No logs directory found"
fi

# Backup data directory (if exists)
if [ -d "data" ]; then
    echo -e "${BLUE}💾${NC} Backing up data..."
    cp -r data "${BACKUP_PATH}/"
    echo -e "${GREEN}✅${NC} Data backed up"
fi

# Backup configuration (without secrets)
echo -e "${BLUE}⚙️${NC}  Backing up configuration..."
if [ -f ".env.example" ]; then
    cp .env.example "${BACKUP_PATH}/"
fi
if [ -f "package.json" ]; then
    cp package.json "${BACKUP_PATH}/"
fi
echo -e "${GREEN}✅${NC} Configuration backed up"

# Backup contract ABIs (if compiled)
if [ -d "artifacts" ]; then
    echo -e "${BLUE}📜${NC} Backing up contract ABIs..."
    mkdir -p "${BACKUP_PATH}/artifacts"
    cp -r artifacts/contracts "${BACKUP_PATH}/artifacts/" 2>/dev/null || true
    echo -e "${GREEN}✅${NC} Contract ABIs backed up"
fi

# Create backup info file
cat > "${BACKUP_PATH}/backup-info.txt" << EOF
Immortal AI Trading Bot - Backup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Backup Date: $(date)
Backup Name: ${BACKUP_NAME}
Hostname: $(hostname)
User: $(whoami)

Contents:
- Logs
- Data files
- Configuration (without secrets)
- Contract ABIs

⚠️  NOT INCLUDED (security):
- .env file with secrets
- Private keys
- API keys

To restore:
1. Extract backup to project directory
2. Manually restore .env file with your secrets
3. Restart bot

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

# Compress backup
echo -e "${BLUE}📦${NC} Compressing backup..."
cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
rm -rf "${BACKUP_NAME}"
cd - > /dev/null

# Calculate size
BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | cut -f1)

echo ""
echo -e "${GREEN}✅ Backup complete!${NC}"
echo -e "   Location: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo -e "   Size: ${BACKUP_SIZE}"
echo ""

# Cleanup old backups (keep last 7)
echo -e "${BLUE}🧹${NC} Cleaning up old backups (keeping last 7)..."
cd "${BACKUP_DIR}"
ls -t immortal-bot-backup-*.tar.gz 2>/dev/null | tail -n +8 | xargs -r rm -f
BACKUP_COUNT=$(ls -1 immortal-bot-backup-*.tar.gz 2>/dev/null | wc -l)
echo -e "${GREEN}✅${NC} ${BACKUP_COUNT} backups retained"
cd - > /dev/null

echo ""
echo -e "${BLUE}💡 Tips:${NC}"
echo "   - Store backups in a secure location"
echo "   - Keep .env file separately (encrypted)"
echo "   - Test restore procedure periodically"
echo "   - Consider offsite backup for critical data"
echo ""
