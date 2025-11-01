// scripts/deploy-fixed.ts
import { ethers } from "hardhat";

async function deployFixed() {
  console.log("Deploying fixed contracts...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  try {
    // 1. 部署积分合约
    console.log("Deploying LotteryPoints...");
    const LotteryPoints = await ethers.getContractFactory("LotteryPoints");
    const lotteryPoints = await LotteryPoints.deploy();
    await lotteryPoints.deployed(); // 使用 deployed() 而不是 waitForDeployment()
    const pointsAddress = lotteryPoints.address;
    console.log("LotteryPoints deployed to:", pointsAddress);

    // 2. 部署代币合约
    console.log("Deploying LotteryToken...");
    const LotteryToken = await ethers.getContractFactory("LotteryToken");
    const lotteryToken = await LotteryToken.deploy();
    await lotteryToken.deployed();
    const tokenAddress = lotteryToken.address;
    console.log("LotteryToken deployed to:", tokenAddress);

    // 3. 部署主合约
    console.log("Deploying DecentralizedLottery...");
    const DecentralizedLottery = await ethers.getContractFactory("DecentralizedLottery");
    const decentralizedLottery = await DecentralizedLottery.deploy();
    await decentralizedLottery.deployed();
    const lotteryAddress = decentralizedLottery.address;
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

    // 6. 检查初始状态
    console.log("\n=== Initial State ===");
    const pointsBalance = await lotteryPoints.balanceOf(deployer.address);
    console.log("Deployer points balance:", pointsBalance.toString());
    
    const totalSupply = await lotteryPoints.totalSupply();
    console.log("Total points supply:", totalSupply.toString());

    const hasClaimed = await lotteryPoints.hasClaimed(deployer.address);
    console.log("Deployer has claimed:", hasClaimed);

    console.log("\n✅ Fixed deployment completed!");
    console.log("Update frontend constants:");
    console.log("Lottery:", lotteryAddress);
    console.log("Points:", pointsAddress);
    console.log("Token:", tokenAddress);

  } catch (error: any) {
    console.error("❌ Deployment failed:", error.message);
    if (error.reason) {
      console.error("Revert reason:", error.reason);
    }
  }
}

deployFixed().catch(console.error);