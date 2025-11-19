/**
 * Configuration Storage Utility
 * Simple file-based storage for user configurations
 */

import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger';

const CONFIG_DIR = path.join(process.cwd(), 'data', 'configs');

/**
 * Ensure config directory exists
 */
async function ensureConfigDir(): Promise<void> {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch (error) {
    logger.error('Failed to create config directory:', error);
  }
}

/**
 * Save configuration to file
 */
export async function saveConfig<T>(key: string, data: T): Promise<void> {
  try {
    await ensureConfigDir();
    const filePath = path.join(CONFIG_DIR, `${key}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    logger.info(`✅ Configuration saved: ${key}`);
  } catch (error) {
    logger.error(`Failed to save config ${key}:`, error);
    throw error;
  }
}

/**
 * Load configuration from file
 */
export async function loadConfig<T>(key: string): Promise<T | null> {
  try {
    await ensureConfigDir();
    const filePath = path.join(CONFIG_DIR, `${key}.json`);

    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (readError: any) {
      if (readError.code === 'ENOENT') {
        // File doesn't exist yet
        return null;
      }
      throw readError;
    }
  } catch (error) {
    logger.error(`Failed to load config ${key}:`, error);
    return null;
  }
}

/**
 * Delete configuration file
 */
export async function deleteConfig(key: string): Promise<void> {
  try {
    const filePath = path.join(CONFIG_DIR, `${key}.json`);
    await fs.unlink(filePath);
    logger.info(`🗑️ Configuration deleted: ${key}`);
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      logger.error(`Failed to delete config ${key}:`, error);
      throw error;
    }
  }
}

/**
 * List all configuration keys
 */
export async function listConfigs(): Promise<string[]> {
  try {
    await ensureConfigDir();
    const files = await fs.readdir(CONFIG_DIR);
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  } catch (error) {
    logger.error('Failed to list configs:', error);
    return [];
  }
}

/**
 * Append to an array-based configuration
 */
export async function appendToConfig<T>(key: string, item: T): Promise<void> {
  try {
    const existing = await loadConfig<T[]>(key);
    const updated = existing ? [...existing, item] : [item];
    await saveConfig(key, updated);
  } catch (error) {
    logger.error(`Failed to append to config ${key}:`, error);
    throw error;
  }
}

/**
 * Get configuration with default value
 */
export async function getConfigOrDefault<T>(key: string, defaultValue: T): Promise<T> {
  const config = await loadConfig<T>(key);
  return config !== null ? config : defaultValue;
}
