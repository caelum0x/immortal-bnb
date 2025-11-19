# Polymarket Smart Contract Wallet Integration

This document explains how the Immortal AI Trading Bot integrates with Polymarket's smart contract wallet system.

## Overview

The Polymarket examples repository has been added as a git submodule at `polymarket-examples/`. This provides reference implementations for interacting with Polymarket's smart contract wallets.

## Smart Contract Wallet Types

Polymarket uses two types of smart contract wallets:

### 1. Polymarket Proxy Wallet

**Purpose**: Used with Magic/email accounts for seamless onboarding

**Key Features**:
- Developed internally at Polymarket
- Associated with a specific email account
- Only the address linked to the email can execute functions
- Simplified user experience (no manual wallet setup)

**Use Cases**:
- Email-based authentication
- Users without browser wallets
- Simplified onboarding flow

**Integration in Immortal Bot**:
```typescript
// src/polymarket/proxyWalletClient.ts
import { ProxyWallet } from '../polymarket-examples/src/utils';

export class ProxyWalletClient {
  private wallet: ProxyWallet;

  async initialize(email: string, privateKey: string) {
    // Initialize Polymarket Proxy wallet
    this.wallet = new ProxyWallet(email, privateKey);
  }

  async placeBet(marketId: string, outcome: string, amount: number) {
    // Place bet using Proxy wallet
    return this.wallet.placeBet(marketId, outcome, amount);
  }
}
```

### 2. Polymarket Safes (Modified Gnosis Safe)

**Purpose**: Used with browser wallets (MetaMask, Rainbow, Coinbase Wallet, etc.)

**Key Features**:
- Modified Gnosis Safe implementation
- Multisig configuration with 1 signer (single-owner setup)
- Compatible with standard browser wallets
- Higher security for power users

**Use Cases**:
- Browser wallet integration (MetaMask, etc.)
- Advanced users who prefer self-custody
- Multi-device access with same wallet

**Integration in Immortal Bot**:
```typescript
// src/polymarket/safeWalletClient.ts
import { SafeWallet } from '../polymarket-examples/src/utils';

export class SafeWalletClient {
  private safe: SafeWallet;

  async initialize(walletAddress: string, privateKey: string) {
    // Initialize Polymarket Safe
    this.safe = new SafeWallet(walletAddress, privateKey);
  }

  async placeBet(marketId: string, outcome: string, amount: number) {
    // Place bet using Safe wallet
    return this.safe.placeBet(marketId, outcome, amount);
  }
}
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│           Immortal AI Trading Bot                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────────┐         ┌──────────────────┐   │
│  │   DEX Trading │         │ Polymarket Trading│   │
│  │   (BNB Chain) │         │    (Polygon)      │   │
│  └───────────────┘         └──────────────────┘   │
│         │                           │              │
│         │                           │              │
│         │                    ┌──────▼─────────┐   │
│         │                    │  Wallet Manager│   │
│         │                    └──────┬─────────┘   │
│         │                           │              │
│         │                  ┌────────▼────────────┐│
│         │                  │  Wallet Type Router ││
│         │                  └────────┬────────────┘│
│         │                           │              │
│         │         ┌─────────────────┴──────────┐  │
│         │         │                            │  │
│         │  ┌──────▼────────┐         ┌────────▼───────┐
│         │  │  Proxy Wallet │         │  Safe Wallet   │
│         │  │  (Email-based)│         │  (Browser)     │
│         │  └───────────────┘         └────────────────┘
│         │         │                            │       │
└─────────┼─────────┼────────────────────────────┼───────┘
          │         │                            │
          │         └────────────┬───────────────┘
          │                      │
          │                      ▼
          │         ┌─────────────────────────┐
          │         │   Polymarket CLOB API   │
          │         │   (Order Book Trading)  │
          │         └─────────────────────────┘
          │
          ▼
┌─────────────────────┐
│  PancakeSwap DEX    │
│  (BNB Chain)        │
└─────────────────────┘
```

## Configuration

### Environment Variables

Add to `.env`:

```bash
# Polymarket Wallet Configuration
POLYMARKET_WALLET_TYPE=proxy  # or 'safe'

# For Proxy Wallet (Email-based)
POLYMARKET_EMAIL=your-email@example.com
POLYMARKET_PROXY_PRIVATE_KEY=your-private-key

# For Safe Wallet (Browser wallet)
POLYMARKET_SAFE_ADDRESS=0x...
POLYMARKET_SAFE_PRIVATE_KEY=your-private-key

# Polymarket API
POLYMARKET_API_KEY=your-api-key
POLYMARKET_CHAIN_ID=137  # Polygon mainnet
```

## Implementation

### Unified Wallet Manager

```typescript
// src/polymarket/unifiedWalletManager.ts

import { ProxyWalletClient } from './proxyWalletClient';
import { SafeWalletClient } from './safeWalletClient';
import { CONFIG } from '../config';

export class UnifiedPolymarketWallet {
  private client: ProxyWalletClient | SafeWalletClient;

  constructor() {
    if (CONFIG.POLYMARKET_WALLET_TYPE === 'proxy') {
      this.client = new ProxyWalletClient();
      this.client.initialize(
        CONFIG.POLYMARKET_EMAIL,
        CONFIG.POLYMARKET_PROXY_PRIVATE_KEY
      );
    } else {
      this.client = new SafeWalletClient();
      this.client.initialize(
        CONFIG.POLYMARKET_SAFE_ADDRESS,
        CONFIG.POLYMARKET_SAFE_PRIVATE_KEY
      );
    }
  }

  async placeBet(marketId: string, outcome: string, amount: number) {
    return this.client.placeBet(marketId, outcome, amount);
  }

  async getBalance() {
    return this.client.getBalance();
  }

  async getPositions() {
    return this.client.getPositions();
  }
}
```

