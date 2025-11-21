/**
 * Interact with deployed IMMBOT contracts
 * Usage: npx hardhat run scripts/interact-contracts.ts --network bscTestnet
 */

import { ethers } from "hardhat";

async function main() {
  console.log("\n🔗 Interacting with IMMBOT Contracts...\n");

  // Get signer
  const [signer] = await ethers.getSigners();
  if (!signer) {
    throw new Error("No signer account found");
  }
  console.log(`Using account: ${signer.address}`);

  const balance = await ethers.provider.getBalance(signer.address);
  console.log(`BNB Balance: ${ethers.formatEther(balance)} BNB\n`);

  // Get contract addresses from environment
  const tokenAddress = process.env.IMMBOT_TOKEN_ADDRESS;
  const stakingAddress = process.env.STAKING_CONTRACT_ADDRESS;

  if (!tokenAddress || !stakingAddress) {
    throw new Error(
      "Contract addresses not set in .env. Please set IMMBOT_TOKEN_ADDRESS and STAKING_CONTRACT_ADDRESS"
    );
  }

  console.log(`Token Address: ${tokenAddress}`);
  console.log(`Staking Address: ${stakingAddress}\n`);

  // Get contract instances
  const token = await ethers.getContractAt("IMMBotToken", tokenAddress);
  const staking = await ethers.getContractAt("IMMBotStaking", stakingAddress);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 Token Information");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const nameMethod = token.name;
  const symbolMethod = token.symbol;
  const decimalsMethod = token.decimals;
  const totalSupplyMethod = token.totalSupply;
  const balanceOfMethod = token.balanceOf;
  
  if (!nameMethod || !symbolMethod || !decimalsMethod || !totalSupplyMethod || !balanceOfMethod) {
    throw new Error("Token contract methods not available");
  }
  
  const name = await nameMethod();
  const symbol = await symbolMethod();
  const decimals = await decimalsMethod();
  const totalSupply = await totalSupplyMethod();
  const userBalance = await balanceOfMethod(signer.address);

  console.log(`Name: ${name}`);
  console.log(`Symbol: ${symbol}`);
  console.log(`Decimals: ${decimals}`);
  console.log(`Total Supply: ${ethers.formatEther(totalSupply)} ${symbol}`);
  console.log(`Your Balance: ${ethers.formatEther(userBalance)} ${symbol}\n`);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🏦 Staking Information");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const totalStakedMethod = staking.totalStaked;
  const rewardPoolMethod = staking.rewardPool;
  const minStakeMethod = staking.MIN_STAKE;
  
  if (!totalStakedMethod || !rewardPoolMethod || !minStakeMethod) {
    throw new Error("Staking contract methods not available");
  }
  
  const totalStaked = await totalStakedMethod();
  const rewardPool = await rewardPoolMethod();
  const minStake = await minStakeMethod();

  console.log(`Total Staked: ${ethers.formatEther(totalStaked)} ${symbol}`);
  console.log(`Reward Pool: ${ethers.formatEther(rewardPool)} ${symbol}`);
  console.log(`Minimum Stake: ${ethers.formatEther(minStake)} ${symbol}\n`);

  console.log("Staking Tiers:");
  const tiersMethod = staking.tiers;
  if (tiersMethod) {
    for (let i = 0; i < 4; i++) {
      try {
        const tier = await tiersMethod(i);
        const durationDays = Number(tier.duration) / 86400;
        const apy = Number(tier.apyBasisPoints) / 100;
        console.log(
          `  Tier ${i}: ${durationDays} days - ${apy}% APY${tier.active ? " ✅" : " ❌"}`
        );
      } catch {
        break;
      }
    }
  }
  console.log("");

  // Get user stakes
  const getUserStakesMethod = staking.getUserStakes;
  const getPendingRewardsMethod = staking.getPendingRewards;
  const calculateRewardMethod = staking.calculateReward;
  
  if (!getUserStakesMethod || !getPendingRewardsMethod || !calculateRewardMethod) {
    throw new Error("Staking contract methods not available");
  }
  
  const userStakes = await getUserStakesMethod(signer.address);
  const pendingRewards = await getPendingRewardsMethod(signer.address);

  console.log(`Your Stakes: ${userStakes.length}`);
  if (userStakes.length > 0) {
    for (let i = 0; i < userStakes.length; i++) {
      const stake = userStakes[i];
      if (Number(stake.amount) > 0) {
        const reward = await calculateRewardMethod(signer.address, i);
        const tiersMethod = staking.tiers;
        if (!tiersMethod) {
          throw new Error("tiers method not available");
        }
        const tier = await tiersMethod(stake.tier);
        const durationDays = Number(tier.duration) / 86400;
        const stakedTime = Math.floor(
          (Date.now() / 1000 - Number(stake.stakedAt)) / 86400
        );

        console.log(`\n  Stake #${i}:`);
        console.log(`    Amount: ${ethers.formatEther(stake.amount)} ${symbol}`);
        console.log(`    Tier: ${stake.tier} (${durationDays} days)`);
        console.log(`    Staked: ${stakedTime} days ago`);
        console.log(`    Pending Reward: ${ethers.formatEther(reward)} ${symbol}`);
      }
    }
  }

  console.log(`\nTotal Pending Rewards: ${ethers.formatEther(pendingRewards)} ${symbol}\n`);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("⚙️  Available Actions");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("To perform actions, use these commands:\n");

  console.log("1. Approve staking contract to spend tokens:");
  console.log(`   npx hardhat run scripts/actions/approve.ts --network bscTestnet\n`);

  console.log("2. Stake tokens:");
  console.log(`   npx hardhat run scripts/actions/stake.ts --network bscTestnet\n`);

  console.log("3. Unstake tokens:");
  console.log(`   npx hardhat run scripts/actions/unstake.ts --network bscTestnet\n`);

  console.log("4. Add rewards to staking pool:");
  console.log(`   npx hardhat run scripts/actions/add-rewards.ts --network bscTestnet\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:");
    console.error(error);
    process.exit(1);
  });
