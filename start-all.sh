#!/bin/bash

# Immortal AI Trading Bot - Unified Startup Script
# Starts backend (API + all services) and frontend together

set -e

echo "=================================================="
echo "🚀 Starting Immortal AI Trading Bot"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo -e "${YELLOW}⚠️  Bun is not installed. Please install it first:${NC}"
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Check if required dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
    bun install
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    cd frontend && bun install && cd ..
fi

# Create logs directory
mkdir -p logs

# Clear ports before starting
echo -e "${BLUE}🧹 Clearing ports...${NC}"
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
pkill -f "bun.*index" 2>/dev/null || true
pkill -f "node.*index" 2>/dev/null || true
sleep 2
echo -e "${GREEN}✅ Ports cleared${NC}"
echo ""

echo -e "${BLUE}🔧 Starting services...${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down services...${NC}"
    pkill -P $$ || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Backend API Server (Port 3001)
# This includes:
# - AI Orchestrator
# - Order Monitoring Service
# - Price Feed Service
# - Risk Management Service
# - Analytics Service
# - WebSocket Manager
# - Polymarket Services
# - All integrated services
echo -e "${GREEN}✅ Starting Backend API Server (Port 3001)${NC}"
echo "   - AI Orchestrator"
echo "   - Order Monitoring Service"
echo "   - Price Feed Service"
echo "   - Risk Management Service"
echo "   - Analytics Service"
echo "   - WebSocket Manager"
echo "   - Polymarket Services"
echo ""

bun run src/index.ts > logs/backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${YELLOW}❌ Backend failed to start. Check logs/backend.log${NC}"
    tail -20 logs/backend.log
    exit 1
fi

# Test backend health
for i in {1..10}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend API Server is ready!${NC}"
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "${YELLOW}⚠️  Backend is slow to respond, continuing anyway...${NC}"
    fi
    sleep 1
done

echo ""

# Start Frontend Next.js App (Port 3000)
echo -e "${GREEN}✅ Starting Frontend Dashboard (Port 3000)${NC}"
echo ""

cd frontend && bun run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo "⏳ Waiting for frontend to initialize..."
sleep 3

echo ""
echo "=================================================="
echo -e "${GREEN}🎉 All Services Started Successfully!${NC}"
echo "=================================================="
echo ""
echo "📊 Access Points:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:3001"
echo "   WebSocket: ws://localhost:3001/ws"
echo "   Health:    http://localhost:3001/health"
echo ""
echo "📝 Logs:"
echo "   Backend:   tail -f logs/backend.log"
echo "   Frontend:  tail -f logs/frontend.log"
echo ""
echo "🛑 To stop: Press Ctrl+C"
echo ""

# Keep script running and monitor processes
while true; do
    # Check if backend is still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${YELLOW}❌ Backend crashed! Check logs/backend.log${NC}"
        cleanup
    fi
    
    # Check if frontend is still running
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${YELLOW}❌ Frontend crashed! Check logs/frontend.log${NC}"
        cleanup
    fi
    
    sleep 2
done

