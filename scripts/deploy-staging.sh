#!/bin/bash
# Staging Deployment Script
# Deploys the bot to staging environment with health checks

set -e

echo "🚀 Starting staging deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
ENVIRONMENT="staging"
DOCKER_IMAGE="immortal-bot-staging"
HEALTH_CHECK_URL="http://localhost:3001/health"
MAX_HEALTH_CHECK_RETRIES=10
HEALTH_CHECK_INTERVAL=5

# Build Docker image
echo -e "${YELLOW}📦 Building Docker image...${NC}"
docker build -t ${DOCKER_IMAGE}:latest -f Dockerfile.backend .

# Stop existing container
echo -e "${YELLOW}🛑 Stopping existing container...${NC}"
docker-compose -f docker-compose.staging.yml down || true

# Start new container
echo -e "${YELLOW}▶️  Starting new container...${NC}"
docker-compose -f docker-compose.staging.yml up -d

# Wait for container to be ready
echo -e "${YELLOW}⏳ Waiting for service to be ready...${NC}"
sleep 10

# Health check
echo -e "${YELLOW}🏥 Performing health checks...${NC}"
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_HEALTH_CHECK_RETRIES ]; do
  if curl -f ${HEALTH_CHECK_URL} > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
    break
  fi
  
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo -e "${YELLOW}⏳ Health check attempt ${RETRY_COUNT}/${MAX_HEALTH_CHECK_RETRIES}...${NC}"
  sleep ${HEALTH_CHECK_INTERVAL}
done

if [ $RETRY_COUNT -eq $MAX_HEALTH_CHECK_RETRIES ]; then
  echo -e "${RED}❌ Health check failed after ${MAX_HEALTH_CHECK_RETRIES} attempts${NC}"
  echo -e "${YELLOW}🔄 Rolling back...${NC}"
  docker-compose -f docker-compose.staging.yml down
  exit 1
fi

echo -e "${GREEN}✅ Staging deployment successful!${NC}"

