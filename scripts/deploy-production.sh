#!/bin/bash
# Production Deployment Script
# Deploys the bot to production with blue-green deployment strategy

set -e

echo "🚀 Starting production deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
ENVIRONMENT="production"
DOCKER_IMAGE="immortal-bot"
VERSION=${1:-latest}
HEALTH_CHECK_URL="http://localhost:3001/health"
MAX_HEALTH_CHECK_RETRIES=15
HEALTH_CHECK_INTERVAL=5

# Validate version
if [ "$VERSION" = "latest" ]; then
  echo -e "${YELLOW}⚠️  Warning: Deploying 'latest' tag to production${NC}"
  read -p "Continue? (yes/no): " -r
  if [[ ! $REPLY =~ ^yes$ ]]; then
    echo "Deployment cancelled"
    exit 1
  fi
fi

# Build Docker image
echo -e "${YELLOW}📦 Building Docker image...${NC}"
docker build -t ${DOCKER_IMAGE}:${VERSION} -f Dockerfile.backend .
docker tag ${DOCKER_IMAGE}:${VERSION} ${DOCKER_IMAGE}:latest

# Blue-green deployment
echo -e "${YELLOW}🔄 Starting blue-green deployment...${NC}"

# Start green environment
echo -e "${YELLOW}▶️  Starting green environment...${NC}"
docker-compose -f docker-compose.prod.yml up -d --scale backend=2

# Wait for green to be ready
echo -e "${YELLOW}⏳ Waiting for green environment...${NC}"
sleep 15

# Health check on green
echo -e "${YELLOW}🏥 Performing health checks on green...${NC}"
RETRY_COUNT=0
HEALTH_CHECK_PASSED=false

while [ $RETRY_COUNT -lt $MAX_HEALTH_CHECK_RETRIES ]; do
  if curl -f ${HEALTH_CHECK_URL} > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
    HEALTH_CHECK_PASSED=true
    break
  fi
  
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo -e "${YELLOW}⏳ Health check attempt ${RETRY_COUNT}/${MAX_HEALTH_CHECK_RETRIES}...${NC}"
  sleep ${HEALTH_CHECK_INTERVAL}
done

if [ "$HEALTH_CHECK_PASSED" = false ]; then
  echo -e "${RED}❌ Health check failed. Rolling back...${NC}"
  docker-compose -f docker-compose.prod.yml down
  exit 1
fi

# Switch traffic to green (scale down blue)
echo -e "${YELLOW}🔄 Switching traffic to green...${NC}"
docker-compose -f docker-compose.prod.yml up -d --scale backend=1

# Final health check
echo -e "${YELLOW}🏥 Final health check...${NC}"
sleep 5
if curl -f ${HEALTH_CHECK_URL} > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Production deployment successful!${NC}"
else
  echo -e "${RED}❌ Final health check failed${NC}"
  exit 1
fi

# Cleanup old images
echo -e "${YELLOW}🧹 Cleaning up old images...${NC}"
docker image prune -f

echo -e "${GREEN}✅ Production deployment complete!${NC}"

