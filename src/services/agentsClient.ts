/**
 * Agents Client - Integration with Python FastAPI Microservice
 * Provides RAG and web search capabilities
 */

import axios, { type AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

export interface WebSearchRequest {
  query: string;
  num_results?: number;
  max_content_length?: number;
}

export interface WebSearchResult {
  url: string;
  title: string;
  snippet: string;
  content: string;
  domain: string;
}

export interface WebSearchResponse {
  query: string;
  results: WebSearchResult[];
  summary?: string;
}

export interface RAGQueryRequest {
  query: string;
  context_documents?: string[];
  max_sources?: number;
}

export interface RAGQueryResponse {
  answer: string;
  sources: Array<{
    content: string;
    metadata: Record<string, any>;
  }>;
  confidence: number;
}

export interface MarketAnalysisRequest {
  market_question: string;
  market_id?: string;
  outcomes: string[];
  current_prices?: Record<string, number>;
}

export interface MarketAnalysisResponse {
  market_question: string;
  analysis: string;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  predicted_outcome: string;
  confidence: number;
  reasoning: string;
  sources: Array<{
    title: string;
    url: string;
    domain: string;
    snippet: string;
  }>;
  sentiment_score: number;
}

export interface AgentsHealthResponse {
  status: string;
  services: {
    rag_engine: boolean;
    web_search: boolean;
    market_analyzer: boolean;
  };
  version: string;
}

/**
 * Client for Python Agents Microservice
 */
export class AgentsClient {
  private client: AxiosInstance;
  private baseURL: string;
  private isAvailable: boolean = false;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.AGENTS_URL || 'http://localhost:8000';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 second timeout for AI operations
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Test connection on initialization
    this.testConnection();
  }

  /**
   * Test connection to agents service
   */
  private async testConnection(): Promise<void> {
    try {
      const response = await this.client.get<AgentsHealthResponse>('/health', {
        timeout: 5000,
      });

      this.isAvailable = response.data.status === 'healthy';

      if (this.isAvailable) {
        logger.info(`✅ Agents service connected: ${this.baseURL}`);
      } else {
        logger.warn(`⚠️  Agents service unhealthy: ${this.baseURL}`);
      }
    } catch (error) {
      this.isAvailable = false;
      logger.warn(`⚠️  Agents service unavailable: ${this.baseURL}`);
    }
  }

  /**
   * Check if agents service is available
   */
  isServiceAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Perform web search with AI summary
   */
  async webSearch(request: WebSearchRequest): Promise<WebSearchResponse> {
    try {
      if (!this.isAvailable) {
        throw new Error('Agents service is not available');
      }

      logger.info(`🔍 Web search: ${request.query}`);

      const response = await this.client.post<WebSearchResponse>('/api/search', request);

      logger.info(`✅ Found ${response.data.results.length} results`);

      return response.data;
    } catch (error) {
      logger.error('Web search error:', error);
      throw error;
    }
  }

  /**
   * Query RAG engine
   */
  async ragQuery(request: RAGQueryRequest): Promise<RAGQueryResponse> {
    try {
      if (!this.isAvailable) {
        throw new Error('Agents service is not available');
      }

      logger.info(`🧠 RAG query: ${request.query}`);

      const response = await this.client.post<RAGQueryResponse>('/api/rag/query', request);

      logger.info(`✅ RAG response (confidence: ${response.data.confidence})`);

      return response.data;
    } catch (error) {
      logger.error('RAG query error:', error);
      throw error;
    }
  }

  /**
   * Add documents to RAG vector store
   */
  async addDocuments(documents: string[]): Promise<void> {
    try {
      if (!this.isAvailable) {
        throw new Error('Agents service is not available');
      }

      logger.info(`📄 Adding ${documents.length} documents to RAG`);

      await this.client.post('/api/rag/add-documents', documents);

      logger.info('✅ Documents added successfully');
    } catch (error) {
      logger.error('Error adding documents:', error);
      throw error;
    }
  }

  /**
   * Analyze Polymarket market with RAG + web search
   */
  async analyzeMarket(request: MarketAnalysisRequest): Promise<MarketAnalysisResponse> {
    try {
      if (!this.isAvailable) {
        throw new Error('Agents service is not available');
      }

      logger.info(`📊 Analyzing market: ${request.market_question}`);

      const response = await this.client.post<MarketAnalysisResponse>(
        '/api/polymarket/analyze',
        request
      );

      logger.info(
        `✅ Analysis complete: ${response.data.predicted_outcome} (${
          (response.data.confidence * 100).toFixed(1)
        }% confidence)`
      );

      return response.data;
    } catch (error) {
      logger.error('Market analysis error:', error);
      throw error;
    }
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<AgentsHealthResponse> {
    try {
      const response = await this.client.get<AgentsHealthResponse>('/health');
      this.isAvailable = response.data.status === 'healthy';
      return response.data;
    } catch (error) {
      this.isAvailable = false;
      throw error;
    }
  }

  /**
   * Reconnect to agents service
   */
  async reconnect(): Promise<void> {
    await this.testConnection();
  }
}

// Singleton instance
export const agentsClient = new AgentsClient();

// Export for use in other modules
export default agentsClient;
