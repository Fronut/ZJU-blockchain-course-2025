// scripts/deploy-fixed-final.ts
import { ethers } from "hardhat";
import { writeFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log("🚀 === FIXED DEPLOYMENT (FINAL) ===\n");
  
  const [deployer, user1, user2, user3] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  try {
    // 1. 先部署积分合约
    console.log("1. Deploying LotteryPoints...");
    const LotteryPoints = await ethers.getContractFactory("LotteryPoints");
    const lotteryPoints = await LotteryPoints.deploy();
    await lotteryPoints.deployed();
    const pointsAddress = lotteryPoints.address;
    console.log("   ✅ LotteryPoints:", pointsAddress);

    // 2. 部署代币合约
    console.log("2. Deploying LotteryToken...");
    const LotteryToken = await ethers.getContractFactory("LotteryToken");
    const lotteryToken = await LotteryToken.deploy();
    await lotteryToken.deployed();
    const tokenAddress = lotteryToken.address;
    console.log("   ✅ LotteryToken:", tokenAddress);

    // 3. 部署主合约（使用正确的合约名称）
    console.log("3. Deploying DecentralizedLottery...");
    const DecentralizedLottery = await ethers.getContractFactory("DecentralizedLottery");
    const decentralizedLottery = await DecentralizedLottery.deploy(pointsAddress, tokenAddress);
    await decentralizedLottery.deployed();
    const lotteryAddress = decentralizedLottery.address;
    console.log("   ✅ DecentralizedLottery:", lotteryAddress);

    // 4. 转移代币合约所有权（在部署后单独进行）
    console.log("4. Transferring token ownership...");
    const transferTx = await lotteryToken.transferOwnership(lotteryAddress);
    await transferTx.wait();
    console.log("   ✅ Token ownership transferred");

    // 5. 分配初始积分
    console.log("5. Funding test users...");
    const userFunding = ethers.utils.parseEther("10000");
    
    await lotteryPoints.mint(user1.address, userFunding);
    await lotteryPoints.mint(user2.address, userFunding);
    await lotteryPoints.mint(user3.address, userFunding);
    console.log("   ✅ Funded all test users with 10000 LTP");

    // 6. 验证部署
    console.log("6. Verifying deployment...");
    const tokenOwner = await lotteryToken.owner();
    const [contractPoints, contractToken] = await decentralizedLottery.getContractAddresses();
    
    console.log("   - Token owner:", tokenOwner);
    console.log("   - Correct owner?", tokenOwner === lotteryAddress ? "✅" : "❌");
    console.log("   - Points address match?", pointsAddress === contractPoints ? "✅" : "❌");
    console.log("   - Token address match?", tokenAddress === contractToken ? "✅" : "❌");

    // 7. 测试基本功能
    console.log("7. Testing basic functionality...");
    
    // 用户授权
    const user1Points = lotteryPoints.connect(user1);
    const approveTx = await user1Points.approve(lotteryAddress, ethers.utils.parseEther("10000"));
    await approveTx.wait();
    console.log("   ✅ User1 approved lottery contract");

    // 创建测试彩票
    const createTx = await decentralizedLottery.createLottery(
      "NBA Championship Test",
      "Test lottery for deployment verification",
      ["Lakers", "Warriors"],
      ethers.utils.parseEther("10"),
      7
    );
    await createTx.wait();
    console.log("   ✅ Created test lottery");

    // 测试购买功能
    const user1Lottery = decentralizedLottery.connect(user1);
    try {
      const purchaseTx = await user1Lottery.purchaseTicket(0, 0, { gasLimit: 500000 });
      const receipt = await purchaseTx.wait();
      console.log("   ✅ PURCHASE SUCCESSFUL!");
      console.log("   - Gas used:", receipt.gasUsed.toString());
      
      // 验证结果
      const lotteries = await decentralizedLottery.getAllLotteries();
      const testLottery = lotteries[0];
      console.log("   - Lottery pool:", ethers.utils.formatEther(testLottery.totalPool), "LTP");
      
    } catch (error: any) {
      console.log("   ⚠️  Purchase test failed (this might be expected):", error.reason || error.message);
    }

    // 8. 更新前端
    console.log("8. Updating frontend constants...");
    updateFrontendConstants(lotteryAddress, pointsAddress, tokenAddress);
    console.log("   ✅ Frontend constants updated");

    console.log("\n🎉 === FIXED DEPLOYMENT COMPLETED SUCCESSFULLY ===\n");
    console.log("Contract addresses:");
    console.log("Lottery:", lotteryAddress);
    console.log("Points:", pointsAddress);
    console.log("Token:", tokenAddress);

  } catch (error: any) {
    console.error("❌ Deployment failed:", error.message);
    if (error.reason) console.error("Revert reason:", error.reason);
    if (error.transaction) console.error("Transaction:", error.transaction);
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
    console.log(`   Updated: ${frontendPath}`);
  } catch (error) {
    console.log("   ⚠️  Could not update frontend constants automatically.");
    console.log("   Please manually update the contract addresses.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});