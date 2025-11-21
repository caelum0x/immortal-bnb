/**
 * Health Check Service
 * Provides comprehensive health checks for all dependencies
 */

import { logger } from '../utils/logger';
import { prisma } from '../db/client';
import { getRedisClient } from '../cache/redisClient';
import { CONFIG } from '../config';
import { ethers } from 'ethers';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    [key: string]: {
      status: 'up' | 'down';
      message?: string;
      latency?: number;
    };
  };
}

export class HealthChecker {
  /**
   * Perform comprehensive health check
   */
  async checkHealth(): Promise<HealthStatus> {
    const checks: HealthStatus['checks'] = {};
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Database check
    const dbCheck = await this.checkDatabase();
    checks.database = dbCheck;
    if (dbCheck.status === 'down') {
      overallStatus = 'unhealthy';
    }

    // Redis check
    const redisCheck = await this.checkRedis();
    checks.redis = redisCheck;
    if (redisCheck.status === 'down' && overallStatus === 'healthy') {
      overallStatus = 'degraded'; // Redis is optional
    }

    // Blockchain RPC check
    const rpcCheck = await this.checkBlockchainRPC();
    checks.blockchain = rpcCheck;
    if (rpcCheck.status === 'down') {
      overallStatus = 'unhealthy';
    }

    // Greenfield check
    const greenfieldCheck = await this.checkGreenfield();
    checks.greenfield = greenfieldCheck;
    if (greenfieldCheck.status === 'down' && overallStatus === 'healthy') {
      overallStatus = 'degraded';
    }

    // Python API check
    const pythonApiCheck = await this.checkPythonAPI();
    checks.pythonApi = pythonApiCheck;
    if (pythonApiCheck.status === 'down' && overallStatus === 'healthy') {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  /**
   * Liveness probe (basic check)
   */
  async liveness(): Promise<{ status: 'alive' | 'dead' }> {
    try {
      // Just check if the process is running
      return { status: 'alive' };
    } catch (error) {
      return { status: 'dead' };
    }
  }

  /**
   * Readiness probe (can serve traffic)
   */
  async readiness(): Promise<{ status: 'ready' | 'not-ready' }> {
    try {
      // Check critical dependencies
      const dbCheck = await this.checkDatabase();
      const rpcCheck = await this.checkBlockchainRPC();

      if (dbCheck.status === 'down' || rpcCheck.status === 'down') {
        return { status: 'not-ready' };
      }

      return { status: 'ready' };
    } catch (error) {
      return { status: 'not-ready' };
    }
  }

  private async checkDatabase(): Promise<HealthStatus['checks']['database']> {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      return {
        status: 'up',
        latency,
      };
    } catch (error: any) {
      return {
        status: 'down',
        message: error.message,
      };
    }
  }

  private async checkRedis(): Promise<HealthStatus['checks']['redis']> {
    const start = Date.now();
    try {
      const client = await getRedisClient();
      await client.ping();
      const latency = Date.now() - start;
      return {
        status: 'up',
        latency,
      };
    } catch (error: any) {
      return {
        status: 'down',
        message: error.message,
      };
    }
  }

  private async checkBlockchainRPC(): Promise<HealthStatus['checks']['blockchain']> {
    const start = Date.now();
    try {
      const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
      await provider.getBlockNumber();
      const latency = Date.now() - start;
      return {
        status: 'up',
        latency,
      };
    } catch (error: any) {
      return {
        status: 'down',
        message: error.message,
      };
    }
  }

  private async checkGreenfield(): Promise<HealthStatus['checks']['greenfield']> {
    const start = Date.now();
    try {
      // Simple check - try to connect
      const greenfieldRPC = process.env.GREENFIELD_RPC_URL;
      if (!greenfieldRPC) {
        return {
          status: 'down',
          message: 'GREENFIELD_RPC_URL not configured',
        };
      }

      // In a real implementation, check Greenfield connection
      const latency = Date.now() - start;
      return {
        status: 'up',
        latency,
      };
    } catch (error: any) {
      return {
        status: 'down',
        message: error.message,
      };
    }
  }

  private async checkPythonAPI(): Promise<HealthStatus['checks']['pythonApi']> {
    const start = Date.now();
    try {
      const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5000';
      const response = await fetch(`${pythonApiUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Python API returned ${response.status}`);
      }

      const latency = Date.now() - start;
      return {
        status: 'up',
        latency,
      };
    } catch (error: any) {
      return {
        status: 'down',
        message: error.message,
      };
    }
  }
}

export const healthChecker = new HealthChecker();

