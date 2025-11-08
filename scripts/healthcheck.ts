#!/usr/bin/env bun
/**
 * Health Check Script for Docker Container
 * Verifies the bot is running and responding correctly
 */

const PORT = process.env.PORT || 3001;
const HEALTH_ENDPOINT = `http://localhost:${PORT}/health`;

async function healthCheck(): Promise<void> {
  try {
    // Make request to health endpoint
    const response = await fetch(HEALTH_ENDPOINT, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.error(`❌ Health check failed: HTTP ${response.status}`);
      process.exit(1);
    }

    const data = await response.json();

    // Verify response structure
    if (!data.status || data.status !== 'ok') {
      console.error('❌ Health check failed: Invalid response', data);
      process.exit(1);
    }

    // Success
    console.log('✅ Health check passed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Health check failed:', (error as Error).message);
    process.exit(1);
  }
}

healthCheck();
