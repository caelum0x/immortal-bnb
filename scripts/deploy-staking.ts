/**
 * Deploy IMMBOT Staking Contract
 * Usage: npx hardhat run scripts/deploy-staking.ts --network bscTestnet
 *
 * Prerequisites: IMMBOT Token must be deployed first
 */

import { ethers } from "hardhat";

async function main() {
  console.log("\n🚀 Deploying IMMBOT Staking Contract...\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer account found");
  }
  console.log(`Deploying with account: ${deployer.address}`);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} BNB\n`);

  if (balance === 0n) {
    throw new Error("Deployer account has no BNB for gas fees");
  }

  // Get token address from environment or prompt
  const tokenAddress = process.env.IMMBOT_TOKEN_ADDRESS;

  if (!tokenAddress) {
    throw new Error(
      "IMMBOT_TOKEN_ADDRESS not set in .env file. Deploy token first using scripts/deploy-token.ts"
    );
  }

  console.log(`IMMBOT Token Address: ${tokenAddress}\n`);

  // Verify token contract exists
  const code = await ethers.provider.getCode(tokenAddress);
  if (code === "0x") {
    throw new Error(`No contract found at address ${tokenAddress}`);
  }

  // Deploy staking contract
  console.log("Deploying IMMBotStaking contract...");
  const IMMBotStaking = await ethers.getContractFactory("IMMBotStaking");
  const staking = await IMMBotStaking.deploy(tokenAddress);

  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();

  console.log("\n✅ IMMBotStaking deployed successfully!");
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Contract Address: ${stakingAddress}`);
  console.log(`Token Address: ${tokenAddress}`);
  console.log(`Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log(`Chain ID: ${(await ethers.provider.getNetwork()).chainId}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // Check staking tiers
  console.log("📊 Default Staking Tiers:");
  for (let i = 0; i < 4; i++) {
    const tiers = staking.tiers;
    if (!tiers) {
      break;
    }
    const tier = await tiers(i);
    const durationDays = Number(tier.duration) / 86400;
    const apy = Number(tier.apyBasisPoints) / 100;
    console.log(`  Tier ${i}: ${durationDays} days - ${apy}% APY${tier.active ? " (Active)" : ""}`);
  }
  console.log("");

  // Wait for block confirmations (for verification)
  console.log("Waiting for 5 block confirmations...");
  await staking.deploymentTransaction()?.wait(5);
  console.log("✅ Confirmed!\n");

  // Display next steps
  console.log("📝 Next Steps:");
  console.log(`1. Verify contract on BscScan:`);
  console.log(`   npx hardhat verify --network bscTestnet ${stakingAddress} ${tokenAddress}`);
  console.log(`\n2. Set staking contract in token contract:`);
  console.log(`   Call setStakingContract(${stakingAddress}) on token contract`);
  console.log(`\n3. Add to .env file:`);
  console.log(`   STAKING_CONTRACT_ADDRESS=${stakingAddress}`);
  console.log(`\n4. Add to frontend .env:`);
  console.log(`   NEXT_PUBLIC_STAKING_TESTNET=${stakingAddress}`);
  console.log(`\n5. Test staking functionality:`);
  console.log(`   - Approve token spending`);
  console.log(`   - Stake tokens`);
  console.log(`   - Check pending rewards`);
  console.log(`   - Unstake tokens`);
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    stakingAddress,
    tokenAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  console.log("\n📄 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("");

  // Optional: Set staking contract on token if we have access
  console.log("🔗 Setting staking contract on token...");
  try {
    const token = await ethers.getContractAt("IMMBotToken", tokenAddress);
    const setStakingContract = token.setStakingContract;
    if (!setStakingContract) {
      throw new Error("setStakingContract method not found");
    }
    const tx = await setStakingContract(stakingAddress);
    await tx.wait();
    console.log("✅ Staking contract set on token successfully!\n");
  } catch (error) {
    console.log("⚠️  Could not set staking contract on token automatically.");
    console.log("   You may need to call setStakingContract() manually.\n");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
