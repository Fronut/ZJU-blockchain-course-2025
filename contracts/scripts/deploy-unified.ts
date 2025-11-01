// scripts/deploy-unified.ts
import { ethers } from "hardhat";
import { writeFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log("🚀 === DEPLOYING UNIFIED CONTRACT SYSTEM ===\n");
  
  const [deployer, user1, user2, user3] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  try {
    // 方案1: 先部署积分和代币合约，然后手动设置到主合约
    console.log("1. Deploying LotteryPoints...");
    const LotteryPoints = await ethers.getContractFactory("LotteryPoints");
    const lotteryPoints = await LotteryPoints.deploy();
    await lotteryPoints.deployed();
    const pointsAddress = lotteryPoints.address;
    console.log("   ✅ LotteryPoints:", pointsAddress);

    console.log("2. Deploying LotteryToken...");
    const LotteryToken = await ethers.getContractFactory("LotteryToken");
    const lotteryToken = await LotteryToken.deploy();
    await lotteryToken.deployed();
    const tokenAddress = lotteryToken.address;
    console.log("   ✅ LotteryToken:", tokenAddress);

    console.log("3. Deploying DecentralizedLottery...");
    const DecentralizedLottery = await ethers.getContractFactory("DecentralizedLottery");
    const decentralizedLottery = await DecentralizedLottery.deploy();
    await decentralizedLottery.deployed();
    const lotteryAddress = decentralizedLottery.address;
    console.log("   ✅ DecentralizedLottery:", lotteryAddress);

    console.log("4. Setting up contract relationships...");
    
    // 转移代币合约所有权到主合约
    const transferTx = await lotteryToken.transferOwnership(lotteryAddress);
    await transferTx.wait();
    console.log("   ✅ Token ownership transferred");

    // 给测试用户分配积分
    console.log("5. Funding test users...");
    const userFunding = ethers.utils.parseEther("10000");
    
    await lotteryPoints.mint(user1.address, userFunding);
    await lotteryPoints.mint(user2.address, userFunding);
    await lotteryPoints.mint(user3.address, userFunding);
    console.log("   ✅ Funded all test users with 10000 LTP");

    // 给部署者也分配一些积分用于测试
    await lotteryPoints.mint(deployer.address, ethers.utils.parseEther("100000"));
    console.log("   ✅ Funded deployer with 100000 LTP");

    console.log("6. Verifying deployment...");
    
    // 检查合约地址一致性
    const [internalPoints, internalToken] = await decentralizedLottery.getContractAddresses();
    console.log("   - External Points:", pointsAddress);
    console.log("   - Internal Points:", internalPoints);
    console.log("   - Match?", pointsAddress.toLowerCase() === internalPoints.toLowerCase());
    
    console.log("   - External Token:", tokenAddress);
    console.log("   - Internal Token:", internalToken);
    console.log("   - Match?", tokenAddress.toLowerCase() === internalToken.toLowerCase());

    // 检查用户余额
    const user1Balance = await lotteryPoints.balanceOf(user1.address);
    console.log("   - User1 balance:", ethers.utils.formatEther(user1Balance), "LTP");

    console.log("7. Testing basic functionality...");
    
    // 用户授权
    const user1Points = lotteryPoints.connect(user1);
    const approveTx = await user1Points.approve(lotteryAddress, ethers.utils.parseEther("10000"));
    await approveTx.wait();
    console.log("   ✅ User1 approved lottery contract");

    // 创建测试彩票
    const createTx = await decentralizedLottery.createLottery(
      "Test Lottery",
      "Test lottery for verification",
      ["Option A", "Option B"],
      ethers.utils.parseEther("10"),
      7
    );
    await createTx.wait();
    console.log("   ✅ Created test lottery");

    // 测试购买
    const user1Lottery = decentralizedLottery.connect(user1);
    try {
      const purchaseTx = await user1Lottery.purchaseTicket(0, 0, { gasLimit: 500000 });
      await purchaseTx.wait();
      console.log("   ✅ PURCHASE SUCCESSFUL!");
      
      // 验证结果
      const lotteries = await decentralizedLottery.getAllLotteries();
      const testLottery = lotteries[0];
      console.log("   - Lottery pool:", ethers.utils.formatEther(testLottery.totalPool), "LTP");
      
    } catch (error: any) {
      console.log("   ❌ Purchase test failed:", error.reason || error.message);
    }

    console.log("8. Updating frontend constants...");
    updateFrontendConstants(lotteryAddress, pointsAddress, tokenAddress);
    console.log("   ✅ Frontend constants updated");

    console.log("\n🎉 === UNIFIED DEPLOYMENT COMPLETED ===\n");
    
    console.log("Contract addresses:");
    console.log("Lottery:", lotteryAddress);
    console.log("Points:", pointsAddress);
    console.log("Token:", tokenAddress);

  } catch (error: any) {
    console.error("❌ Deployment failed:", error.message);
    if (error.reason) console.error("Revert reason:", error.reason);
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
  } catch (error) {
    console.log("⚠️ Could not update frontend constants automatically.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});