/**
 * Smart Contract Interaction Service
 *
 * Provides a clean abstraction layer for interacting with deployed smart contracts.
 * Handles all blockchain interactions for token, staking, and arbitrage contracts.
 */

import { ethers, Contract, providers, Wallet } from 'ethers';
import { IMMBOT_TOKEN_ABI, STAKING_CONTRACT_ABI, FLASH_LOAN_ARBITRAGE_ABI } from '../contracts/abis';
import logger from '../utils/logger';

// Contract configuration
interface ContractConfig {
  tokenAddress?: string;
  stakingAddress?: string;
  arbitrageAddress?: string;
  rpcUrl: string;
  network: string;
  privateKey?: string;
}

// Type definitions for contract responses
export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  liquidityWallet: string;
  stakingContract: string;
  taxPercentage: number;
  burnPercentage: number;
  liquidityPercentage: number;
}

export interface TokenBalance {
  address: string;
  balance: string;
  balanceFormatted: string;
}

export interface StakingPool {
  id: number;
  duration: number;
  multiplier: number;
  name: string;
  apy: number;
}

export interface StakePosition {
  amount: string;
  stakingTime: number;
  unlockTime: number;
  lockPeriodId: number;
  accumulatedReward: string;
  lastRewardTime: number;
  isActive: boolean;
  rewards: string;
  daysRemaining: number;
  apy: number;
}

export interface StakingStats {
  totalStaked: string;
  totalRewardsPaid: string;
  totalStakers: number;
  userTotalStaked: string;
  userTotalRewards: string;
}

export interface ArbitrageSimulation {
  expectedProfit: string;
  profitable: boolean;
  profitPercentage: number;
}

export class ContractService {
  private provider: providers.Provider;
  private wallet?: Wallet;
  private tokenContract?: Contract;
  private stakingContract?: Contract;
  private arbitrageContract?: Contract;
  private config: ContractConfig;

  constructor(config: ContractConfig) {
    this.config = config;

    // Initialize provider
    this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);

    // Initialize wallet if private key is provided
    if (config.privateKey) {
      this.wallet = new Wallet(config.privateKey, this.provider);
    }

    // Initialize contracts
    this.initializeContracts();

