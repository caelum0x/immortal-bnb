/**
 * Contract ABIs and utilities
 * Export ABIs for use with Wagmi hooks
 */

import IMMBotTokenABI from './IMMBotToken.abi.json';
import StakingABI from './Staking.abi.json';

// Export ABIs
export const IMMBOT_TOKEN_ABI = IMMBotTokenABI;
export const STAKING_ABI = StakingABI;

// Re-export for convenience
export { IMMBotTokenABI, StakingABI };
