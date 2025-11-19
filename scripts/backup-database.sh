#!/bin/bash
# Database Backup Script
# Creates automated backups of PostgreSQL database

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATABASE_URL="${DATABASE_URL:-postgresql://user:password@localhost:5432/immortal_bot}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql.gz"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

echo -e "${YELLOW}📦 Starting database backup...${NC}"

# Extract connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

# Perform backup
if command -v pg_dump &> /dev/null; then
  export PGPASSWORD="${DB_PASS}"
  pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${BACKUP_FILE}"
  unset PGPASSWORD
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup created: ${BACKUP_FILE}${NC}"
    
    # Get backup size
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo -e "${GREEN}   Size: ${BACKUP_SIZE}${NC}"
  else
    echo -e "${RED}❌ Backup failed${NC}"
    exit 1
  fi
else
  echo -e "${RED}❌ pg_dump not found. Please install PostgreSQL client tools.${NC}"
  exit 1
fi

# Cleanup old backups
echo -e "${YELLOW}🧹 Cleaning up old backups (older than ${RETENTION_DAYS} days)...${NC}"
find "${BACKUP_DIR}" -name "db_backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete
echo -e "${GREEN}✅ Cleanup complete${NC}"

echo -e "${GREEN}✅ Database backup complete!${NC}"

