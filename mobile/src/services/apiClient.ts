/**
 * API Client for Immortal Bot Backend
 */

import axios from 'axios';

// Configure API base URL (update with your server URL)
const API_BASE_URL = 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests (if authenticated)
let authToken: string | null = null;

export function setAuthToken(token: string) {
  authToken = token;
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export function clearAuthToken() {
  authToken = null;
  delete apiClient.defaults.headers.common['Authorization'];
}

// API Methods

export async function login(walletAddress: string) {
  const response = await apiClient.post('/auth/login', { walletAddress });
  if (response.data.token) {
    setAuthToken(response.data.token);
  }
  return response.data;
}

export async function getBotStatus() {
  const response = await apiClient.get('/unified/status');
  return response.data;
}

export async function getPortfolio() {
  const response = await apiClient.get('/unified/portfolio');
  return response.data;
}

export async function getTradeHistory(limit: number = 50) {
  const response = await apiClient.get(`/trades?limit=${limit}`);
  return response.data;
}

export async function getMemoryAnalytics() {
  const response = await apiClient.get('/memory/analytics');
  return response.data;
}

export async function getFlashLoanOpportunities(minProfit: number = 0.5) {
  const response = await apiClient.get(`/flashloan/opportunities?minProfit=${minProfit}`);
  return response.data;
}

export async function getDEXQuote(tokenIn: string, tokenOut: string, amountIn: string) {
  const response = await apiClient.post('/dex/best-quote', {
    tokenIn,
    tokenOut,
    amountIn,
  });
  return response.data;
}

export async function getOrchestratorMetrics() {
  const response = await apiClient.get('/orchestrator/metrics');
  return response.data;
}

export default apiClient;
