#!/bin/bash
# Restore Script
# Restores database from backup

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ -z "$1" ]; then
  echo -e "${RED}❌ Usage: $0 <backup_file>${NC}"
  echo -e "${YELLOW}   Example: $0 ./backups/db_backup_20250101_120000.sql.gz${NC}"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo -e "${RED}❌ Backup file not found: ${BACKUP_FILE}${NC}"
  exit 1
fi

echo -e "${RED}⚠️  WARNING: This will overwrite the current database!${NC}"
read -p "Are you sure you want to continue? (yes/no): " -r
if [[ ! $REPLY =~ ^yes$ ]]; then
  echo "Restore cancelled"
  exit 0
fi

# Extract connection details
DATABASE_URL="${DATABASE_URL:-postgresql://user:password@localhost:5432/immortal_bot}"
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

echo -e "${YELLOW}🔄 Restoring database from ${BACKUP_FILE}...${NC}"

# Restore database
if command -v psql &> /dev/null; then
  export PGPASSWORD="${DB_PASS}"
  
  # Drop and recreate database (or just restore)
  if [ "${BACKUP_FILE}" == *.gz ]; then
    gunzip -c "${BACKUP_FILE}" | psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}"
  else
    psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" < "${BACKUP_FILE}"
  fi
  
  unset PGPASSWORD
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database restored successfully!${NC}"
  else
    echo -e "${RED}❌ Restore failed${NC}"
    exit 1
  fi
else
  echo -e "${RED}❌ psql not found. Please install PostgreSQL client tools.${NC}"
  exit 1
fi

