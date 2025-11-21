/**
 * Python Bridge Client
 * Communicates with the Python Polymarket Agents API microservice
 */

import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { logger } from '../utils/logger.js';
import { CONFIG } from '../config.js';

export interface MarketAnalysisRequest {
    market_id?: string;
    event_title?: string;
    question?: string;
    outcome?: string;
    use_rag?: boolean;
}

export interface SuperforecastRequest {
    event_title: string;
    market_question: string;
    outcome: string;
}

export interface NewsRequest {
    query: string;
    max_results?: number;
}

export interface SearchRequest {
    query: string;
    max_results?: number;
}

export interface TradeRequest {
    market_id: string;
    side: 'BUY' | 'SELL';
    amount: number;
    outcome_index?: number;
}

export interface PythonAgentStatus {
    status: string;
    agents: {
        trader: boolean;
        executor: boolean;
        gamma: boolean;
        polymarket: boolean;
    };
    environment: {
        openai_configured: boolean;
        wallet_configured: boolean;
        tavily_configured: boolean;
        news_configured: boolean;
    };
}

export interface Market {
    id: string;
    question: string;
    [key: string]: any;
}

export interface Event {
    id: string;
    title: string;
    [key: string]: any;
}

export class PythonBridge {
    private client: AxiosInstance;
    private baseURL: string;
    private apiKey?: string;
    private isHealthy: boolean = false;
    private lastHealthCheck: number = 0;
    private healthCheckInterval: number = 60000; // 1 minute

