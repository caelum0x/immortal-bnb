# Polymarket CLOB Client Integration

## Overview
The Polymarket CLOB (Central Limit Order Book) client has been added as a git submodule to enable prediction market trading capabilities.

## Repository
- **Source**: https://github.com/Polymarket/clob-client
- **Location**: `./clob-client/`
- **Version**: 4.22.8
- **License**: MIT

## Installation

The CLOB client is added as a submodule. To use it:

### Option 1: Install from npm (Recommended)
```bash
npm install @polymarket/clob-client
# or
yarn add @polymarket/clob-client
```

### Option 2: Build from submodule
```bash
cd clob-client
npm install
npm run build
cd ..
npm install ./clob-client
```

## Usage

### Basic Setup
```typescript
import { ClobClient } from '@polymarket/clob-client';

// Initialize the client
const client = new ClobClient({
  host: 'https://clob.polymarket.com',
  chainId: 137, // Polygon mainnet
  privateKey: process.env.WALLET_PRIVATE_KEY
});
```

### Key Features
1. **Order Management**: Create, cancel, and manage limit orders
2. **Market Data**: Access real-time market data and orderbook information
3. **Trade Execution**: Execute trades on Polymarket prediction markets
4. **Position Tracking**: Monitor open positions and balances

### Example: Get Market Info
```typescript
// Get market information
const market = await client.getMarket('marketId');
console.log('Market:', market);

// Get orderbook
const orderbook = await client.getOrderBook('marketId');
console.log('Bids:', orderbook.bids);
console.log('Asks:', orderbook.asks);
```

### Example: Place Order
```typescript
// Create a limit order
const order = {
  marketId: 'marketId',
  side: 'BUY', // or 'SELL'
  price: 0.50, // probability between 0 and 1
  size: 10, // amount in outcome tokens
  expiration: Math.floor(Date.now() / 1000) + 86400 // 24 hours
};

const signedOrder = await client.createOrder(order);
const orderId = await client.postOrder(signedOrder);
console.log('Order placed:', orderId);
```

### Example: Cancel Order
```typescript
await client.cancelOrder(orderId);
```

## Integration with Immortal AI Bot

### Potential Use Cases
1. **Prediction Market Trading**: Add AI-driven prediction market trading
2. **Multi-Protocol Strategy**: Combine DEX trading (PancakeSwap) with prediction markets (Polymarket)
3. **Sentiment Analysis**: Use AI to analyze events and place prediction market bets
4. **Cross-Platform Arbitrage**: Find arbitrage opportunities between DEXs and prediction markets

### Implementation Steps

1. **Install Package**
   ```bash
   npm install @polymarket/clob-client
   ```

2. **Create Polymarket Service**
   ```bash
   mkdir -p src/polymarket
   touch src/polymarket/polymarketClient.ts
   ```

3. **Add Configuration**
   Update `.env`:
   ```env
   POLYMARKET_ENABLED=false
   POLYMARKET_HOST=https://clob.polymarket.com
   POLYMARKET_CHAIN_ID=137
   ```

4. **Implement Service**
   Create service to handle Polymarket operations:
   - Market data fetching
   - Order creation and management
   - Position tracking
   - Event monitoring

5. **AI Integration**
   Extend AI agent to analyze prediction market opportunities:
   - Event analysis
   - Probability assessment
   - Risk management
   - Position sizing

## Git Submodule Management

### Clone with submodules
```bash
git clone --recurse-submodules <repository-url>
```

### Update submodule
```bash
git submodule update --remote clob-client
```

### Pull updates for collaborators
```bash
git pull
git submodule update --init --recursive
```

## Network Requirements
- **Polygon (MATIC)**: Polymarket runs on Polygon network
- **Wallet**: Same wallet can be used for both BNB Chain and Polygon
- **Tokens**: USDC is the primary token for trading on Polymarket

## Documentation
- [Polymarket Docs](https://docs.polymarket.com/)
- [CLOB API Docs](https://docs.polymarket.com/#clob-api)
- [Examples](./clob-client/examples/)

## Next Steps
1. Install the package: `npm install @polymarket/clob-client`
2. Review examples in `./clob-client/examples/`
3. Decide on integration approach (separate service or unified AI trading)
4. Implement Polymarket service module
5. Add AI decision-making for prediction markets
6. Test in demo mode before live trading

## Notes
- Polymarket uses Polygon network (not BNB Chain)
- Requires separate network configuration and gas token (MATIC)
- Trading requires USDC on Polygon
- Consider multi-chain wallet management
