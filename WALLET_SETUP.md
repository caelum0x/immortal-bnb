# ⚠️ WALLET PRIVATE KEY CONFIGURATION REQUIRED

## Issue
Your `WALLET_PRIVATE_KEY` in the `.env` file is currently set to a placeholder value.

## What You Need to Do

### Option 1: Use Your Existing Wallet (Recommended for Testing)
If you have a wallet (like MetaMask) that you want to use for testing:

1. **Export your private key from MetaMask:**
   - Open MetaMask
   - Click the account menu (3 dots)
   - Select "Account Details"
   - Click "Export Private Key"
   - Enter your MetaMask password
   - Copy the private key (it will be 64 hex characters)

2. **Update your .env file:**
   ```bash
   WALLET_PRIVATE_KEY=0x<your-64-character-private-key>
   ```

⚠️ **IMPORTANT**: Only use a TEST wallet with small amounts for development!

### Option 2: Create a New Test Wallet

Run this script to generate a new wallet:

```bash
node -e "const ethers = require('ethers'); const wallet = ethers.Wallet.createRandom(); console.log('Private Key:', wallet.privateKey); console.log('Address:', wallet.address);"
```

Then:
1. Copy the private key
2. Update your `.env` file:
   ```bash
   WALLET_PRIVATE_KEY=<generated-private-key>
   ```
3. Send some test BNB to the address for gas fees

### Option 3: Use OpenAI Swarm Agent Mode (No Wallet Required)

If you want to run in simulation mode without a real wallet:

1. Update your `.env` file:
   ```bash
   # Leave this as placeholder or empty
   WALLET_PRIVATE_KEY=
   
   # Enable swarm mode
   USE_SWARM_MODE=true
   ```

2. The bot will run in simulation mode using AI agents

## Verify Configuration

After updating your `.env` file, run:

```bash
node check-env.js
```

This will verify your configuration is correct.

## Security Reminders

- ⚠️ **NEVER** commit your `.env` file to git
- ⚠️ **NEVER** share your private key
- ⚠️ Only use TEST wallets with small amounts for development
- ⚠️ Keep your `.env` file secure

---

For more information, see the main [README.md](README.md) or [SETUP_GUIDE.md](SETUP_GUIDE.md)
