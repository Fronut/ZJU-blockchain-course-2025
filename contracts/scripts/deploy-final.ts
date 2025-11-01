// scripts/deploy-final.ts
import { ethers } from "hardhat";
import { writeFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log("Deploying final fixed contracts...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  try {
    // 1. 部署积分合约
    console.log("Deploying LotteryPoints...");
    const LotteryPoints = await ethers.getContractFactory("LotteryPoints");
    const lotteryPoints = await LotteryPoints.deploy();
    await lotteryPoints.deployed();
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
    
    // 检查初始余额
    const deployerBalance = await lotteryPoints.balanceOf(deployer.address);
    console.log("Deployer initial balance:", ethers.utils.formatEther(deployerBalance), "LTP");
    
    const totalSupply = await lotteryPoints.totalSupply();
    console.log("Total supply:", ethers.utils.formatEther(totalSupply), "LTP");

    const hasClaimed = await lotteryPoints.hasClaimed(deployer.address);
    console.log("Deployer has claimed:", hasClaimed);

    // 6. 测试领取功能
    console.log("\n=== Testing Claim Function ===");
    try {
      const claimTx = await lotteryPoints.claimPoints();
      await claimTx.wait();
      console.log("✅ Claim test successful");
      
      const newBalance = await lotteryPoints.balanceOf(deployer.address);
      console.log("New balance after claim:", ethers.utils.formatEther(newBalance), "LTP");
    } catch (claimError: any) {
      console.error("❌ Claim test failed:", claimError.message);
    }

    // 7. 更新前端常量
    updateFrontendConstants(lotteryAddress, pointsAddress, tokenAddress);
    
    console.log("\n✅ Final deployment completed!");

  } catch (error: any) {
    console.error("❌ Deployment failed:", error.message);
    if (error.reason) {
      console.error("Revert reason:", error.reason);
    }
  }
}

function updateFrontendConstants(lottery: string, points: string, token: string) {
  const constantsContent = `// src/utils/constants.ts
export const CONTRACT_ADDRESSES = {
  lottery: "${lottery}",
  points: "${points}", 
  token: "${token}"
};

export const SUPPORTED_CHAINS = {
  1337: "Ganache Local",
  31337: "Hardhat Network"
};

export const LOTTERY_STATUS_MAP = {
  0: "Active",
  1: "Drawn", 
  2: "Refunded"
};

export const TICKET_STATUS_MAP = {
  0: "Ready",
  1: "On Sale",
  2: "Winning",
  3: "Losing"
};
`;

  const frontendPath = join(__dirname, "..", "..", "frontend", "src", "utils", "constants.ts");
  
  try {
    writeFileSync(frontendPath, constantsContent);
    console.log(`✅ Updated frontend constants at: ${frontendPath}`);
  } catch (error) {
    console.log("⚠️ Could not update frontend constants automatically.");
    console.log("Please manually update with the addresses above.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});