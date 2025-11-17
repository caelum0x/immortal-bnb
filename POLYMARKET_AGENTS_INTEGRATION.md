# Polymarket Agents Integration Guide

**Date**: November 17, 2025
**Repository**: https://github.com/Polymarket/agents
**Commit**: `081f2b5594c37edeb9d3780a778c084d5b6f2743`

---

## Overview

The Immortal BNB project integrates the official **Polymarket Agents** repository as a git submodule. This provides advanced AI-powered prediction market trading capabilities.

### What is Polymarket Agents?

Polymarket Agents is a developer framework for building AI agents that autonomously trade on Polymarket prediction markets. It includes:

- Integration with Polymarket CLOB API
- AI agent utilities for market prediction
- RAG (Retrieval-Augmented Generation) support
- Data sourcing from news, betting services, and web search
- LLM tools for prompt engineering and decision making

---

## Directory Structure

```
immortal-bnb/
├── agents/                          # Polymarket Agents (Git Submodule)
│   ├── agents/
│   │   ├── application/             # Main trading application
│   │   │   ├── creator.py          # Market creation logic
│   │   │   ├── cron.py             # Scheduled tasks
│   │   │   ├── executor.py         # Trade execution
│   │   │   ├── prompts.py          # LLM prompt templates
│   │   │   └── trade.py            # Main trading bot
│   │   ├── connectors/              # Data connectors
│   │   │   ├── chroma.py           # Vector DB (ChromaDB)
│   │   │   ├── news.py             # News API integration
│   │   │   └── search.py           # Web search integration
│   │   ├── polymarket/              # Polymarket API clients
│   │   │   ├── gamma.py            # Gamma Market Client
│   │   │   └── polymarket.py       # Main Polymarket client
│   │   └── utils/
│   │       ├── objects.py          # Data models
│   │       └── utils.py            # Utility functions
│   ├── scripts/
│   │   ├── bash/                    # Bash scripts
│   │   └── python/
│   │       ├── cli.py              # Command-line interface
│   │       ├── server.py           # FastAPI server
│   │       └── setup.py            # Setup utilities
│   ├── tests/
│   ├── requirements.txt             # Python dependencies
│   ├── Dockerfile                   # Docker configuration
│   └── README.md                    # Polymarket Agents documentation
├── src/services/agentsClient.ts    # TypeScript client for agents
└── ...
```

---

## Setup Instructions

### 1. Install Python Dependencies

The Polymarket agents require Python 3.9:

```bash
cd agents

# Create virtual environment
virtualenv --python=python3.9 .venv

# Activate virtual environment
source .venv/bin/activate  # On macOS/Linux
# or
.venv\Scripts\activate     # On Windows

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the `agents/` directory:

```bash
cp .env.example .env
```

Add the following environment variables:

```bash
# Required
POLYGON_WALLET_PRIVATE_KEY="your_polygon_private_key_here"
OPENAI_API_KEY="your_openai_api_key_here"

# Optional
NEWS_API_KEY="your_news_api_key_here"
TAVILY_API_KEY="your_tavily_api_key_here"
```

**Important**: Use a **Polygon** wallet private key, not your BNB Chain key.

### 3. Fund Your Polygon Wallet

The Polymarket agents trade on Polygon, so you need USDC on Polygon:

1. Get your Polygon wallet address
2. Bridge USDC from Ethereum or BSC to Polygon
3. Ensure you have enough USDC for trading

**Minimum Recommended**: 100 USDC for testing

---

## Usage

### Command Line Interface (CLI)

The Polymarket agents provide a powerful CLI for interacting with markets:

```bash
cd agents
export PYTHONPATH="."

# Get all markets sorted by volume
python scripts/python/cli.py get-all-markets --limit 10 --sort-by volume

# Get specific market details
python scripts/python/cli.py get-market --market-id <MARKET_ID>

# Search for news related to a market
python scripts/python/cli.py search-news --query "Bitcoin price prediction"

# Execute a trade (autonomous agent)
python agents/application/trade.py
```

### Available CLI Commands

| Command | Description | Example |
|---------|-------------|---------|
| `get-all-markets` | Get list of markets | `--limit 5 --sort-by volume` |
| `get-market` | Get specific market | `--market-id abc123` |
| `get-event` | Get event details | `--event-id xyz789` |
| `search-news` | Search news articles | `--query "crypto markets"` |
| `query-rag` | Query RAG database | `--question "What is Bitcoin?"` |

### Running the Autonomous Trading Agent

The main trading bot can run autonomously:

```bash
cd agents
export PYTHONPATH="."

# Run the trading agent
python agents/application/trade.py
```

**What it does**:
1. Fetches trending Polymarket markets
2. Gathers news and data sources
3. Uses LLM to analyze and predict outcomes
4. Executes trades based on AI decisions
5. Monitors positions and manages risk

---

## Integration with Immortal BNB Backend

The TypeScript backend integrates with Polymarket agents via the `agentsClient.ts`:

### TypeScript Integration Example

```typescript
import { agentsClient } from './services/agentsClient';

