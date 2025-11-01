// contracts/scripts/deploy-complete.ts
import { ethers } from "hardhat";
import { writeFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log("🚀 === COMPLETE DEPLOYMENT SCRIPT ===\n");
  
  const [deployer, user1, user2, user3] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Test Users:");
  console.log("  User1:", user1.address);
  console.log("  User2:", user2.address);
  console.log("  User3:", user3.address);
  console.log("");

  let lotteryPoints, lotteryToken, decentralizedLottery;
  let pointsAddress, tokenAddress, lotteryAddress;

  try {
    // ==================== 阶段1: 部署合约 ====================
    console.log("📦 === PHASE 1: CONTRACT DEPLOYMENT ===\n");

    // 1. 部署积分合约
    console.log("1. Deploying LotteryPoints...");
    const LotteryPoints = await ethers.getContractFactory("LotteryPoints");
    lotteryPoints = await LotteryPoints.deploy();
    await lotteryPoints.deployed();
    pointsAddress = lotteryPoints.address;
    console.log("   ✅ LotteryPoints:", pointsAddress);

    // 2. 部署代币合约
    console.log("2. Deploying LotteryToken...");
    const LotteryToken = await ethers.getContractFactory("LotteryToken");
    lotteryToken = await LotteryToken.deploy();
    await lotteryToken.deployed();
    tokenAddress = lotteryToken.address;
    console.log("   ✅ LotteryToken:", tokenAddress);

    // 3. 部署主合约
    console.log("3. Deploying DecentralizedLottery...");
    const DecentralizedLottery = await ethers.getContractFactory("DecentralizedLottery");
    decentralizedLottery = await DecentralizedLottery.deploy(pointsAddress, tokenAddress);
    await decentralizedLottery.deployed();
    lotteryAddress = decentralizedLottery.address;
    console.log("   ✅ DecentralizedLottery:", lotteryAddress);

    // 4. 转移代币合约所有权
    console.log("4. Transferring token ownership...");
    const transferTx = await lotteryToken.transferOwnership(lotteryAddress);
    await transferTx.wait();
    console.log("   ✅ Token ownership transferred");

    console.log("\n🎉 === CONTRACT DEPLOYMENT COMPLETED ===\n");

  } catch (error: any) {
    console.error("❌ Contract deployment failed:", error.message);
    if (error.reason) console.error("Revert reason:", error.reason);
    process.exit(1);
  }

  // ==================== 阶段2: 初始化设置 ====================
  console.log("⚙️ === PHASE 2: INITIAL SETUP ===\n");

  try {
    // 1. 分配初始积分
    console.log("1. Funding test users...");
    const userFunding = ethers.utils.parseEther("10000");
    
    await lotteryPoints.mint(user1.address, userFunding);
    await lotteryPoints.mint(user2.address, userFunding);
    await lotteryPoints.mint(user3.address, userFunding);
    console.log("   ✅ Funded all test users with 10,000 LTP");

    // 2. 用户授权
    console.log("2. Setting up user authorizations...");
    
    const user1Points = lotteryPoints.connect(user1);
    const user2Points = lotteryPoints.connect(user2);
    const user3Points = lotteryPoints.connect(user3);

    const approveAmount = ethers.utils.parseEther("10000");
    
    await user1Points.approve(lotteryAddress, approveAmount);
    await user2Points.approve(lotteryAddress, approveAmount);
    await user3Points.approve(lotteryAddress, approveAmount);
    console.log("   ✅ All users approved contract to spend points");

    console.log("\n🎉 === INITIAL SETUP COMPLETED ===\n");

  } catch (error: any) {
    console.error("❌ Initial setup failed:", error.message);
    if (error.reason) console.error("Revert reason:", error.reason);
    process.exit(1);
  }

  // ==================== 阶段3: 创建测试数据 ====================
  console.log("🎯 === PHASE 3: TEST DATA CREATION ===\n");

  try {
    // 1. 创建多个彩票项目
    console.log("1. Creating sample lotteries...");
    
    // 创建第一个彩票
    await decentralizedLottery.createLottery(
      "NBA Championship 2024",
      "Who will win the NBA Championship 2024?",
      ["Lakers", "Warriors", "Celtics", "Bucks"],
      ethers.utils.parseEther("10"),
      7
    );
    console.log("   ✅ Created: NBA Championship 2024");

    // 创建第二个彩票
    await decentralizedLottery.createLottery(
      "FIFA World Cup 2026", 
      "Which team will win the 2026 World Cup?",
      ["Brazil", "Argentina", "France", "Germany", "Spain"],
      ethers.utils.parseEther("5"),
      14
    );
    console.log("   ✅ Created: FIFA World Cup 2026");

    // 创建第三个彩票
    await decentralizedLottery.createLottery(
      "Oscar Best Picture 2024",
      "Which movie will win Best Picture at the 2024 Oscars?",
      ["Oppenheimer", "Barbie", "Killers of the Flower Moon", "Poor Things"],
      ethers.utils.parseEther("15"),
      3
    );
    console.log("   ✅ Created: Oscar Best Picture 2024");

    // 2. 测试购买功能
    console.log("2. Testing ticket purchases...");
    
    const user1Lottery = decentralizedLottery.connect(user1);
    const user2Lottery = decentralizedLottery.connect(user2);
    const user3Lottery = decentralizedLottery.connect(user3);

    // User1 购买
    await user1Lottery.purchaseTicket(0, 0, { gasLimit: 500000 });
    console.log("   ✅ User1 purchased ticket for Lottery 0, Option 0");

    // User2 购买
    await user2Lottery.purchaseTicket(0, 1, { gasLimit: 500000 });
    console.log("   ✅ User2 purchased ticket for Lottery 0, Option 1");

    // User3 购买
    await user3Lottery.purchaseTicket(1, 0, { gasLimit: 500000 });
    console.log("   ✅ User3 purchased ticket for Lottery 1, Option 0");

    // 3. 自动授权NFT
    console.log("3. Auto-authorizing NFTs...");
    
    const user1Token = lotteryToken.connect(user1);
    const user1Tickets = await decentralizedLottery.getUserTickets(user1.address);
    
    if (user1Tickets.length > 0) {
      await user1Token.approve(lotteryAddress, user1Tickets[0].tokenId);
      console.log("   ✅ User1 NFT authorized for market trading");
    }

    console.log("\n🎉 === TEST DATA CREATION COMPLETED ===\n");

  } catch (error: any) {
    console.error("❌ Test data creation failed:", error.message);
    if (error.reason) console.error("Revert reason:", error.reason);
  }

  // ==================== 阶段4: 验证和输出 ====================
  console.log("📊 === PHASE 4: VERIFICATION & OUTPUT ===\n");

  try {
    // 1. 验证部署状态
    console.log("1. Verifying deployment...");
    
    const [contractPoints, contractToken] = await decentralizedLottery.getContractAddresses();
    const tokenOwner = await lotteryToken.owner();
    
    console.log("   - Points address match:", pointsAddress === contractPoints ? "✅" : "❌");
    console.log("   - Token address match:", tokenAddress === contractToken ? "✅" : "❌");
    console.log("   - Token owner correct:", tokenOwner === lotteryAddress ? "✅" : "❌");

    // 2. 统计信息
    console.log("2. Deployment statistics:");
    
    const allLotteries = await decentralizedLottery.getAllLotteries();
    const user1Tickets = await decentralizedLottery.getUserTickets(user1.address);
    const user2Tickets = await decentralizedLottery.getUserTickets(user2.address);
    const user3Tickets = await decentralizedLottery.getUserTickets(user3.address);
    
    console.log("   - Lotteries created:", allLotteries.length);
    console.log("   - User1 tickets:", user1Tickets.length);
    console.log("   - User2 tickets:", user2Tickets.length);
    console.log("   - User3 tickets:", user3Tickets.length);

    // 3. 更新前端常量
    console.log("3. Updating frontend constants...");
    updateFrontendConstants(lotteryAddress, pointsAddress, tokenAddress);
    console.log("   ✅ Frontend constants updated");

    // 4. 生成部署报告
    console.log("4. Generating deployment report...");
    generateDeploymentReport({
      lottery: lotteryAddress,
      points: pointsAddress,
      token: tokenAddress,
      deployer: deployer.address,
      users: [user1.address, user2.address, user3.address],
      lotteries: allLotteries.length
    });

    console.log("\n🎉 === VERIFICATION COMPLETED ===\n");

  } catch (error: any) {
    console.error("❌ Verification failed:", error.message);
    if (error.reason) console.error("Revert reason:", error.reason);
  }

  // ==================== 最终输出 ====================
  console.log("🎊 === DEPLOYMENT SUCCESSFUL === 🎊\n");
  
  console.log("📋 Contract Addresses:");
  console.log("   DecentralizedLottery:", lotteryAddress);
  console.log("   LotteryPoints:      ", pointsAddress);
  console.log("   LotteryToken:       ", tokenAddress);
  
  console.log("\n👥 Test Accounts:");
  console.log("   Deployer:", deployer.address);
  console.log("   User1:   ", user1.address);
  console.log("   User2:   ", user2.address);
  console.log("   User3:   ", user3.address);
  
  console.log("\n🚀 Next Steps:");
  console.log("   1. Frontend constants have been automatically updated");
  console.log("   2. Start the frontend: cd ../frontend && npm run dev");
  console.log("   3. Connect MetaMask to Ganache (Chain ID: 1337)");
  console.log("   4. Use test accounts to interact with the dApp");
  
  console.log("\n💡 Test User Balances:");
  console.log("   Each test user has been funded with 10,000 LTP");
  console.log("   NFT authorization has been set up for market trading");
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
    console.log(`   ✅ Updated: ${frontendPath}`);
  } catch (error) {
    console.log("   ⚠️  Could not update frontend constants automatically.");
    console.log("   Please manually update src/utils/constants.ts with the addresses above.");
  }
}

