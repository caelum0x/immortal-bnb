/**
 * Polymarket API Key Manager
 * Manages API keys for the Polymarket CLOB client
 * Uses functionality from clob-client submodule
 */

import { ethers } from 'ethers';
import { ClobClient, Chain, type ApiKeyCreds, type ApiKeysResponse, type BuilderApiKey, type BuilderApiKeyResponse } from '@polymarket/clob-client';
import { logger } from '../utils/logger';
import { CONFIG } from '../config';

export interface ApiKeyInfo {
    apiKey: string;
    secret: string;
    passphrase: string;
    created?: number;
}

export interface BuilderKeyInfo {
    apiKey: string;
    created?: number;
}

export class PolymarketApiKeyManager {
    private client: ClobClient;
    private wallet: ethers.Wallet;
    private chainId: Chain;
    private host: string;

    constructor(privateKey?: string, host?: string, chainId?: number) {
        this.host = host || process.env.POLYMARKET_HOST || 'https://clob.polymarket.com';
        this.chainId = (chainId || parseInt(process.env.POLYMARKET_CHAIN_ID || '137')) as Chain;

        const pk = privateKey || process.env.WALLET_PRIVATE_KEY || '';
        if (!pk) {
            throw new Error('Private key required for API Key Manager');
        }

        this.wallet = new ethers.Wallet(pk);
        this.client = new ClobClient(this.host, this.chainId, this.wallet as any);

        logger.info('🔑 Polymarket API Key Manager initialized');
        logger.info(`   - Host: ${this.host}`);
        logger.info(`   - Chain ID: ${this.chainId}`);
        logger.info(`   - Wallet: ${this.wallet.address}`);
    }

    /**
     * Create a new API key
     * Generates a new API key with credentials for authenticated trading
     */
    async createApiKey(nonce?: number): Promise<ApiKeyInfo> {
        try {
            logger.info('🔑 Creating new API key...');

            const creds: ApiKeyCreds = await this.client.createApiKey(nonce);

            logger.info('   ✅ API key created successfully');
            const apiKeyValue = (creds as any).apiKey || (creds as any).key || '';
            logger.info(`   - API Key: ${apiKeyValue.substring(0, 10)}...`);

            return {
                apiKey: apiKeyValue,
                secret: (creds as any).secret || '',
                passphrase: (creds as any).passphrase || '',
                created: Date.now(),
            };
        } catch (error) {
            logger.error('❌ Failed to create API key:', error);
            throw error;
        }
    }

    /**
     * Derive an existing API key
     * Retrieves existing API key credentials without creating a new one
     */
    async deriveApiKey(nonce?: number): Promise<ApiKeyInfo> {
        try {
            logger.info('🔑 Deriving existing API key...');

            const creds: ApiKeyCreds = await this.client.deriveApiKey(nonce);

            logger.info('   ✅ API key derived successfully');
            const apiKeyValue = (creds as any).apiKey || (creds as any).key || '';
            logger.info(`   - API Key: ${apiKeyValue.substring(0, 10)}...`);

            return {
                apiKey: apiKeyValue,
                secret: (creds as any).secret || '',
                passphrase: (creds as any).passphrase || '',
            };
        } catch (error) {
            logger.error('❌ Failed to derive API key:', error);
            throw error;
        }
    }

    /**
     * Create or derive API key
     * Creates a new key if none exists, otherwise derives the existing one
     */
    async createOrDeriveApiKey(nonce?: number): Promise<ApiKeyInfo> {
        try {
            logger.info('🔑 Creating or deriving API key...');

            const creds: ApiKeyCreds = await this.client.createOrDeriveApiKey(nonce);

            logger.info('   ✅ API key ready');
            const apiKeyValue = (creds as any).apiKey || (creds as any).key || '';
            logger.info(`   - API Key: ${apiKeyValue.substring(0, 10)}...`);

            return {
                apiKey: apiKeyValue,
                secret: (creds as any).secret || '',
                passphrase: (creds as any).passphrase || '',
            };
        } catch (error) {
            logger.error('❌ Failed to create/derive API key:', error);
            throw error;
        }
    }

    /**
     * Get all API keys
     * Returns list of all API keys associated with the wallet
     */
    async getApiKeys(): Promise<ApiKeysResponse> {
        try {
            logger.info('🔑 Fetching API keys...');

            const keys: ApiKeysResponse = await this.client.getApiKeys();

            logger.info(`   ✅ Found ${keys.apiKeys?.length || 0} API keys`);

            return keys;
        } catch (error) {
            logger.error('❌ Failed to fetch API keys:', error);
            throw error;
        }
    }

    /**
     * Delete API key
     * Revokes the current API key
     */
    async deleteApiKey(): Promise<boolean> {
        try {
            logger.info('🔑 Deleting API key...');

            await this.client.deleteApiKey();

            logger.info('   ✅ API key deleted successfully');
            return true;
        } catch (error) {
            logger.error('❌ Failed to delete API key:', error);
            throw error;
        }
    }

    /**
     * Create builder API key
     * Creates an API key with builder privileges for advanced functionality
     */
    async createBuilderApiKey(): Promise<BuilderKeyInfo> {
        try {
            logger.info('🔑 Creating builder API key...');

            const key: BuilderApiKey = await this.client.createBuilderApiKey();

            logger.info('   ✅ Builder API key created successfully');
            const apiKeyValue = (key as any).apiKey || (key as any).key || '';
            logger.info(`   - API Key: ${apiKeyValue.substring(0, 10)}...`);

            return {
                apiKey: apiKeyValue,
                created: Date.now(),
            };
        } catch (error) {
            logger.error('❌ Failed to create builder API key:', error);
            throw error;
        }
    }

    /**
     * Get builder API keys
     * Returns list of all builder API keys
     */
    async getBuilderApiKeys(): Promise<BuilderApiKeyResponse[]> {
        try {
            logger.info('🔑 Fetching builder API keys...');

            const keys: BuilderApiKeyResponse[] = await this.client.getBuilderApiKeys();

            logger.info(`   ✅ Found ${keys.length} builder API keys`);

            return keys;
        } catch (error) {
            logger.error('❌ Failed to fetch builder API keys:', error);
            throw error;
        }
    }

    /**
     * Revoke builder API key
     * Revokes the current builder API key
     */
    async revokeBuilderApiKey(): Promise<boolean> {
        try {
            logger.info('🔑 Revoking builder API key...');

            await this.client.revokeBuilderApiKey();

            logger.info('   ✅ Builder API key revoked successfully');
            return true;
        } catch (error) {
            logger.error('❌ Failed to revoke builder API key:', error);
            throw error;
        }
    }

    /**
     * Get ClobClient instance for advanced operations
     */
    getClient(): ClobClient {
        return this.client;
    }

    /**
     * Get wallet address
     */
    getWalletAddress(): string {
        return this.wallet.address;
    }
}

// Singleton instance
let apiKeyManagerInstance: PolymarketApiKeyManager | null = null;

export function getApiKeyManager(): PolymarketApiKeyManager {
    if (!apiKeyManagerInstance) {
        apiKeyManagerInstance = new PolymarketApiKeyManager();
    }
    return apiKeyManagerInstance;
}

export function resetApiKeyManager(): void {
    apiKeyManagerInstance = null;
}
