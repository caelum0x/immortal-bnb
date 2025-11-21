#!/bin/bash

# Start Backend Server Script
# Clears ports and starts the backend cleanly

echo "🔧 Preparing to start backend server..."

# Kill any existing processes on port 3001
echo "Clearing port 3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null
pkill -f "bun.*index" 2>/dev/null
pkill -f "node.*index" 2>/dev/null
sleep 2

# Check if port is free
if lsof -ti:3001 >/dev/null 2>&1; then
  echo "❌ Port 3001 is still in use. Please manually kill the process."
  exit 1
fi

echo "✅ Port 3001 is free"
echo ""
echo "🚀 Starting backend server..."
echo "   Backend will run on: http://localhost:3001"
echo "   WebSocket: ws://localhost:3001/ws"
echo ""

# Start the backend
bun run src/index.ts

