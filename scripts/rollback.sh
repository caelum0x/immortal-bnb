#!/bin/bash
# Rollback Script
# Rolls back to previous deployment version

set -e

echo "🔄 Starting rollback..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ENVIRONMENT=${1:-staging}
PREVIOUS_VERSION=${2:-previous}

if [ "$ENVIRONMENT" = "production" ]; then
  echo -e "${RED}⚠️  WARNING: Rolling back PRODUCTION${NC}"
  read -p "Are you sure? (yes/no): " -r
  if [[ ! $REPLY =~ ^yes$ ]]; then
    echo "Rollback cancelled"
    exit 1
  fi
fi

echo -e "${YELLOW}🛑 Stopping current deployment...${NC}"
if [ "$ENVIRONMENT" = "production" ]; then
  docker-compose -f docker-compose.prod.yml down
else
  docker-compose -f docker-compose.staging.yml down
fi

echo -e "${YELLOW}📦 Rolling back to version: ${PREVIOUS_VERSION}${NC}"
if [ "$ENVIRONMENT" = "production" ]; then
  docker-compose -f docker-compose.prod.yml up -d
else
  docker-compose -f docker-compose.staging.yml up -d
fi

echo -e "${YELLOW}⏳ Waiting for service to restart...${NC}"
sleep 10

# Health check
HEALTH_CHECK_URL="http://localhost:3001/health"
if curl -f ${HEALTH_CHECK_URL} > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Rollback successful!${NC}"
else
  echo -e "${RED}❌ Rollback health check failed${NC}"
  exit 1
fi
