# Polymarket CLOB Bridge Setup

This document explains how to set up and use the Python CLOB Bridge for authenticated Polymarket trading.

## Overview

The CLOB Bridge is a Python FastAPI service that wraps the official Polymarket Python client (`py-clob-client`) and exposes authenticated CLOB endpoints via HTTP. This allows the TypeScript backend to make authenticated calls to Polymarket's Central Limit Order Book (CLOB) for:

- Fetching wallet USDC balance
- Getting open orders
- Viewing active positions
- Placing market/limit orders
- Canceling orders
- Retrieving orderbook data

## Architecture

```
TypeScript Backend (src/api-server.ts)
         ↓
TypeScript CLOB Client (src/services/clobClient.ts)
         ↓ HTTP (localhost:8001)
Python CLOB Bridge (src/services/clobBridge.py)
         ↓
Official py-clob-client
         ↓ Authenticated API
Polymarket CLOB (clob.polymarket.com)
```

## Prerequisites

1. **Python 3.9+** with virtual environment
2. **Polygon wallet** with USDC
3. **Environment variables** configured

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd agents/
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install Polymarket client and dependencies
pip install -r requirements.txt
pip install fastapi uvicorn
```

### 2. Configure Environment Variables

Create or update `.env` file in project root:

```bash
# Polygon Wallet (REQUIRED for CLOB access)
POLYGON_WALLET_PRIVATE_KEY=your_private_key_here
POLYGON_WALLET_ADDRESS=your_wallet_address_here

# Optional: Custom RPC
POLYGON_RPC_URL=https://polygon-rpc.com

# CLOB Bridge Port (default: 8001)
CLOB_BRIDGE_PORT=8001
```

**⚠️ SECURITY WARNING:**
- Never commit your private key to git
- Use environment variables or secure key management
- For production, use HSM or hardware wallet

### 3. Start the CLOB Bridge

```bash
# From project root
python src/services/clobBridge.py
```

You should see:
```
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8001
```

### 4. Verify Bridge is Running

```bash
# Health check
curl http://localhost:8001/health

# Should return:
# {"status":"ok","service":"polymarket-clob-bridge"}
```

### 5. Start TypeScript Backend

In a new terminal:

```bash
npm run dev
# or
npm start
```

The backend will automatically detect the CLOB bridge and use it for authenticated endpoints.

## API Endpoints

### CLOB Bridge (Python - Port 8001)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/balance` | GET | Get wallet USDC balance |
| `/orders` | GET | Get open orders |
| `/positions` | GET | Get active positions |
| `/order/market` | POST | Place market order |
| `/order/limit` | POST | Place limit order |
| `/order/{id}` | DELETE | Cancel order |
| `/markets/{token_id}/orderbook` | GET | Get orderbook |

### TypeScript Backend (Port 3001)

These endpoints now use the CLOB bridge when available:

| Endpoint | Description | Fallback |
|----------|-------------|----------|
| `GET /api/polymarket/orders` | Active orders | Returns empty with note |
| `GET /api/polymarket/positions` | Open positions | Calculated from trades |
| `GET /api/polymarket/balance` | USDC balance | Polygon RPC query |

## Usage Examples

### Get Balance

```bash
curl http://localhost:3001/api/polymarket/balance
```

Response:
```json
{
  "usdc": 1250.50,
  "usdcLocked": 150.00,
  "totalValue": 1400.50,
  "address": "0x..."
}
```

### Get Open Orders

```bash
curl http://localhost:3001/api/polymarket/orders
```

Response:
```json
{
  "orders": [
    {
      "id": "0x...",
      "marketId": "market_123",
      "market": "Will BTC reach $100k?",
      "side": "buy",
      "price": 0.65,
      "size": 100,
      "status": "open",
      "timestamp": 1699564800000
    }
  ],
  "total": 1,
  "bridgeAvailable": true
}
```

### Get Positions

```bash
curl http://localhost:3001/api/polymarket/positions
```

Response:
```json
{
  "positions": [
    {
      "marketId": "token_123",
      "market": "Will BTC reach $100k?",
      "side": "yes",
      "shares": 150,
      "avgPrice": 0.60,
      "currentPrice": 0.70,
      "pnl": 15.00,
      "roi": 16.67
    }
  ],
  "total": 1,
  "source": "clob_bridge",
  "bridgeAvailable": true
}
```

## How It Works

### 1. Bridge Availability Detection

When the TypeScript backend starts, `clobClient` checks if the Python bridge is running:

```typescript
// src/services/clobClient.ts
private async checkBridgeAvailability(): Promise<void> {
  try {
    const response = await fetch(`${this.baseUrl}/health`);
    this.bridgeAvailable = response.ok;
  } catch (error) {
    this.bridgeAvailable = false;
  }
}
```

