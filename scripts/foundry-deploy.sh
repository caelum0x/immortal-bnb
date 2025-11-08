#!/bin/bash

# Foundry Contract Deployment Script
# Deploys IMMBotToken and Staking contracts to BSC Testnet using Foundry

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Foundry Contract Deployment Script${NC}"
echo "========================================"
echo ""

# Check if Foundry is installed
if ! command -v forge &> /dev/null; then
    echo -e "${RED}❌ Foundry not installed${NC}"
    echo ""
    echo "Install Foundry:"
    echo "  curl -L https://foundry.paradigm.xyz | bash"
    echo "  foundryup"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Foundry detected${NC}"
forge --version
echo ""

# Load environment variables
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo "Please create .env file with WALLET_PRIVATE_KEY"
    exit 1
fi

source .env

# Validate private key
if [ -z "$WALLET_PRIVATE_KEY" ] || [ "$WALLET_PRIVATE_KEY" = "your-private-key-here" ]; then
    echo -e "${RED}❌ WALLET_PRIVATE_KEY not set in .env${NC}"
    echo ""
    echo "Steps to set up:"
    echo "1. Create a new wallet in MetaMask"
    echo "2. Export the private key (Settings → Security & Privacy → Show Private Key)"
    echo "3. Add to .env: WALLET_PRIVATE_KEY=0x..."
    echo "4. Get testnet BNB from: https://testnet.bnbchain.org/faucet-smart"
    echo ""
    exit 1
fi

# Network configuration
RPC_URL="https://data-seed-prebsc-1-s1.binance.org:8545/"
CHAIN_ID=97

echo -e "${BLUE}📡 Network: BSC Testnet (Chain ID: $CHAIN_ID)${NC}"
echo -e "${BLUE}🔗 RPC: $RPC_URL${NC}"
echo ""

# Get deployer address
DEPLOYER=$(cast wallet address --private-key $WALLET_PRIVATE_KEY)
echo -e "${GREEN}📬 Deployer: $DEPLOYER${NC}"

# Check balance
BALANCE=$(cast balance $DEPLOYER --rpc-url $RPC_URL)
BALANCE_ETH=$(cast --to-unit $BALANCE ether)
echo -e "${GREEN}💰 Balance: $BALANCE_ETH BNB${NC}"
echo ""

# Validate balance
if (( $(echo "$BALANCE_ETH < 0.05" | bc -l) )); then
    echo -e "${RED}❌ Insufficient balance${NC}"
    echo "You need at least 0.05 tBNB for deployment"
    echo "Get free tBNB: https://testnet.bnbchain.org/faucet-smart"
    echo ""
    exit 1
fi

# Confirmation
echo -e "${YELLOW}⚠️  Ready to deploy contracts${NC}"
echo ""
echo "This will:"
echo "  1. Deploy IMMBotToken contract"
echo "  2. Deploy Staking contract"
echo "  3. Link token to staking contract"
echo "  4. Save addresses to deployment.json"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo -e "${BLUE}📝 Step 1: Deploying IMMBotToken...${NC}"

# Deploy IMMBotToken
TOKEN_ADDRESS=$(forge create contracts/IMMBotToken.sol:IMMBotToken \
    --rpc-url $RPC_URL \
    --private-key $WALLET_PRIVATE_KEY \
    --json | jq -r '.deployedTo')

if [ -z "$TOKEN_ADDRESS" ] || [ "$TOKEN_ADDRESS" = "null" ]; then
    echo -e "${RED}❌ Failed to deploy IMMBotToken${NC}"
    exit 1
fi

echo -e "${GREEN}✅ IMMBotToken deployed: $TOKEN_ADDRESS${NC}"
echo ""

# Wait for confirmation
sleep 5

echo -e "${BLUE}📝 Step 2: Deploying Staking contract...${NC}"

# Deploy Staking with token address as constructor argument
STAKING_ADDRESS=$(forge create contracts/Staking.sol:Staking \
    --rpc-url $RPC_URL \
    --private-key $WALLET_PRIVATE_KEY \
    --constructor-args $TOKEN_ADDRESS \
    --json | jq -r '.deployedTo')

if [ -z "$STAKING_ADDRESS" ] || [ "$STAKING_ADDRESS" = "null" ]; then
    echo -e "${RED}❌ Failed to deploy Staking contract${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Staking deployed: $STAKING_ADDRESS${NC}"
echo ""

# Wait for confirmation
sleep 5

echo -e "${BLUE}📝 Step 3: Linking token to staking contract...${NC}"

# Call setStakingContract on token
cast send $TOKEN_ADDRESS \
    "setStakingContract(address)" \
    $STAKING_ADDRESS \
    --rpc-url $RPC_URL \
    --private-key $WALLET_PRIVATE_KEY \
    --gas-limit 100000

echo -e "${GREEN}✅ Token linked to staking contract${NC}"
echo ""

# Save deployment info
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
cat > deployment.json <<EOF
{
  "network": "BSC Testnet",
  "chainId": $CHAIN_ID,
  "deployer": "$DEPLOYER",
  "timestamp": "$TIMESTAMP",
  "contracts": {
    "IMMBotToken": "$TOKEN_ADDRESS",
    "Staking": "$STAKING_ADDRESS"
  },
  "verification": {
    "token": "https://testnet.bscscan.com/address/$TOKEN_ADDRESS",
    "staking": "https://testnet.bscscan.com/address/$STAKING_ADDRESS"
  }
}
EOF

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "========================================"
echo -e "${BLUE}📋 Deployment Summary${NC}"
echo "========================================"
echo ""
echo -e "Network:      ${GREEN}BSC Testnet (Chain ID: $CHAIN_ID)${NC}"
echo -e "Deployer:     ${GREEN}$DEPLOYER${NC}"
echo -e "Timestamp:    ${GREEN}$TIMESTAMP${NC}"
echo ""
echo -e "${YELLOW}📄 Contract Addresses:${NC}"
echo ""
echo -e "IMMBotToken:  ${GREEN}$TOKEN_ADDRESS${NC}"
echo -e "Staking:      ${GREEN}$STAKING_ADDRESS${NC}"
echo ""
echo -e "${BLUE}🔍 Verify on BscScan:${NC}"
echo "  Token:   https://testnet.bscscan.com/address/$TOKEN_ADDRESS"
echo "  Staking: https://testnet.bscscan.com/address/$STAKING_ADDRESS"
echo ""
echo "========================================"
echo -e "${YELLOW}⚠️  NEXT STEPS:${NC}"
echo "========================================"
echo ""
echo "1. Update .env file:"
echo ""
echo "   IMMBOT_TOKEN_ADDRESS=$TOKEN_ADDRESS"
echo "   STAKING_CONTRACT_ADDRESS=$STAKING_ADDRESS"
echo ""
echo "2. Update apps/frontend/.env.local:"
echo ""
echo "   NEXT_PUBLIC_IMMBOT_TOKEN_TESTNET=$TOKEN_ADDRESS"
echo "   NEXT_PUBLIC_STAKING_TESTNET=$STAKING_ADDRESS"
echo ""
echo "3. Restart services:"
echo ""
echo "   # Backend"
echo "   bun run dev"
echo ""
echo "   # Frontend"
echo "   cd apps/frontend && npm run dev"
echo ""
echo "4. Test staking at http://localhost:3000"
echo ""
echo -e "${GREEN}🎉 Deployment saved to deployment.json${NC}"
echo ""