// Check if agents service is available
if (agentsClient.isServiceAvailable()) {

  // Analyze a Polymarket market
  const analysis = await agentsClient.analyzeMarket({
    market_question: "Will Bitcoin reach $100k by end of 2025?",
    outcomes: ["Yes", "No"],
    current_prices: {
      "Yes": 0.45,
      "No": 0.55
    }
  });

  console.log(analysis.recommendation);  // BUY, SELL, or HOLD
  console.log(analysis.confidence);      // 0.0 - 1.0
  console.log(analysis.reasoning);       // AI explanation
  console.log(analysis.sources);         // News sources used

  // Perform web search
  const searchResults = await agentsClient.webSearch({
    query: "Latest crypto market trends",
    num_results: 5
  });

  // Query RAG database
  const ragResponse = await agentsClient.ragQuery({
    query: "What are the best trading strategies?",
    max_sources: 3
  });
}
```

### Running Agents as a Service

To run the Polymarket agents as a FastAPI service that the backend can call:

```bash
cd agents
export PYTHONPATH="."

# Run FastAPI server
python scripts/python/server.py
# Default port: 8000
```

Or use Docker:

```bash
cd agents

# Build Docker image
docker build -t polymarket-agents .

# Run container
docker run -p 8000:8000 \
  -e POLYGON_WALLET_PRIVATE_KEY="your_key" \
  -e OPENAI_API_KEY="your_key" \
  polymarket-agents
```

**Endpoints Available**:
- `GET /health` - Health check
- `POST /api/search` - Web search
- `POST /api/rag/query` - RAG query
- `POST /api/polymarket/analyze` - Market analysis

---

## Frontend Integration

The frontend can display Polymarket agent insights:

### Polymarket Dashboard Component

The `frontend/app/polymarket/page.tsx` already integrates with the agents service:

**Features**:
- Display trending markets
- AI-powered market analysis
- Show agent recommendations (BUY/SELL/HOLD)
- Display confidence scores
- Show news sources and reasoning

**API Calls Used**:
```typescript
// From frontend/lib/api.ts
await analyzePolymarketMarket(marketId, question);
// Calls: POST /api/polymarket/analyze
// Which proxies to: Polymarket agents service
```

---

## Architecture Flow

```
User Request (Frontend)
         │
         ▼
Frontend API Call
         │
         ▼