    logger.info('✅ Contract Service initialized', {
      network: config.network,
      hasWallet: !!this.wallet,
      tokenAddress: config.tokenAddress,
      stakingAddress: config.stakingAddress,
    });
  }

  private initializeContracts(): void {
    const signer = this.wallet || this.provider;

    if (this.config.tokenAddress) {
      this.tokenContract = new Contract(
        this.config.tokenAddress,
        IMMBOT_TOKEN_ABI,
        signer
      );
    }

    if (this.config.stakingAddress) {
      this.stakingContract = new Contract(
        this.config.stakingAddress,
        STAKING_CONTRACT_ABI,
        signer
      );
    }

    if (this.config.arbitrageAddress) {
      this.arbitrageContract = new Contract(
        this.config.arbitrageAddress,
        FLASH_LOAN_ARBITRAGE_ABI,
        signer
      );
    }
  }

  // ============================================================================
  // TOKEN CONTRACT METHODS
  // ============================================================================

  async getTokenInfo(): Promise<TokenInfo> {
    if (!this.tokenContract) {
      throw new Error('Token contract not initialized');
    }

    try {
      const [
        name,
        symbol,
        decimals,
        totalSupply,
        liquidityWallet,
        stakingContract,
        taxPercentage,
        burnPercentage,
        liquidityPercentage,
      ] = await Promise.all([
        this.tokenContract.name(),
        this.tokenContract.symbol(),
        this.tokenContract.decimals(),
        this.tokenContract.totalSupply(),
        this.tokenContract.liquidityWallet(),
        this.tokenContract.stakingContract(),
        this.tokenContract.TAX_PERCENTAGE(),
        this.tokenContract.BURN_PERCENTAGE(),
        this.tokenContract.LIQUIDITY_PERCENTAGE(),
      ]);

      return {
        name,
        symbol,
        decimals: decimals.toNumber(),
        totalSupply: ethers.utils.formatUnits(totalSupply, decimals),
        liquidityWallet,
        stakingContract,
        taxPercentage: taxPercentage.toNumber(),
        burnPercentage: burnPercentage.toNumber(),
        liquidityPercentage: liquidityPercentage.toNumber(),
      };
    } catch (error) {
      logger.error('Failed to get token info', { error });
      throw error;
    }
  }

  async getTokenBalance(address: string): Promise<TokenBalance> {
    if (!this.tokenContract) {
      throw new Error('Token contract not initialized');
    }

    try {
      const [balance, decimals] = await Promise.all([
        this.tokenContract.balanceOf(address),
        this.tokenContract.decimals(),
      ]);

      return {
        address,
        balance: balance.toString(),
        balanceFormatted: ethers.utils.formatUnits(balance, decimals),
      };
    } catch (error) {
      logger.error('Failed to get token balance', { address, error });
      throw error;
    }
  }

  async approveToken(spender: string, amount: string): Promise<string> {
    if (!this.tokenContract || !this.wallet) {
      throw new Error('Token contract or wallet not initialized');
    }

    try {
      const tx = await this.tokenContract.approve(spender, amount);
      logger.info('Token approval transaction sent', { txHash: tx.hash, spender, amount });

      const receipt = await tx.wait();
      logger.info('Token approval confirmed', { txHash: receipt.transactionHash });

      return receipt.transactionHash;
    } catch (error) {
      logger.error('Failed to approve token', { spender, amount, error });
      throw error;
    }
  }

  async transferToken(recipient: string, amount: string): Promise<string> {
    if (!this.tokenContract || !this.wallet) {
      throw new Error('Token contract or wallet not initialized');
    }

    try {
      const tx = await this.tokenContract.transfer(recipient, amount);
      logger.info('Token transfer transaction sent', { txHash: tx.hash, recipient, amount });

      const receipt = await tx.wait();
      logger.info('Token transfer confirmed', { txHash: receipt.transactionHash });

      return receipt.transactionHash;
    } catch (error) {
      logger.error('Failed to transfer token', { recipient, amount, error });
      throw error;
    }
  }

  // ============================================================================
  // STAKING CONTRACT METHODS
  // ============================================================================

  async getStakingPools(): Promise<StakingPool[]> {
    if (!this.stakingContract) {
      throw new Error('Staking contract not initialized');
    }

    try {
      const [lockPeriodsCount, baseAPY] = await Promise.all([
        this.stakingContract.lockPeriodsCount(),
        this.stakingContract.baseAPY(),
      ]);

      const pools: StakingPool[] = [];

      for (let i = 0; i < lockPeriodsCount.toNumber(); i++) {
        const lockPeriod = await this.stakingContract.lockPeriods(i);

        const apy = (baseAPY.toNumber() * lockPeriod.multiplier.toNumber()) / 10000 / 100;

        pools.push({
          id: i,
          duration: lockPeriod.duration.toNumber(),
          multiplier: lockPeriod.multiplier.toNumber(),
          name: lockPeriod.name,
          apy,
        });
      }

      return pools;
    } catch (error) {
      logger.error('Failed to get staking pools', { error });
      throw error;
    }
  }

  async getStakingStats(userAddress?: string): Promise<StakingStats> {
    if (!this.stakingContract) {
      throw new Error('Staking contract not initialized');
    }

    try {
      const [totalStaked, totalRewardsPaid, totalStakers] = await Promise.all([
        this.stakingContract.totalStaked(),
        this.stakingContract.totalRewardsPaid(),
        this.stakingContract.totalStakers(),
      ]);

      let userTotalStaked = '0';
      let userTotalRewards = '0';

      if (userAddress) {
        [userTotalStaked, userTotalRewards] = await Promise.all([
          this.stakingContract.userTotalStaked(userAddress),
          this.stakingContract.userTotalRewards(userAddress),
        ]);
      }

      const decimals = 18; // IMMBOT has 18 decimals

      return {
        totalStaked: ethers.utils.formatUnits(totalStaked, decimals),
        totalRewardsPaid: ethers.utils.formatUnits(totalRewardsPaid, decimals),
        totalStakers: totalStakers.toNumber(),
        userTotalStaked: ethers.utils.formatUnits(userTotalStaked, decimals),
        userTotalRewards: ethers.utils.formatUnits(userTotalRewards, decimals),
      };
    } catch (error) {
      logger.error('Failed to get staking stats', { error });
      throw error;
    }
  }

  async getUserStakes(userAddress: string): Promise<StakePosition[]> {
    if (!this.stakingContract) {
      throw new Error('Staking contract not initialized');
    }

    try {
      const [stakeCount, baseAPY, lockPeriodsCount] = await Promise.all([
        this.stakingContract.userStakeCount(userAddress),
        this.stakingContract.baseAPY(),
        this.stakingContract.lockPeriodsCount(),
      ]);

      const stakes: StakePosition[] = [];
      const decimals = 18;

      // Get lock periods for APY calculation
      const lockPeriods = [];
      for (let i = 0; i < lockPeriodsCount.toNumber(); i++) {
        lockPeriods.push(await this.stakingContract.lockPeriods(i));
      }

      for (let i = 0; i < stakeCount.toNumber(); i++) {
        const [stake, rewards] = await Promise.all([
          this.stakingContract.userStakes(userAddress, i),
          this.stakingContract.calculateRewards(userAddress, i),
        ]);

        if (!stake.isActive) continue;

        const lockPeriod = lockPeriods[stake.lockPeriodId.toNumber()];
        const apy = (baseAPY.toNumber() * lockPeriod.multiplier.toNumber()) / 10000 / 100;

        const now = Math.floor(Date.now() / 1000);
        const daysRemaining = Math.max(0, Math.ceil((stake.unlockTime.toNumber() - now) / 86400));

        stakes.push({
          amount: ethers.utils.formatUnits(stake.amount, decimals),
          stakingTime: stake.stakingTime.toNumber(),
          unlockTime: stake.unlockTime.toNumber(),
          lockPeriodId: stake.lockPeriodId.toNumber(),
          accumulatedReward: ethers.utils.formatUnits(stake.accumulatedReward, decimals),
          lastRewardTime: stake.lastRewardTime.toNumber(),
          isActive: stake.isActive,
          rewards: ethers.utils.formatUnits(rewards, decimals),
          daysRemaining,
          apy,
        });
      }

      return stakes;
    } catch (error) {
      logger.error('Failed to get user stakes', { userAddress, error });
      throw error;
    }
  }

  async stake(amount: string, lockPeriodId: number): Promise<string> {
    if (!this.stakingContract || !this.wallet) {
      throw new Error('Staking contract or wallet not initialized');
    }

    try {
      // Convert amount to Wei
      const amountWei = ethers.utils.parseEther(amount);

      // First, approve the staking contract to spend tokens
      if (this.tokenContract) {
        const approveTx = await this.tokenContract.approve(
          this.config.stakingAddress,
          amountWei
        );
        await approveTx.wait();
        logger.info('Token approval for staking confirmed');
      }

      // Then stake
      const tx = await this.stakingContract.stake(amountWei, lockPeriodId);
      logger.info('Stake transaction sent', { txHash: tx.hash, amount, lockPeriodId });

      const receipt = await tx.wait();
      logger.info('Stake confirmed', { txHash: receipt.transactionHash });

      return receipt.transactionHash;
    } catch (error) {
      logger.error('Failed to stake', { amount, lockPeriodId, error });
      throw error;
    }
  }

  async withdraw(stakeIndex: number): Promise<string> {
    if (!this.stakingContract || !this.wallet) {
      throw new Error('Staking contract or wallet not initialized');
    }

    try {
      const tx = await this.stakingContract.withdraw(stakeIndex);
      logger.info('Withdraw transaction sent', { txHash: tx.hash, stakeIndex });

      const receipt = await tx.wait();
      logger.info('Withdraw confirmed', { txHash: receipt.transactionHash });

      return receipt.transactionHash;
    } catch (error) {
      logger.error('Failed to withdraw', { stakeIndex, error });
      throw error;
    }
  }

  async claimRewards(stakeIndex: number): Promise<string> {
    if (!this.stakingContract || !this.wallet) {
      throw new Error('Staking contract or wallet not initialized');
    }

    try {
      const tx = await this.stakingContract.claimRewards(stakeIndex);
      logger.info('Claim rewards transaction sent', { txHash: tx.hash, stakeIndex });

      const receipt = await tx.wait();
      logger.info('Claim rewards confirmed', { txHash: receipt.transactionHash });

      return receipt.transactionHash;
    } catch (error) {
      logger.error('Failed to claim rewards', { stakeIndex, error });
      throw error;
    }
  }

  // ============================================================================
  // ARBITRAGE CONTRACT METHODS
  // ============================================================================

  async simulateArbitrage(
    loanAmount: string,
    buyRouter: string,
    sellRouter: string,
    buyPath: string[],
    sellPath: string[],
    minProfit: string
  ): Promise<ArbitrageSimulation> {
    if (!this.arbitrageContract) {
      throw new Error('Arbitrage contract not initialized');
    }

    try {
      const loanAmountWei = ethers.utils.parseEther(loanAmount);
      const minProfitWei = ethers.utils.parseEther(minProfit);

      const params = {
        buyRouter,
        sellRouter,
        buyPath,
        sellPath,
        minProfit: minProfitWei,
      };

      const result = await this.arbitrageContract.simulateArbitrage(loanAmountWei, params);

      const expectedProfit = ethers.utils.formatEther(result.expectedProfit);
      const profitPercentage = (parseFloat(expectedProfit) / parseFloat(loanAmount)) * 100;

      return {
        expectedProfit,
        profitable: result.profitable,
        profitPercentage,
      };
    } catch (error) {
      logger.error('Failed to simulate arbitrage', { error });
      throw error;
    }
  }

  async executeArbitrage(
    pool: string,
    amount0: string,
    amount1: string,
    buyRouter: string,
    sellRouter: string,
    buyPath: string[],
    sellPath: string[],
    minProfit: string
  ): Promise<string> {
    if (!this.arbitrageContract || !this.wallet) {
      throw new Error('Arbitrage contract or wallet not initialized');
    }

    try {
      const amount0Wei = ethers.utils.parseEther(amount0);
      const amount1Wei = ethers.utils.parseEther(amount1);
      const minProfitWei = ethers.utils.parseEther(minProfit);

      const params = {
        buyRouter,
        sellRouter,
        buyPath,
        sellPath,
        minProfit: minProfitWei,
      };

      const tx = await this.arbitrageContract.executeFlashLoanArbitrage(
        pool,
        amount0Wei,
        amount1Wei,
        params
      );

      logger.info('Arbitrage execution transaction sent', { txHash: tx.hash });

      const receipt = await tx.wait();
      logger.info('Arbitrage execution confirmed', { txHash: receipt.transactionHash });

      return receipt.transactionHash;
    } catch (error) {
      logger.error('Failed to execute arbitrage', { error });
      throw error;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async getBlockNumber(): Promise<number> {
    return this.provider.getBlockNumber();
  }

  async getGasPrice(): Promise<string> {
    const gasPrice = await this.provider.getGasPrice();
    return ethers.utils.formatUnits(gasPrice, 'gwei');
  }

  async getNativeBalance(address: string): Promise<string> {
    const balance = await this.provider.getBalance(address);
    return ethers.utils.formatEther(balance);
  }

  async estimateGas(tx: any): Promise<string> {
    const gasEstimate = await this.provider.estimateGas(tx);
    return gasEstimate.toString();
  }

  getWalletAddress(): string | undefined {
    return this.wallet?.address;
  }

  isWalletConnected(): boolean {
    return !!this.wallet;
  }

  isContractInitialized(contract: 'token' | 'staking' | 'arbitrage'): boolean {
    switch (contract) {
      case 'token':
        return !!this.tokenContract;
      case 'staking':
        return !!this.stakingContract;
      case 'arbitrage':
        return !!this.arbitrageContract;
      default:
        return false;
    }
  }
}

// Export singleton instance
let contractServiceInstance: ContractService | null = null;

export function initializeContractService(config: ContractConfig): ContractService {
  contractServiceInstance = new ContractService(config);
  return contractServiceInstance;
}

export function getContractService(): ContractService {
  if (!contractServiceInstance) {
    throw new Error('Contract service not initialized. Call initializeContractService first.');
  }
  return contractServiceInstance;
}

export default ContractService;
