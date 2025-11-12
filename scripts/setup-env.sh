#!/bin/bash
# Environment Setup Script for Immortal AI Trading Bot

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🤖 Immortal AI Trading Bot - Environment Setup${NC}"
echo ""

# Check if .env already exists
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file already exists${NC}"
    read -p "Do you want to overwrite it? (yes/no): " -r
    if [[ ! $REPLY =~ ^yes$ ]]; then
        echo "Setup cancelled"
        exit 0
    fi
    mv .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✓ Existing .env backed up${NC}"
fi

# Create .env file
echo "📝 Creating .env file..."

cat > .env << 'ENVFILE'
# =============================================================================
# IMMORTAL AI TRADING BOT - ENVIRONMENT CONFIGURATION
# =============================================================================

# Network Configuration
IS_MAINNET=false
IS_OPBNB=false
TRADING_NETWORK=testnet
CHAIN_ID=97

# Wallet Configuration (REQUIRED)
PRIVATE_KEY=your_private_key_here
WALLET_ADDRESS=your_wallet_address_here

# BNB Greenfield Configuration (REQUIRED)
GREENFIELD_RPC_URL=https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org
GREENFIELD_CHAIN_ID=5600
GREENFIELD_BUCKET_NAME=immortal-trading-bot

# API Keys (REQUIRED)
OPENAI_API_KEY=your_openai_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Polymarket Configuration
POLYMARKET_PRIVATE_KEY=your_polymarket_private_key_here
POLYMARKET_PROXY_ADDRESS=your_polymarket_proxy_address_here
POLYGON_RPC_URL=https://polygon-rpc.com

# Trading Configuration
MAX_TRADE_AMOUNT=0.1
MIN_PROFIT_THRESHOLD=0.01
SLIPPAGE_TOLERANCE=0.5
GAS_PRICE_MULTIPLIER=1.1

# AI Configuration
AI_MODEL=gpt-4
AI_CONFIDENCE_THRESHOLD=0.7
USE_RAG=true

# API Server Configuration
API_PORT=3001
PYTHON_API_URL=http://localhost:5000
PYTHON_API_KEY=your_python_api_key_here

# Security Configuration
JWT_SECRET=your_jwt_secret_here_change_in_production
JWT_EXPIRES_IN=24h

# Monitoring Configuration
ENABLE_PROMETHEUS=true
ENABLE_TELEGRAM_ALERTS=false
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Database Configuration (if using)
DATABASE_URL=file:./data/bot.db

# Logging Configuration
LOG_LEVEL=info
LOG_TO_FILE=true

ENVFILE

echo -e "${GREEN}✓ .env file created${NC}"
echo ""

# Interactive configuration
echo -e "${BLUE}Let's configure your environment...${NC}"
echo ""

# Prompt for required fields
read -p "Enter your private key (or press Enter to skip): " PRIVATE_KEY
if [ ! -z "$PRIVATE_KEY" ]; then
    sed -i "s/PRIVATE_KEY=.*/PRIVATE_KEY=$PRIVATE_KEY/" .env
fi

read -p "Enter your wallet address (or press Enter to skip): " WALLET_ADDRESS
if [ ! -z "$WALLET_ADDRESS" ]; then
    sed -i "s/WALLET_ADDRESS=.*/WALLET_ADDRESS=$WALLET_ADDRESS/" .env
fi

read -p "Enter your OpenAI API key (or press Enter to skip): " OPENAI_KEY
if [ ! -z "$OPENAI_KEY" ]; then
    sed -i "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$OPENAI_KEY/" .env
fi

read -p "Are you deploying to mainnet? (yes/no, default: no): " IS_MAINNET_INPUT
if [[ $IS_MAINNET_INPUT =~ ^yes$ ]]; then
    sed -i "s/IS_MAINNET=.*/IS_MAINNET=true/" .env
    sed -i "s/TRADING_NETWORK=.*/TRADING_NETWORK=mainnet/" .env
    sed -i "s/CHAIN_ID=.*/CHAIN_ID=56/" .env
fi

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env

echo ""
echo -e "${GREEN}✅ Environment configured!${NC}"
echo ""
echo "Next steps:"
echo "  1. Review and update .env with your API keys"
echo "  2. Install dependencies: npm install"
echo "  3. Install Python dependencies: cd agents && pip install -r requirements.txt"
echo "  4. Run tests: npm test"
echo "  5. Start the bot: docker-compose up -d"
echo ""
echo -e "${YELLOW}⚠️  Important: Never commit your .env file to version control!${NC}"
