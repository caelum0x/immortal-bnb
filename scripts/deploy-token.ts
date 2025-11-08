/**
 * Deploy IMMBOT Token Contract
 * Usage: npx hardhat run scripts/deploy-token.ts --network bscTestnet
 */

import { ethers } from "hardhat";
import { parseUnits } from "ethers";

async function main() {
  console.log("\n🚀 Deploying IMMBOT Token...\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} BNB\n`);

  if (balance === 0n) {
    throw new Error("Deployer account has no BNB for gas fees");
  }

  // Configuration
  const INITIAL_SUPPLY = 1_000_000_000; // 1 billion tokens
  console.log(`Initial supply: ${INITIAL_SUPPLY.toLocaleString()} IMMBOT\n`);

  // Deploy token
  console.log("Deploying IMMBotToken contract...");
  const IMMBotToken = await ethers.getContractFactory("IMMBotToken");
  const token = await IMMBotToken.deploy(INITIAL_SUPPLY);

  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();

  console.log("\n✅ IMMBotToken deployed successfully!");
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Contract Address: ${tokenAddress}`);
  console.log(`Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log(`Chain ID: ${(await ethers.provider.getNetwork()).chainId}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Total Supply: ${ethers.formatEther(await token.totalSupply())} IMMBOT`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // Wait for block confirmations (for verification)
  console.log("Waiting for 5 block confirmations...");
  await token.deploymentTransaction()?.wait(5);
  console.log("✅ Confirmed!\n");

  // Display next steps
  console.log("📝 Next Steps:");
  console.log(`1. Verify contract on BscScan:`);
  console.log(`   npx hardhat verify --network bscTestnet ${tokenAddress} ${INITIAL_SUPPLY}`);
  console.log(`\n2. Add to .env file:`);
  console.log(`   IMMBOT_TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`\n3. Add to frontend .env:`);
  console.log(`   NEXT_PUBLIC_IMMBOT_TOKEN_TESTNET=${tokenAddress}`);
  console.log(`\n4. Deploy staking contract:`);
  console.log(`   npx hardhat run scripts/deploy-staking.ts --network bscTestnet`);
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    tokenAddress,
    deployer: deployer.address,
    initialSupply: INITIAL_SUPPLY,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  console.log("\n📄 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
