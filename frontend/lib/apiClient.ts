/**
 * API Client for Immortal AI Trading Bot Backend
 * Centralized API communication with error handling
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const defaultHeaders = {
    'Content-Type': 'application/json',
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new APIError(
        data.error || 'API request failed',
        response.status,
        data
      )
    }

    return data
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }

    // Network or parsing error
    throw new APIError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      0
    )
  }
}

// ========================================
// Bot Status & Control
// ========================================

export async function getBotStatus() {
  return fetchAPI<{
    dex: { status: string; lastTrade?: number }
    polymarket: { status: string; lastTrade?: number }
    websocket: { connected: number }
  }>('/unified/status')
}

export async function getPortfolio() {
  return fetchAPI<{
    dex: { balance: number; pnl: number }
    polymarket: { balance: number; pnl: number }
    total: { combined_pnl: number }
  }>('/unified/portfolio')
}

export async function startBot(type: 'dex' | 'polymarket' | 'all') {
  return fetchAPI<{ success: boolean; message: string }>('/bot/start', {
    method: 'POST',
    body: JSON.stringify({ type }),
  })
}

export async function stopBot(type: 'dex' | 'polymarket' | 'all') {
  return fetchAPI<{ success: boolean; message: string }>('/bot/stop', {
    method: 'POST',
    body: JSON.stringify({ type }),
  })
}

// ========================================
// Trading & Trades
// ========================================

export async function getTradeHistory(params?: {
  limit?: number
  offset?: number
  filter?: 'all' | 'dex' | 'polymarket'
  sort?: 'newest' | 'profit' | 'volume'
}) {
  const queryParams = new URLSearchParams(params as any).toString()
  return fetchAPI<{
    trades: any[]
    total: number
  }>(`/trades?${queryParams}`)
}

export async function executeTrade(tradeData: {
  tokenIn: string
  tokenOut: string
  amountIn: string
  slippage: number
  dex?: string
}) {
  return fetchAPI<{
    success: boolean
    txHash?: string
    error?: string
  }>('/trades/execute', {
    method: 'POST',
    body: JSON.stringify(tradeData),
  })
}

// ========================================
// Multi-DEX & Flash Loans
// ========================================

export async function getBestDEXQuote(params: {
  tokenIn: string
  tokenOut: string
  amountIn: string
}) {
  return fetchAPI<{
    bestDex: string
    outputAmount: string
    savingsPercentage: number
    allQuotes: Array<{
      dex: string
      outputAmount: string
      gasEstimate: string
    }>
  }>('/dex/best-quote', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export async function getFlashLoanOpportunities(minProfitPercentage: number = 0.5) {
  return fetchAPI<{
    opportunities: Array<{
      tokenIn: string
      tokenOut: string
      loanAmount: string
      expectedProfit: string
      profitPercentage: number
      buyDex: string
      sellDex: string
    }>
    count: number
  }>(`/flashloan/opportunities?minProfit=${minProfitPercentage}`)
}

export async function executeFlashLoan(params: {
  tokenIn: string
  tokenOut: string
  loanAmount: string
  buyDex: string
  sellDex: string
}) {
  return fetchAPI<{
    success: boolean
    txHash?: string
    profit?: string
    error?: string
  }>('/flashloan/execute', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

// ========================================
// Memory & Analytics
// ========================================

export async function getMemoryList(params?: {
  category?: string
  limit?: number
  offset?: number
}) {
  const queryParams = new URLSearchParams(params as any).toString()
  return fetchAPI<{
    memories: Array<{
      id: string
      timestamp: number
      category: string
      content: string
      chain: string
      objectId: string
      bucketName: string
      metadata: any
    }>
    total: number
  }>(`/memory/list?${queryParams}`)
}

export async function getMemoryAnalytics() {
  return fetchAPI<{
    total: {
      trades: number
      winRate: number
      profitFactor: number
      volume: number
    }
    dex: {
      trades: number
      winRate: number
      volume: number
    }
    polymarket: {
      trades: number
      winRate: number
      volume: number
    }
    learnings: {
      topStrategies: string[]
      bestTimeframes: string[]
      optimalTokens: string[]
    }
  }>('/memory/analytics')
}

export async function storeMemory(memory: {
  category: string
  content: string
  metadata?: any
}) {
  return fetchAPI<{
    success: boolean
    objectId: string
  }>('/memory/store', {
    method: 'POST',
    body: JSON.stringify(memory),
  })
}

// ========================================
// Token & Market Discovery
// ========================================

export async function discoverTokens(params?: {
  chain?: 'bsc' | 'polygon'
  minLiquidity?: number
  minVolume?: number
  limit?: number
}) {
  const queryParams = new URLSearchParams(params as any).toString()
  return fetchAPI<{
    tokens: Array<{
      address: string
      symbol: string
      name: string
      liquidity: number
      volume24h: number
      priceChange24h: number
      dexScreenerUrl: string
    }>
  }>(`/discovery/tokens?${queryParams}`)
}

export async function discoverPolymarketMarkets(params?: {
  category?: string
  minLiquidity?: number
  limit?: number
}) {
  const queryParams = new URLSearchParams(params as any).toString()
  return fetchAPI<{
    markets: Array<{
      id: string
      question: string
      category: string
      liquidity: number
      volume: number
      endDate: number
      outcomes: Array<{
        name: string
        price: number
      }>
    }>
  }>(`/discovery/polymarket?${queryParams}`)
}

// ========================================
// Settings
// ========================================

export async function getSettings() {
  return fetchAPI<{
    settings: any
  }>('/settings')
}

export async function updateSettings(settings: any) {
  return fetchAPI<{
    success: boolean
    message: string
  }>('/settings', {
    method: 'POST',
    body: JSON.stringify({ settings }),
  })
}

// ========================================
// MEV Protection
// ========================================

export async function getMEVProtectionStatus() {
  return fetchAPI<{
    enabled: boolean
    protectedTrades: number
    savedAmount: string
  }>('/mev/status')
}

export async function configureProtectedTrade(params: {
  transaction: any
  minProfit?: number
  useFlashbots: boolean
}) {
  return fetchAPI<{
    success: boolean
    bundleHash?: string
  }>('/mev/protected-trade', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

// ========================================
// Orchestrator & AI
// ========================================

export async function getOrchestratorMetrics() {
  return fetchAPI<{
    totalDecisions: number
    successRate: number
    averageResponseTime: number
    activeStrategies: string[]
  }>('/orchestrator/metrics')
}

export async function requestAIDecision(params: {
  type: 'trade' | 'strategy' | 'analysis'
  data: any
}) {
  return fetchAPI<{
    decision: string
    confidence: number
    reasoning: string
  }>('/orchestrator/decision', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

// ========================================
// Cross-Chain Opportunities
// ========================================

export async function getCrossChainOpportunities() {
  return fetchAPI<{
    opportunities: Array<{
      type: string
      sourceChain: string
      targetChain: string
      expectedProfit: number
      confidence: number
    }>
  }>('/unified/cross-chain-opportunities')
}

// ========================================
// Export all
// ========================================

export const api = {
  // Bot Control
  getBotStatus,
  getPortfolio,
  startBot,
  stopBot,

  // Trading
  getTradeHistory,
  executeTrade,

  // Multi-DEX & Flash Loans
  getBestDEXQuote,
  getFlashLoanOpportunities,
  executeFlashLoan,

  // Memory & Analytics
  getMemoryList,
  getMemoryAnalytics,
  storeMemory,

  // Discovery
  discoverTokens,
  discoverPolymarketMarkets,

  // Settings
  getSettings,
  updateSettings,

  // MEV Protection
  getMEVProtectionStatus,
  configureProtectedTrade,

  // AI & Orchestrator
  getOrchestratorMetrics,
  requestAIDecision,

  // Cross-Chain
  getCrossChainOpportunities,
}

export default api
