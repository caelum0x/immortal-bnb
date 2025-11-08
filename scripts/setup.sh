#!/bin/bash
# Comprehensive Setup Script for Immortal AI Trading Bot
# Sets up development environment with all dependencies

set -e  # Exit on error

echo "🤖 Immortal AI Trading Bot - Development Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Print colored message
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Step 1: Check system requirements
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Checking System Requirements"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for Bun
if command_exists bun; then
    BUN_VERSION=$(bun --version)
    print_success "Bun installed (version $BUN_VERSION)"
else
    print_warning "Bun not found - Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
    if command_exists bun; then
        print_success "Bun installed successfully"
    else
        print_error "Failed to install Bun. Please install manually: https://bun.sh"
        exit 1
    fi
fi

# Check for Node.js (fallback)
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js installed ($NODE_VERSION)"
else
    print_warning "Node.js not found (optional - Bun can be used instead)"
fi

# Check for Git
if command_exists git; then
    GIT_VERSION=$(git --version)
    print_success "Git installed"
else
    print_error "Git not found. Please install Git first."
    exit 1
fi

echo ""

# Step 2: Install backend dependencies
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Installing Backend Dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_info "Installing backend packages..."
bun install

if [ $? -eq 0 ]; then
    print_success "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi

echo ""

# Step 3: Install frontend dependencies
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Installing Frontend Dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -d "apps/frontend" ]; then
    print_info "Installing frontend packages..."
    cd apps/frontend
    bun install
    cd ../..
    print_success "Frontend dependencies installed"
else
    print_warning "Frontend directory not found, skipping"
fi

echo ""

# Step 4: Setup environment file
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Setting Up Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -f ".env" ]; then
    print_info "Creating .env file from template..."
    cp .env.example .env
    print_success ".env file created"
    print_warning "⚠️  IMPORTANT: Edit .env and add your API keys:"
    echo "   - WALLET_PRIVATE_KEY (your BNB wallet private key)"
    echo "   - OPENROUTER_API_KEY (from https://openrouter.ai)"
    echo "   - Other optional keys (see .env file)"
else
    print_info ".env file already exists (not overwriting)"
fi

echo ""

# Step 5: Install Hardhat for smart contracts
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  Installing Smart Contract Tools (Optional)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Install Hardhat for smart contract deployment? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Installing Hardhat and dependencies..."
    npm install --save-dev \
        hardhat \
        @nomicfoundation/hardhat-toolbox \
        @nomicfoundation/hardhat-verify \
        @openzeppelin/contracts \
        @typechain/ethers-v6 \
        @typechain/hardhat \
        typechain
    print_success "Hardhat installed"
else
    print_info "Skipping Hardhat installation"
fi

echo ""

# Step 6: Create necessary directories
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  Creating Project Directories"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

mkdir -p logs
mkdir -p data
print_success "Created logs and data directories"

echo ""

# Step 7: Verify setup
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣  Verifying Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if critical files exist
CRITICAL_FILES=(
    "src/index.ts"
    "src/config.ts"
    "src/api-server.ts"
    ".env"
    "package.json"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "$file exists"
    else
        print_error "$file not found"
    fi
done

echo ""

# Step 8: Display next steps
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1️⃣  Configure Environment Variables:"
echo "   ${BLUE}nano .env${NC}"
echo "   Add your WALLET_PRIVATE_KEY and OPENROUTER_API_KEY"
echo ""
echo "2️⃣  Get Testnet BNB:"
echo "   ${BLUE}https://testnet.bnbchain.org/faucet-smart${NC}"
echo ""
echo "3️⃣  Start Backend Development Server:"
echo "   ${BLUE}bun run dev${NC}"
echo ""
echo "4️⃣  Start Frontend (in another terminal):"
echo "   ${BLUE}cd apps/frontend && bun run dev${NC}"
echo ""
echo "5️⃣  Access Dashboard:"
echo "   ${BLUE}http://localhost:3000${NC}"
echo ""
echo "📖 Documentation:"
echo "   - README.md - Quick start guide"
echo "   - QUICKSTART.md - Detailed setup instructions"
echo "   - DEPLOYMENT.md - Production deployment guide"
echo "   - TESTING.md - Testing procedures"
echo "   - contracts/README.md - Smart contract deployment"
echo ""
echo "🐳 Docker Deployment:"
echo "   ${BLUE}docker-compose up -d${NC}"
echo ""
echo "💡 Useful Commands:"
echo "   bun test                  - Run tests"
echo "   bun run docker:build      - Build Docker image"
echo "   bun run healthcheck       - Check bot health"
echo "   npx hardhat compile       - Compile smart contracts"
echo ""
echo "🎉 Happy Trading! Remember to start with testnet first."
echo ""
