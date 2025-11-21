#!/bin/bash

# Immortal AI Trading Bot - Node.js Startup Script
# Uses Node.js instead of Bun to avoid ethers v6 compatibility issues

set -e

echo "=================================================="
echo "🚀 Starting Immortal AI Trading Bot (Node.js)"
echo "=================================================="
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it first."
    exit 1
fi

# Check if required dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Create logs directory
mkdir -p logs

echo "🔧 Starting services..."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    pkill -P $$ || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Backend API Server (Port 3001) with Node.js
echo "✅ Starting Backend API Server (Port 3001) with Node.js"
echo "   - AI Orchestrator"
echo "   - Order Monitoring Service"
echo "   - Price Feed Service"
echo "   - Risk Management Service"
echo "   - Analytics Service"
echo "   - WebSocket Manager"
echo "   - Polymarket Services"
echo ""

# Use tsx to run TypeScript (Node.js compatible)
echo "   Using Node.js + tsx for backend (avoids Bun/ethers v6 issue)"
tsx src/index.ts > logs/backend.log 2>&1 &

BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend failed to start. Check logs/backend.log"
    tail -20 logs/backend.log
    exit 1
fi

# Test backend health
for i in {1..10}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Backend API Server is ready!"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "⚠️  Backend is slow to respond, continuing anyway..."
    fi
    sleep 1
done

echo ""

# Start Frontend Next.js App (Port 3000)
echo "✅ Starting Frontend Dashboard (Port 3000)"
echo ""

cd frontend && npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo "⏳ Waiting for frontend to initialize..."
sleep 3

echo ""
echo "=================================================="
echo "🎉 All Services Started Successfully!"
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
        echo "❌ Backend crashed! Check logs/backend.log"
        cleanup
    fi
    
    # Check if frontend is still running
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "❌ Frontend crashed! Check logs/frontend.log"
        cleanup
    fi
    
    sleep 2
done

