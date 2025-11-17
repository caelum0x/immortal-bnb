/**
 * Smart Contract ABIs for Immortal BNB
 *
 * These ABIs are manually extracted from the Solidity contracts.
 * In production, these should be auto-generated from compiled artifacts.
 */

export const IMMBOT_TOKEN_ABI = [
  // ERC20 Standard Functions
  {
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "recipient", type: "address" }, { name: "amount", type: "uint256" }],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "sender", type: "address" }, { name: "recipient", type: "address" }, { name: "amount", type: "uint256" }],
    name: "transferFrom",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // IMMBOT Specific Functions
  {
    inputs: [],
    name: "liquidityWallet",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "stakingContract",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "isExemptFromTax",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "TAX_PERCENTAGE",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "BURN_PERCENTAGE",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "LIQUIDITY_PERCENTAGE",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "_liquidityWallet", type: "address" }],
    name: "setLiquidityWallet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_stakingContract", type: "address" }],
    name: "setStakingContract",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }, { name: "exempt", type: "bool" }],
    name: "setTaxExemption",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: false, name: "burnAmount", type: "uint256" },
      { indexed: false, name: "liquidityAmount", type: "uint256" },
    ],
    name: "TaxCollected",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "owner", type: "address" },
      { indexed: true, name: "spender", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
    name: "Approval",
    type: "event",
  },
] as const;

export const STAKING_CONTRACT_ABI = [
  // View Functions
  {
    inputs: [],
    name: "stakingToken",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "rewardToken",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "baseAPY",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "minimumStakeAmount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalStaked",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalRewardsPaid",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalStakers",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "uint256" }],
    name: "lockPeriods",
    outputs: [
      { name: "duration", type: "uint256" },
      { name: "multiplier", type: "uint256" },
      { name: "name", type: "string" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "lockPeriodsCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }, { name: "index", type: "uint256" }],
    name: "userStakes",
    outputs: [
      { name: "amount", type: "uint256" },
      { name: "stakingTime", type: "uint256" },
      { name: "unlockTime", type: "uint256" },
      { name: "lockPeriodId", type: "uint256" },
      { name: "accumulatedReward", type: "uint256" },
      { name: "lastRewardTime", type: "uint256" },
      { name: "isActive", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "userStakeCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "userTotalStaked",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "userTotalRewards",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }, { name: "stakeIndex", type: "uint256" }],
    name: "calculateRewards",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserStakes",
    outputs: [
      {
        components: [
          { name: "amount", type: "uint256" },
          { name: "stakingTime", type: "uint256" },
          { name: "unlockTime", type: "uint256" },
          { name: "lockPeriodId", type: "uint256" },
          { name: "accumulatedReward", type: "uint256" },
          { name: "lastRewardTime", type: "uint256" },
          { name: "isActive", type: "bool" },
        ],
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllLockPeriods",
    outputs: [
      {
        components: [
          { name: "duration", type: "uint256" },
          { name: "multiplier", type: "uint256" },
          { name: "name", type: "string" },
        ],
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  // State-Changing Functions
  {
    inputs: [{ name: "amount", type: "uint256" }, { name: "lockPeriodId", type: "uint256" }],
    name: "stake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "stakeIndex", type: "uint256" }],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "stakeIndex", type: "uint256" }],
    name: "claimRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "stakeIndex", type: "uint256" }],
    name: "emergencyWithdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Admin Functions
  {
    inputs: [{ name: "newAPY", type: "uint256" }],
    name: "setBaseAPY",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "setMinimumStakeAmount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "lockPeriodId", type: "uint256" },
      { indexed: false, name: "stakeIndex", type: "uint256" },
    ],
    name: "Staked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "rewards", type: "uint256" },
      { indexed: false, name: "stakeIndex", type: "uint256" },
    ],
    name: "Withdrawn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "stakeIndex", type: "uint256" },
    ],
    name: "RewardsClaimed",
    type: "event",
  },
] as const;

export const FLASH_LOAN_ARBITRAGE_ABI = [
  // View Functions
  {
    inputs: [
      { name: "loanAmount", type: "uint256" },
      {
        components: [
          { name: "buyRouter", type: "address" },
          { name: "sellRouter", type: "address" },
          { name: "buyPath", type: "address[]" },
          { name: "sellPath", type: "address[]" },
          { name: "minProfit", type: "uint256" },
        ],
        name: "params",
        type: "tuple",
      },
    ],
    name: "simulateArbitrage",
    outputs: [
      { name: "expectedProfit", type: "uint256" },
      { name: "profitable", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // State-Changing Functions
  {
    inputs: [
      { name: "pool", type: "address" },
      { name: "amount0", type: "uint256" },
      { name: "amount1", type: "uint256" },
      {
        components: [
          { name: "buyRouter", type: "address" },
          { name: "sellRouter", type: "address" },
          { name: "buyPath", type: "address[]" },
          { name: "sellPath", type: "address[]" },
          { name: "minProfit", type: "uint256" },
        ],
        name: "params",
        type: "tuple",
      },
    ],
    name: "executeFlashLoanArbitrage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "fee0", type: "uint256" },
      { name: "fee1", type: "uint256" },
      { name: "data", type: "bytes" },
    ],
    name: "pancakeV3FlashCallback",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "token", type: "address" }],
    name: "withdrawProfit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawNative",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "router", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approveRouter",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "token", type: "address" },
      { indexed: false, name: "loanAmount", type: "uint256" },
      { indexed: false, name: "profit", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
    name: "ArbitrageExecuted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "token", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "ProfitWithdrawn",
    type: "event",
  },
] as const;

// Type exports for TypeScript
export type IMMBotTokenABI = typeof IMMBOT_TOKEN_ABI;
export type StakingContractABI = typeof STAKING_CONTRACT_ABI;
export type FlashLoanArbitrageABI = typeof FLASH_LOAN_ARBITRAGE_ABI;
