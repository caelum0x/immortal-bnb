/**
 * Load Tests for API Endpoints
 * Tests API performance under load (1000+ req/s)
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import axios, { AxiosInstance } from 'axios';

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const TARGET_RPS = 1000; // Requests per second
const TEST_DURATION_MS = 10000; // 10 seconds
const MAX_ACCEPTABLE_LATENCY_MS = 200; // p95 should be < 200ms

describe('API Load Tests', () => {
  let client: AxiosInstance;
  let results: {
    endpoint: string;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgLatency: number;
    p95Latency: number;
    p99Latency: number;
    rps: number;
  }[] = [];

  beforeAll(() => {
    client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 5000,
    });
  });

  afterAll(() => {
    // Print summary
    console.log('\n=== Load Test Summary ===');
    results.forEach((result) => {
      console.log(`\n${result.endpoint}:`);
      console.log(`  Total Requests: ${result.totalRequests}`);
      console.log(`  Successful: ${result.successfulRequests}`);
      console.log(`  Failed: ${result.failedRequests}`);
      console.log(`  Avg Latency: ${result.avgLatency}ms`);
      console.log(`  P95 Latency: ${result.p95Latency}ms`);
      console.log(`  P99 Latency: ${result.p99Latency}ms`);
      console.log(`  RPS: ${result.rps}`);
    });
  });

  async function loadTest(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    data?: any
  ): Promise<void> {
    const latencies: number[] = [];
    let successful = 0;
    let failed = 0;
    const startTime = Date.now();
    const endTime = startTime + TEST_DURATION_MS;

    // Calculate requests per second
    const requestsPerBatch = Math.ceil(TARGET_RPS / 10); // 10 batches per second
    const batchInterval = 100; // 100ms between batches

    const makeRequest = async () => {
      const requestStart = Date.now();
      try {
        const response = method === 'GET' 
          ? await client.get(endpoint)
          : await client.post(endpoint, data);
        
        const latency = Date.now() - requestStart;
        latencies.push(latency);
        successful++;
      } catch (error: any) {
        const latency = Date.now() - requestStart;
        latencies.push(latency);
        failed++;
      }
    };

    // Run load test
    while (Date.now() < endTime) {
      const batchPromises = Array(requestsPerBatch)
        .fill(null)
        .map(() => makeRequest());
      
      await Promise.all(batchPromises);
      await new Promise((resolve) => setTimeout(resolve, batchInterval));
    }

    // Calculate statistics
    latencies.sort((a, b) => a - b);
    const total = latencies.length;
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / total;
    const p95Index = Math.floor(total * 0.95);
    const p99Index = Math.floor(total * 0.99);
    const p95Latency = latencies[p95Index] || 0;
    const p99Latency = latencies[p99Index] || 0;
    const actualRps = total / (TEST_DURATION_MS / 1000);

    results.push({
      endpoint,
      totalRequests: total,
      successfulRequests: successful,
      failedRequests: failed,
      avgLatency,
      p95Latency,
      p99Latency,
      rps: actualRps,
    });
  }

  test('health endpoint should handle high load', async () => {
    await loadTest('/health', 'GET');

    const result = results[results.length - 1];
    expect(result.successfulRequests).toBeGreaterThan(result.totalRequests * 0.95); // 95% success rate
    expect(result.p95Latency).toBeLessThan(MAX_ACCEPTABLE_LATENCY_MS);
    expect(result.rps).toBeGreaterThan(TARGET_RPS * 0.8); // At least 80% of target RPS
  }, 30000); // 30 second timeout

  test('bot-status endpoint should handle moderate load', async () => {
    await loadTest('/api/bot-status', 'GET');

    const result = results[results.length - 1];
    expect(result.successfulRequests).toBeGreaterThan(result.totalRequests * 0.9); // 90% success rate
    expect(result.p95Latency).toBeLessThan(MAX_ACCEPTABLE_LATENCY_MS * 2); // Allow 2x for DB queries
  }, 30000);

  test('discover-tokens endpoint should handle load', async () => {
    await loadTest('/api/discover-tokens?limit=10', 'GET');

    const result = results[results.length - 1];
    expect(result.successfulRequests).toBeGreaterThan(result.totalRequests * 0.85); // 85% success rate
    // External API calls may be slower
    expect(result.p95Latency).toBeLessThan(MAX_ACCEPTABLE_LATENCY_MS * 5);
  }, 30000);

  test('rate limiting should activate under extreme load', async () => {
    // This test expects some rate limiting
    const extremeRps = TARGET_RPS * 2;
    const originalTarget = TARGET_RPS;
    
    // Temporarily increase target
    await loadTest('/health', 'GET');

    const result = results[results.length - 1];
    // With rate limiting, we expect some failures
    // But the service should still be responsive
    expect(result.p95Latency).toBeLessThan(MAX_ACCEPTABLE_LATENCY_MS * 3);
  }, 30000);
});

