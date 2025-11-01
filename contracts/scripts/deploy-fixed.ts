// scripts/deploy-fixed.ts
import { ethers } from "hardhat";

async function deployFixed() {
  console.log("Deploying fixed contracts...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // 1. 部署积分合约
  console.log("Deploying LotteryPoints...");
  const LotteryPoints = await ethers.getContractFactory("LotteryPoints");
  const lotteryPoints = await LotteryPoints.deploy();
  await lotteryPoints.waitForDeployment();
  const pointsAddress = await lotteryPoints.getAddress();
  console.log("LotteryPoints deployed to:", pointsAddress);

  // 2. 部署代币合约
  console.log("Deploying LotteryToken...");
  const LotteryToken = await ethers.getContractFactory("LotteryToken");
  const lotteryToken = await LotteryToken.deploy();
  await lotteryToken.waitForDeployment();
  const tokenAddress = await lotteryToken.getAddress();
  console.log("LotteryToken deployed to:", tokenAddress);

  // 3. 部署主合约
  console.log("Deploying DecentralizedLottery...");
  const DecentralizedLottery = await ethers.getContractFactory("DecentralizedLottery");
  const decentralizedLottery = await DecentralizedLottery.deploy();
  await decentralizedLottery.waitForDeployment();
  const lotteryAddress = await decentralizedLottery.getAddress();
  console.log("DecentralizedLottery deployed to:", lotteryAddress);

  // 4. 转移代币合约所有权
  console.log("Transferring token ownership...");
  const transferTx = await lotteryToken.transferOwnership(lotteryAddress);
  await transferTx.wait();
  console.log("Token ownership transferred");

  // 5. 验证部署
  console.log("\n=== Verification ===");
  const pointsOwner = await lotteryPoints.owner();
  console.log("Points owner:", pointsOwner);
  console.log("Is deployer points owner?", pointsOwner === deployer.address);

  const tokenOwner = await lotteryToken.owner();
  console.log("Token owner:", tokenOwner);
  console.log("Is main contract token owner?", tokenOwner === lotteryAddress);

  console.log("\n✅ Fixed deployment completed!");
  console.log("Update frontend constants:");
  console.log("Lottery:", lotteryAddress);
  console.log("Points:", pointsAddress);
  console.log("Token:", tokenAddress);
}

deployFixed().catch(console.error);