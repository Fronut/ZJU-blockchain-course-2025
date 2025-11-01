// scripts/deploy-with-constructor-args.ts
import { ethers } from "hardhat";
import { writeFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log("🚀 === DEPLOYING WITH CONSTRUCTOR ARGUMENTS ===\n");
  
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

    // 3. 部署主合约（使用构造函数参数）
    console.log("3. Deploying DecentralizedLottery with constructor arguments...");
    const DecentralizedLottery = await ethers.getContractFactory("DecentralizedLottery");
    const decentralizedLottery = await DecentralizedLottery.deploy(pointsAddress, tokenAddress);
    await decentralizedLottery.deployed();
    const lotteryAddress = decentralizedLottery.address;
    console.log("   ✅ DecentralizedLottery:", lotteryAddress);

    // 4. 分配积分
    console.log("4. Funding test users...");
    const userFunding = ethers.utils.parseEther("10000");
    
    await lotteryPoints.mint(user1.address, userFunding);
    await lotteryPoints.mint(user2.address, userFunding);
    await lotteryPoints.mint(user3.address, userFunding);
    console.log("   ✅ Funded all test users with 10000 LTP");

    // 5. 验证合约地址一致性
    console.log("5. Verifying contract addresses...");
    const [internalPoints, internalToken] = await decentralizedLottery.getContractAddresses();
    
    console.log("   - External Points:", pointsAddress);
    console.log("   - Internal Points:", internalPoints);
    console.log("   - Match?", pointsAddress.toLowerCase() === internalPoints.toLowerCase());
    
    console.log("   - External Token:", tokenAddress);
    console.log("   - Internal Token:", internalToken);
    console.log("   - Match?", tokenAddress.toLowerCase() === internalToken.toLowerCase());

    if (pointsAddress.toLowerCase() === internalPoints.toLowerCase() && 
        tokenAddress.toLowerCase() === internalToken.toLowerCase()) {
      console.log("   🎉 ALL ADDRESSES MATCH!");
    } else {
      console.log("   ❌ Address mismatch detected!");
      return;
    }

    // 6. 测试购买功能
    console.log("6. Testing purchase functionality...");
    
    // 用户授权
    const user1Points = lotteryPoints.connect(user1);
    const approveTx = await user1Points.approve(lotteryAddress, ethers.utils.parseEther("10000"));
    await approveTx.wait();
    console.log("   ✅ User1 approved lottery contract");

    // 创建测试彩票
    const createTx = await decentralizedLottery.createLottery(
      "NBA Championship Test",
      "Test lottery for purchase verification",
      ["Lakers", "Warriors"],
      ethers.utils.parseEther("10"),
      7
    );
    await createTx.wait();
    console.log("   ✅ Created test lottery");

    // 测试购买
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
      console.log("   - Option counts:", testLottery.optionCounts.map((c: any) => c.toString()));
      
    } catch (error: any) {
      console.log("   ❌ Purchase failed:", error.reason || error.message);
      console.log("   🔍 Debug info:");
      console.log("   - User1 balance:", ethers.utils.formatEther(await lotteryPoints.balanceOf(user1.address)), "LTP");
      console.log("   - User1 allowance:", ethers.utils.formatEther(await lotteryPoints.allowance(user1.address, lotteryAddress)), "LTP");
    }

    // 7. 更新前端
    console.log("7. Updating frontend constants...");
    updateFrontendConstants(lotteryAddress, pointsAddress, tokenAddress);
    console.log("   ✅ Frontend constants updated");

    console.log("\n🎉 === DEPLOYMENT WITH CONSTRUCTOR ARGUMENTS COMPLETED ===\n");

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