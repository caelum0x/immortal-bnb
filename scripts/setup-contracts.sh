#!/bin/bash
# Setup script for smart contract development and deployment

echo "🔧 Setting up smart contract environment..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo ""

# Install Hardhat and dependencies
echo "📦 Installing Hardhat and dependencies..."
npm install --save-dev \
  hardhat \
  @nomicfoundation/hardhat-toolbox \
  @nomicfoundation/hardhat-verify \
  @openzeppelin/contracts \
  @typechain/ethers-v6 \
  @typechain/hardhat \
  typechain \
  @types/node

echo ""
echo "✅ Hardhat setup complete!"
echo ""

# Display next steps
echo "📝 Next Steps:"
echo ""
echo "1. Ensure .env file has required variables:"
echo "   - WALLET_PRIVATE_KEY (your deployer wallet private key)"
echo "   - BSC_TESTNET_RPC (optional, defaults to public RPC)"
echo "   - BSCSCAN_API_KEY (for contract verification)"
echo ""
echo "2. Compile contracts:"
echo "   npx hardhat compile"
echo ""
echo "3. Deploy token to testnet:"
echo "   npx hardhat run scripts/deploy-token.ts --network bscTestnet"
echo ""
echo "4. Deploy staking contract:"
echo "   npx hardhat run scripts/deploy-staking.ts --network bscTestnet"
echo ""
echo "5. Verify contracts on BscScan:"
echo "   npx hardhat verify --network bscTestnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>"
echo ""
