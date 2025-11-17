"""
Python CLOB Bridge - Exposes authenticated Polymarket CLOB client via HTTP API
This allows TypeScript backend to make authenticated CLOB calls via the Python client
"""

import os
import sys
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

# Add agents to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'agents'))

from agents.polymarket.polymarket import Polymarket

app = FastAPI(title="Polymarket CLOB Bridge")

# Initialize Polymarket client
polymarket_client = None

def get_client():
    global polymarket_client
    if polymarket_client is None:
        polymarket_client = Polymarket()
    return polymarket_client

# Pydantic models
class OrderRequest(BaseModel):
    token_id: str
    side: str  # 'BUY' or 'SELL'
    amount: float
    price: Optional[float] = None  # For limit orders

class BalanceResponse(BaseModel):
    usdc_balance: float
    address: str

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "polymarket-clob-bridge"}

@app.get("/balance", response_model=BalanceResponse)
async def get_balance():
    """Get USDC balance for wallet"""
    try:
        client = get_client()
        balance = client.get_balance()
        address = client.get_address_for_private_key()

        return {
            "usdc_balance": balance,
            "address": address
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/orders")
async def get_open_orders():
    """Get all open orders for the wallet"""
    try:
        client = get_client()
        orders = client.get_orders()

        # Transform to standardized format
        order_list = []
        for order in orders:
            order_list.append({
                "id": order.get("id"),
                "market_id": order.get("market"),
                "token_id": order.get("asset_id"),
                "side": order.get("side"),
                "price": float(order.get("price", 0)),
                "size": float(order.get("size", 0)),
                "status": order.get("status"),
                "timestamp": order.get("created_at")
            })

        return {"orders": order_list, "total": len(order_list)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/positions")
async def get_positions():
    """Get current positions"""
    try:
        client = get_client()
        positions = client.get_positions()

        # Transform to standardized format
        position_list = []
        for pos in positions:
            position_list.append({
                "token_id": pos.get("asset_id"),
                "market": pos.get("market"),
                "side": pos.get("side"),
                "size": float(pos.get("size", 0)),
                "value": float(pos.get("value", 0)),
                "entry_price": float(pos.get("entry_price", 0)),
                "current_price": float(pos.get("current_price", 0)),
                "pnl": float(pos.get("pnl", 0)),
            })

        return {"positions": position_list, "total": len(position_list)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/order/market")
async def place_market_order(order_request: OrderRequest):
    """Place a market order"""
    try:
        client = get_client()

        result = client.place_market_order(
            token_id=order_request.token_id,
            side=order_request.side,
            amount=order_request.amount
        )

        return {
            "success": True,
            "order_id": result.get("id"),
            "status": result.get("status"),
            "filled_amount": result.get("filled_amount")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/order/limit")
async def place_limit_order(order_request: OrderRequest):
    """Place a limit order"""
    try:
        if order_request.price is None:
            raise HTTPException(status_code=400, detail="Price is required for limit orders")

        client = get_client()

        result = client.place_limit_order(
            token_id=order_request.token_id,
            side=order_request.side,
            amount=order_request.amount,
            price=order_request.price
        )

        return {
            "success": True,
            "order_id": result.get("id"),
            "status": result.get("status")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/order/{order_id}")
async def cancel_order(order_id: str):
    """Cancel an order"""
    try:
        client = get_client()
        result = client.cancel_order(order_id)

        return {
            "success": True,
            "order_id": order_id,
            "status": "cancelled"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/markets/{token_id}/orderbook")
async def get_orderbook(token_id: str):
    """Get orderbook for a specific token"""
    try:
        client = get_client()
        orderbook = client.get_order_book(token_id)

        return {
            "token_id": token_id,
            "bids": orderbook.get("bids", []),
            "asks": orderbook.get("asks", []),
            "spread": orderbook.get("spread", 0)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("CLOB_BRIDGE_PORT", "8001"))
    uvicorn.run(app, host="0.0.0.0", port=port)