    constructor(baseURL?: string, apiKey?: string) {
        this.baseURL = baseURL || CONFIG.PYTHON_API_URL || 'http://localhost:5000';
        this.apiKey = apiKey || CONFIG.PYTHON_API_KEY;

        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 30000, // 30 seconds
            headers: {
                'Content-Type': 'application/json',
                ...(this.apiKey && { 'X-API-Key': this.apiKey }),
            },
        });

        // Add request interceptor for logging
        this.client.interceptors.request.use(
            (config) => {
                logger.info(`🐍 Python API Request: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                logger.error(`🐍 Python API Request Error: ${error.message}`);
                return Promise.reject(error);
            }
        );

        // Add response interceptor for logging
        this.client.interceptors.response.use(
            (response) => {
                logger.info(`🐍 Python API Response: ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                this.handleError(error);
                return Promise.reject(error);
            }
        );

        // Initial health check (non-blocking, don't log errors)
        this.checkHealth().catch(() => {
            // Silently fail - Python API is optional
        });
    }

    /**
     * Handle API errors
     */
    private handleError(error: AxiosError): void {
        if (error.response) {
            // Don't log 403/404 as errors - Python API is optional
            if (error.response.status === 403 || error.response.status === 404) {
                logger.debug(`🐍 Python API not available (${error.response.status}) - This is optional`);
            } else {
                logger.warn(`🐍 Python API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            }
        } else if (error.request) {
            logger.debug(`🐍 Python API not available at ${this.baseURL} - This is optional`);
        } else {
            logger.debug(`🐍 Python API Error: ${error.message}`);
        }
    }

    /**
     * Check if Python API is healthy
     */
    async checkHealth(): Promise<boolean> {
        try {
            const response = await this.client.get('/health');
            this.isHealthy = response.data.status === 'healthy';
            this.lastHealthCheck = Date.now();

            if (this.isHealthy) {
                logger.info(`✅ Python API is healthy at ${this.baseURL}`);
            } else {
                logger.debug(`⚠️  Python API health check returned unhealthy`);
            }

            return this.isHealthy;
        } catch (error: any) {
            this.isHealthy = false;
            this.lastHealthCheck = Date.now();
            // Don't log as error - Python API is optional
            // Only log if it's a real error (not 403/404/connection refused/ECONNREFUSED)
            const status = error.response?.status;
            const isOptionalError = !status || [403, 404].includes(status) || 
                                   error.code === 'ECONNREFUSED' || 
                                   error.message?.includes('ECONNREFUSED');
            
            if (!isOptionalError) {
                logger.warn(`⚠️  Python API health check failed: ${status || error.message}`);
            }
            // Silently ignore optional errors (403, 404, connection refused)
            return false;
        }
    }

    /**
     * Get cached health status (with automatic refresh)
     */
    async isServiceHealthy(): Promise<boolean> {
        const now = Date.now();
        if (now - this.lastHealthCheck > this.healthCheckInterval) {
            await this.checkHealth();
        }
        return this.isHealthy;
    }

    /**
     * Get agent status
     */
    async getAgentStatus(): Promise<PythonAgentStatus> {
        const response = await this.client.get<PythonAgentStatus>('/api/agent-status');
        return response.data;
    }

    /**
     * Get Polymarket markets
     */
    async getMarkets(limit: number = 10, active: boolean = true): Promise<Market[]> {
        const response = await this.client.get('/api/markets', {
            params: { limit, active },
        });
        return response.data.markets;
    }

    /**
     * Get Polymarket events
     */
    async getEvents(limit: number = 10, tradeable: boolean = true): Promise<Event[]> {
        const response = await this.client.get('/api/events', {
            params: { limit, tradeable },
        });
        return response.data.events;
    }

    /**
     * Analyze a market using AI
     */
    async analyzeMarket(request: MarketAnalysisRequest): Promise<any> {
        const response = await this.client.post('/api/analyze-market', request);
        return response.data;
    }

    /**
     * Generate superforecast for an outcome
     */
    async superforecast(request: SuperforecastRequest): Promise<any> {
        const response = await this.client.post('/api/superforecast', request);
        return response.data;
    }

    /**
     * Discover trading opportunities
     */
    async discoverOpportunities(limit: number = 5): Promise<any[]> {
        const response = await this.client.get('/api/discover-opportunities', {
            params: { limit },
        });
        return response.data.opportunities;
    }

    /**
     * Fetch news articles
     */
    async fetchNews(request: NewsRequest): Promise<any[]> {
        const response = await this.client.post('/api/fetch-news', request);
        return response.data.articles;
    }

    /**
     * Perform web search
     */
    async search(request: SearchRequest): Promise<any[]> {
        const response = await this.client.post('/api/search', request);
        return response.data.results;
    }

    /**
     * Get market details
     */
    async getMarketDetails(marketId: string): Promise<any> {
        const response = await this.client.get(`/api/market/${marketId}`);
        return response.data;
    }

    /**
     * Get Polymarket wallet balance
     */
    async getBalance(): Promise<{ address: string; usdc_balance: number }> {
        const response = await this.client.get('/api/balance');
        return response.data;
    }

    /**
     * Execute a trade (requires ENABLE_TRADING=true on Python API)
     */
    async executeTrade(request: TradeRequest): Promise<any> {
        const response = await this.client.post('/api/execute-trade', request);
        return response.data;
    }

    /**
     * Run automated trading strategy
     */
    async runTradingStrategy(): Promise<any> {
        const response = await this.client.post('/api/run-trading-strategy');
        return response.data;
    }

    /**
     * Query events using RAG (vector similarity search)
     */
    async ragQueryEvents(query: string, maxResults: number = 5): Promise<any> {
        const response = await this.client.post('/api/rag/query-events', {
            query,
            max_results: maxResults,
        });
        return response.data;
    }

    /**
     * Query markets using RAG (vector similarity search)
     */
    async ragQueryMarkets(query: string, maxResults: number = 5): Promise<any> {
        const response = await this.client.post('/api/rag/query-markets', {
            query,
            max_results: maxResults,
        });
        return response.data;
    }

    /**
     * Get comprehensive market intelligence with RAG + News + Search
     */
    async getMarketIntelligence(request: {
        market_id?: string;
        event_title?: string;
        include_news?: boolean;
        include_search?: boolean;
        depth?: 'quick' | 'standard' | 'deep';
    }): Promise<any> {
        const response = await this.client.post('/api/intelligence/market-analysis', {
            market_id: request.market_id,
            event_title: request.event_title,
            include_news: request.include_news ?? true,
            include_search: request.include_search ?? true,
            depth: request.depth || 'standard',
        });
        return response.data;
    }

    /**
     * Get AI-powered trading decision with RAG enhancement
     */
    async getAIDecision(request: {
        market_id: string;
        amount?: number;
        use_rag?: boolean;
        include_forecast?: boolean;
    }): Promise<any> {
        const response = await this.client.post('/api/ai/decision', {
            market_id: request.market_id,
            amount: request.amount,
            use_rag: request.use_rag ?? true,
            include_forecast: request.include_forecast ?? true,
        });
        return response.data;
    }
}

// Singleton instance
let pythonBridgeInstance: PythonBridge | null = null;

export function getPythonBridge(): PythonBridge {
    if (!pythonBridgeInstance) {
        pythonBridgeInstance = new PythonBridge();
    }
    return pythonBridgeInstance;
}

export default PythonBridge;