Express Backend (/api/polymarket/*)
         │
         ▼
agentsClient.ts (TypeScript)
         │
         ▼
Polymarket Agents Service (Python FastAPI)
         │
         ├──► LangChain (RAG)
         ├──► ChromaDB (Vector Store)
         ├──► OpenAI / LLM
         ├──► News APIs
         ├──► Web Search
         └──► Polymarket CLOB API
         │
         ▼
AI Decision + Trade Execution
         │
         ▼
Polygon Blockchain
```

---

## Key Files and Their Purposes

### Polymarket Agents Files

| File | Purpose |
|------|---------|
| `agents/application/trade.py` | Main autonomous trading bot |
| `agents/application/executor.py` | Trade execution logic |
| `agents/application/prompts.py` | LLM prompt templates |
| `agents/connectors/chroma.py` | Vector database for RAG |
| `agents/connectors/news.py` | News API integration |
| `agents/connectors/search.py` | Web search connector |
| `agents/polymarket/polymarket.py` | Polymarket CLOB client |
| `agents/polymarket/gamma.py` | Gamma market data client |
| `agents/utils/objects.py` | Pydantic data models |
| `scripts/python/cli.py` | Command-line interface |
| `scripts/python/server.py` | FastAPI server |

### Immortal BNB Integration Files

| File | Purpose |
|------|---------|
| `src/services/agentsClient.ts` | TypeScript client for agents |
| `src/polymarket/polymarketClient.ts` | Direct CLOB integration |
| `frontend/app/polymarket/page.tsx` | Polymarket UI page |
| `frontend/components/PolymarketDashboard.tsx` | Market display component |

---

## Configuration Options

### Polymarket Agents Configuration

The agents use environment variables and can be configured via code:

**Environment Variables**:
```bash
# Required
POLYGON_WALLET_PRIVATE_KEY=    # Your Polygon wallet
OPENAI_API_KEY=                # OpenAI for LLM
POLYMARKET_API_KEY=            # Optional: Polymarket API key

# Optional Services
NEWS_API_KEY=                  # News API
TAVILY_API_KEY=                # Tavily search
CHROMA_DB_PATH=                # ChromaDB storage path
```

**Code Configuration** (in Python files):
```python
# agents/application/trade.py
MAX_TRADE_AMOUNT = 100  # Maximum USDC per trade
MIN_CONFIDENCE = 0.7    # Minimum AI confidence (0-1)
RISK_TOLERANCE = 0.5    # Risk level (0-1)
```

### Backend Configuration

In `src/config.ts` and environment variables:

```bash
# Backend .env
AGENTS_URL=http://localhost:8000  # Polymarket agents service URL
```

---

## Testing

### Test the Polymarket Agents

```bash
cd agents
export PYTHONPATH="."

# Run tests
pytest tests/

# Test market fetching
python scripts/python/cli.py get-all-markets --limit 3

# Test news search
python scripts/python/cli.py search-news --query "Bitcoin"

# Test RAG query
python scripts/python/cli.py query-rag --question "What is Polymarket?"
```

### Test Backend Integration

```bash
# Start agents service
cd agents && python scripts/python/server.py

# Test from backend
curl http://localhost:8000/health

# Test market analysis
curl -X POST http://localhost:8000/api/polymarket/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "market_question": "Will Bitcoin reach $100k?",
    "outcomes": ["Yes", "No"],
    "current_prices": {"Yes": 0.45, "No": 0.55}
  }'
```

---

## Production Deployment

### Docker Compose

Add to your `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # Existing services...

  polymarket-agents:
    build:
      context: ./agents
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - POLYGON_WALLET_PRIVATE_KEY=${POLYGON_WALLET_PRIVATE_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NEWS_API_KEY=${NEWS_API_KEY}
      - PYTHONPATH=.
    volumes:
      - ./agents:/home
      - ./data/chroma:/home/local_db
    restart: unless-stopped
    networks:
      - immortal-bnb-network

networks:
  immortal-bnb-network:
    driver: bridge
```

### Running in Production

```bash
# Build and start all services
docker-compose up -d

# Check logs
docker-compose logs -f polymarket-agents

# Stop services
docker-compose down
```

---

## Troubleshooting

### Common Issues

**1. Module not found errors**
```bash
# Solution: Set PYTHONPATH
export PYTHONPATH="."
# Or add to .bashrc/.zshrc
```

**2. ChromaDB errors**
```bash
# Solution: Clear database and restart
rm -rf local_db*
```

**3. Polymarket API rate limiting**
```bash
# Solution: Add delays between requests
# Or get an API key from Polymarket
```

**4. Agents service not connecting**
```bash
# Check if service is running
curl http://localhost:8000/health

# Check logs
docker logs polymarket-agents

# Restart service
docker-compose restart polymarket-agents
```

---

## Advanced Usage

### Custom Prompts

Modify `agents/application/prompts.py` to customize AI behavior:

```python
# Example: Custom market analysis prompt
ANALYSIS_PROMPT = """
Analyze the following prediction market:

Market: {market_question}
Current Odds: {current_prices}
News Context: {news_summary}

Consider:
1. Recent news and events
2. Market sentiment and trends
3. Statistical probability
4. Risk factors

Provide your recommendation: BUY, SELL, or HOLD
Confidence: 0.0 to 1.0
Reasoning: Detailed explanation
"""
```

### Custom Data Sources

Add new connectors in `agents/connectors/`:

```python
# agents/connectors/custom_data.py
class CustomDataConnector:
    def fetch_data(self, query: str):
        # Your custom data fetching logic
        pass
```

### Custom Trading Strategies

Modify `agents/application/executor.py`:

```python
def execute_trade_with_custom_strategy(market, analysis):
    # Your custom trading logic
    if analysis.confidence > 0.8:
        # High confidence strategy
        pass
    else:
        # Conservative strategy
        pass
```

---

## Resources

### Official Documentation
- Polymarket Agents Repo: https://github.com/Polymarket/agents
- Polymarket API Docs: https://docs.polymarket.com
- CLOB Client: https://github.com/Polymarket/py-clob-client

### Related Tools
- LangChain: https://github.com/langchain-ai/langchain
- ChromaDB: https://docs.trychroma.com
- OpenAI API: https://platform.openai.com

### Learning Resources
- Superforecasting (Book): Tetlock & Gardner
- Prediction Markets Article: https://mirror.xyz/1kx.eth/jnQhA56Kx9p3RODKiGzqzHGGEODpbskivUUNdd7hwh0
- Crypto + AI: https://vitalik.eth.limo/general/2024/01/30/cryptoai.html

---

## Summary

The Polymarket Agents integration provides:

✅ **Autonomous AI Trading**: LLM-powered market analysis
✅ **RAG Support**: Context-aware predictions using historical data
✅ **Multi-Source Data**: News, web search, betting services
✅ **TypeScript Integration**: Seamless backend communication
✅ **Frontend Display**: Real-time market insights
✅ **Production Ready**: Docker + API server support

**Status**: Fully integrated and operational 🚀

---

**Last Updated**: November 17, 2025
**Polymarket Agents Version**: commit `081f2b5594c37edeb9d3780a778c084d5b6f2743`