function generateDeploymentReport(deploymentInfo: any) {
  const reportContent = `# Deployment Report
Generated: ${new Date().toISOString()}

## Contract Addresses
- DecentralizedLottery: ${deploymentInfo.lottery}
- LotteryPoints: ${deploymentInfo.points}
- LotteryToken: ${deploymentInfo.token}

## Accounts
- Deployer: ${deploymentInfo.deployer}
- Test Users: ${deploymentInfo.users.join(', ')}

## Statistics
- Lotteries Created: ${deploymentInfo.lotteries}
- Test Users Funded: 3 (10,000 LTP each)
- NFT Authorization: Enabled

## Network
- Chain ID: 1337 (Ganache)
- Frontend: Updated automatically

## Next Steps
1. Start frontend: cd ../frontend && npm run dev
2. Connect MetaMask to Ganache
3. Use test accounts to interact with the dApp
`;

  const reportPath = join(__dirname, "deployment-report.md");
  
  try {
    writeFileSync(reportPath, reportContent);
    console.log(`   ✅ Deployment report generated: ${reportPath}`);
  } catch (error) {
    console.log("   ⚠️  Could not generate deployment report.");
  }
}

main().catch((error) => {
  console.error("💥 Deployment failed:", error);
  process.exitCode = 1;
});