### 2. Authenticated API Calls

The Python bridge initializes the Polymarket client with your wallet:

```python
# src/services/clobBridge.py
from agents.polymarket.polymarket import Polymarket

polymarket_client = Polymarket()  # Uses POLYGON_WALLET_PRIVATE_KEY from env
```

### 3. Smart Fallbacks

If the bridge is not available, endpoints return helpful error messages:

```json
{
  "orders": [],
  "total": 0,
  "note": "CLOB Bridge not running. Start it with: python src/services/clobBridge.py",
  "bridgeAvailable": false
}
```

## Trading Operations

### Place Market Order

```bash
curl -X POST http://localhost:8001/order/market \
  -H "Content-Type: application/json" \
  -d '{
    "token_id": "123456",
    "side": "BUY",
    "amount": 100.0
  }'
```

### Place Limit Order

```bash
curl -X POST http://localhost:8001/order/limit \
  -H "Content-Type: application/json" \
  -d '{
    "token_id": "123456",
    "side": "SELL",
    "amount": 50.0,
    "price": 0.75
  }'
```

### Cancel Order

```bash
curl -X DELETE http://localhost:8001/order/0xOrderId
```

## Troubleshooting

### Bridge Not Available

**Symptom:** `bridgeAvailable: false` in API responses

**Solutions:**
1. Check Python bridge is running: `ps aux | grep clobBridge`
2. Verify port 8001 is not in use: `lsof -i :8001`
3. Check bridge logs for errors
4. Restart bridge: `python src/services/clobBridge.py`

### Wallet Not Configured

**Symptom:** `"note": "Wallet not configured"`

**Solutions:**
1. Set `POLYGON_WALLET_PRIVATE_KEY` in `.env`
2. Set `POLYGON_WALLET_ADDRESS` in `.env`
3. Restart both Python bridge and TypeScript backend

### Authentication Errors

**Symptom:** 401 Unauthorized from CLOB API

**Solutions:**
1. Verify private key is correct
2. Check wallet has USDC balance
3. Ensure wallet is not rate limited by Polymarket
4. Check network connectivity to clob.polymarket.com

### Python Dependencies Missing

**Symptom:** `ModuleNotFoundError: No module named 'py_clob_client'`

**Solutions:**
```bash
cd agents/
source .venv/bin/activate
pip install -r requirements.txt
```

## Production Deployment

### Using Docker

```dockerfile
# Dockerfile for CLOB Bridge
FROM python:3.9-slim

WORKDIR /app

COPY agents/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install fastapi uvicorn

COPY src/services/clobBridge.py .
COPY agents/ ./agents/

CMD ["python", "clobBridge.py"]
```

Build and run:
```bash
docker build -t polymarket-clob-bridge -f Dockerfile.clob .
docker run -d \
  -p 8001:8001 \
  -e POLYGON_WALLET_PRIVATE_KEY=$POLYGON_WALLET_PRIVATE_KEY \
  -e POLYGON_WALLET_ADDRESS=$POLYGON_WALLET_ADDRESS \
  polymarket-clob-bridge
```

### Using systemd (Linux)

```ini
[Unit]
Description=Polymarket CLOB Bridge
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/immortal-bnb
Environment="POLYGON_WALLET_PRIVATE_KEY=..."
Environment="POLYGON_WALLET_ADDRESS=..."
ExecStart=/path/to/venv/bin/python src/services/clobBridge.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable polymarket-clob-bridge
sudo systemctl start polymarket-clob-bridge
sudo systemctl status polymarket-clob-bridge
```

## Security Best Practices

1. **Never expose bridge publicly** - Only bind to localhost
2. **Use environment variables** - Never hardcode private keys
3. **Enable HTTPS** - In production, use reverse proxy with SSL
4. **Rate limiting** - Implement rate limiting on bridge endpoints
5. **API authentication** - Add API key auth between TypeScript and Python bridge
6. **Monitoring** - Log all trading operations for audit trail
7. **Hot wallet isolation** - Use separate wallet for bot trading
8. **Transaction limits** - Set max trade amounts in code

## Development

### Running Tests

```bash
# Test Python bridge
curl http://localhost:8001/health
curl http://localhost:8001/balance

# Test TypeScript integration
curl http://localhost:3001/api/polymarket/orders
curl http://localhost:3001/api/polymarket/positions
```

### Debugging

Enable debug logging:

```python
# src/services/clobBridge.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

```typescript
// src/services/clobClient.ts
logger.setLevel('debug');
```

## Additional Resources

- [Polymarket Python Client Docs](https://github.com/Polymarket/py-clob-client)
- [Polymarket API Documentation](https://docs.polymarket.com/)
- [CLOB API Reference](https://docs.polymarket.com/api-reference)
- [Polygon Network](https://polygon.technology/)