### API Integration

```typescript
// src/api/server.ts

// Add endpoint to switch wallet types
app.post('/api/polymarket/wallet/configure', async (req, res) => {
  try {
    const { walletType, credentials } = req.body;

    if (walletType === 'proxy') {
      // Configure Proxy wallet
      const { email, privateKey } = credentials;
      await polymarketService.configureProxyWallet(email, privateKey);
    } else if (walletType === 'safe') {
      // Configure Safe wallet
      const { address, privateKey } = credentials;
      await polymarketService.configureSafeWallet(address, privateKey);
    }

    res.json({
      success: true,
      walletType,
      message: 'Wallet configured successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to configure wallet' });
  }
});
```

## Examples from Submodule

The `polymarket-examples/` submodule contains reference implementations:

### Example 1: Placing Orders
```typescript
// See: polymarket-examples/examples/placeOrder.ts
import { placeOrder } from '../polymarket-examples/src/examples';

await placeOrder({
  marketId: 'market-id',
  side: 'BUY',
  outcome: 'YES',
  amount: 100,
  price: 0.65,
});
```

### Example 2: Market Data
```typescript
// See: polymarket-examples/examples/getMarketData.ts
import { getMarketData } from '../polymarket-examples/src/examples';

const market = await getMarketData('market-id');
console.log('Current odds:', market.outcomes);
```

### Example 3: Cancel Orders
```typescript
// See: polymarket-examples/examples/cancelOrder.ts
import { cancelOrder } from '../polymarket-examples/src/examples';

await cancelOrder('order-id');
```

## Security Considerations

### Private Key Management
- **Never commit private keys** to version control
- Use environment variables or secure key management systems
- Rotate keys regularly
- Use different keys for testnet and mainnet

### Proxy Wallet Security
- Email account must be secured with 2FA
- Private key should be encrypted at rest
- Consider using hardware wallets for key generation

### Safe Wallet Security
- Single-signer setup reduces complexity but increases risk
- Consider upgrading to multi-sig for larger amounts
- Use hardware wallets when possible
- Monitor transactions regularly

## Testing

### Testnet Configuration

```bash
# Mumbai testnet (Polygon testnet)
POLYMARKET_CHAIN_ID=80001
POLYMARKET_RPC_URL=https://rpc-mumbai.maticvigil.com
```

### Test Flow

1. **Initialize wallet** (Proxy or Safe)
2. **Get test USDC** from faucet
3. **Place test bet** on demo market
4. **Monitor position** and settlement
5. **Withdraw funds** after testing

## Frontend Integration

### Wallet Selection UI

```typescript
// frontend/components/PolymarketWalletSelector.tsx

export default function PolymarketWalletSelector() {
  const [walletType, setWalletType] = useState<'proxy' | 'safe'>('proxy');

  return (
    <div>
      <h3>Select Polymarket Wallet Type</h3>

      <button onClick={() => setWalletType('proxy')}>
        📧 Email Wallet (Proxy)
        <p>Simple, email-based access</p>
      </button>

      <button onClick={() => setWalletType('safe')}>
        🦊 Browser Wallet (Safe)
        <p>MetaMask, Rainbow, Coinbase Wallet</p>
      </button>
    </div>
  );
}
```

## Mobile Integration

### React Native Support

```typescript
// mobile/src/services/polymarketWallet.ts

export class PolymarketWalletService {
  async connectProxyWallet(email: string) {
    // Connect using email-based Proxy wallet
    const response = await fetch(`${API_URL}/polymarket/wallet/configure`, {
      method: 'POST',
      body: JSON.stringify({
        walletType: 'proxy',
        credentials: { email },
      }),
    });
    return response.json();
  }

  async connectBrowserWallet(address: string) {
    // Connect using Safe wallet with WalletConnect
    const response = await fetch(`${API_URL}/polymarket/wallet/configure`, {
      method: 'POST',
      body: JSON.stringify({
        walletType: 'safe',
        credentials: { address },
      }),
    });
    return response.json();
  }
}
```

## Resources

- **Polymarket Examples Repo**: `./polymarket-examples/`
- **Polymarket Docs**: https://docs.polymarket.com
- **CLOB API Docs**: https://docs.polymarket.com/#clob-api
- **Gnosis Safe Docs**: https://docs.safe.global

## Support

For issues related to:
- **Proxy Wallets**: Contact Polymarket support
- **Safe Wallets**: Check Gnosis Safe documentation
- **Integration**: Open issue in this repository

## Next Steps

1. Review examples in `polymarket-examples/examples/`
2. Implement `ProxyWalletClient` class
3. Implement `SafeWalletClient` class
4. Create unified wallet manager
5. Add frontend wallet selector
6. Test on Mumbai testnet
7. Deploy to production

---

**Note**: This integration leverages Polymarket's official examples submodule for reliable and up-to-date implementations.
