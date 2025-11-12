/**
 * AI Agents Integration Tests
 * Tests for Python FastAPI agents microservice integration
 */

import { AgentsClient } from '../src/services/agentsClient';

describe('AI Agents Integration', () => {
  let agentsClient: AgentsClient;

  beforeAll(() => {
    agentsClient = new AgentsClient('http://localhost:8000');
  });

  describe('Web Search', () => {
    it('should perform web search and return results', async () => {
      const response = await agentsClient.webSearch({
        query: 'Bitcoin price prediction 2024',
        num_results: 5,
        max_content_length: 500,
      });

      expect(response).toHaveProperty('query');
      expect(response).toHaveProperty('results');
      expect(response).toHaveProperty('summary');
      expect(Array.isArray(response.results)).toBe(true);
      expect(response.results.length).toBeLessThanOrEqual(5);
    }, 30000);

    it('should handle empty search results gracefully', async () => {
      const response = await agentsClient.webSearch({
        query: 'xyzabc123nonexistentquery456',
        num_results: 3,
      });

      expect(response).toHaveProperty('results');
      expect(Array.isArray(response.results)).toBe(true);
    });
  });

  describe('RAG Query', () => {
    it('should add documents to RAG engine', async () => {
      const response = await agentsClient.ragAddDocuments({
        documents: [
          'Bitcoin is a decentralized digital currency.',
          'Ethereum supports smart contracts and DeFi applications.',
          'BNB Chain is known for fast and low-cost transactions.',
        ],
      });

      expect(response).toHaveProperty('success');
      expect(response.success).toBe(true);
      expect(response).toHaveProperty('count');
      expect(response.count).toBeGreaterThan(0);
    });

    it('should query RAG engine and get relevant answers', async () => {
      // First add documents
      await agentsClient.ragAddDocuments({
        documents: ['The capital of France is Paris.', 'Paris is known for the Eiffel Tower.'],
      });

      // Then query
      const response = await agentsClient.ragQuery({
        question: 'What is the capital of France?',
        max_sources: 2,
      });

      expect(response).toHaveProperty('answer');
      expect(response).toHaveProperty('sources');
      expect(response.answer.toLowerCase()).toContain('paris');
    }, 30000);
  });

  describe('Polymarket Analysis', () => {
    it('should analyze a Polymarket market', async () => {
      const response = await agentsClient.analyzeMarket({
        market_question: 'Will Bitcoin reach $100,000 by end of 2024?',
        outcomes: ['Yes', 'No'],
        current_prices: {
          Yes: 0.35,
          No: 0.65,
        },
      });

      expect(response).toHaveProperty('predicted_outcome');
      expect(response).toHaveProperty('recommendation');
      expect(response).toHaveProperty('confidence');
      expect(response).toHaveProperty('sources');
      expect(['Yes', 'No']).toContain(response.predicted_outcome);
      expect(['BUY', 'SELL', 'HOLD']).toContain(response.recommendation);
      expect(response.confidence).toBeGreaterThanOrEqual(0);
      expect(response.confidence).toBeLessThanOrEqual(1);
    }, 60000);

    it('should provide reasoning for market analysis', async () => {
      const response = await agentsClient.analyzeMarket({
        market_question: 'Will Ethereum price increase this week?',
        outcomes: ['Yes', 'No'],
      });

      expect(response).toHaveProperty('reasoning');
      expect(typeof response.reasoning).toBe('string');
      expect(response.reasoning.length).toBeGreaterThan(0);
    }, 60000);
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await agentsClient.healthCheck();

      expect(response).toHaveProperty('status');
      expect(response.status).toBe('healthy');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const badClient = new AgentsClient('http://localhost:9999');

      await expect(badClient.healthCheck()).rejects.toThrow();
    });

    it('should handle invalid requests', async () => {
      await expect(
        agentsClient.ragQuery({
          question: '',
          max_sources: 0,
        })
      ).rejects.toThrow();
    });
  });
});
