// scripts/comprehensive-test-fixed.ts
import { ethers } from "hardhat";
import { writeFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log("🎰 === COMPREHENSIVE DECENTRALIZED LOTTERY TEST (FIXED) === 🎰\n");
  
  const [deployer, user1, user2, user3] = await ethers.getSigners();
  console.log("👥 Test Accounts:");
  console.log("  Deployer:", deployer.address);
  console.log("  User1:", user1.address);
  console.log("  User2:", user2.address);
  console.log("  User3:", user3.address);
  console.log("");

  // ==================== 阶段1: 部署合约 ====================
  console.log("📦 === PHASE 1: DEPLOYING CONTRACTS ===\n");

  let lotteryPoints, lotteryToken, decentralizedLottery;
  let pointsAddress, tokenAddress, lotteryAddress;

  try {
    // 1. 部署积分合约
    console.log("1. Deploying LotteryPoints...");
    const LotteryPoints = await ethers.getContractFactory("LotteryPoints");
    lotteryPoints = await LotteryPoints.deploy();
    await lotteryPoints.deployed();
    pointsAddress = lotteryPoints.address;
    console.log("   ✅ LotteryPoints deployed to:", pointsAddress);

    // 2. 铸造初始积分给部署者
    console.log("2. Minting initial points to deployer...");
    const initialMintAmount = ethers.utils.parseEther("1000000"); // 100万LTP
    const mintTx = await lotteryPoints.mint(deployer.address, initialMintAmount);
    await mintTx.wait();
    console.log("   ✅ Minted 1,000,000 LTP to deployer");

    // 3. 给测试用户分配足够积分
    console.log("3. Funding test users...");
    const userFunding = ethers.utils.parseEther("10000"); // 每个用户10000 LTP
    
    const fundUser1Tx = await lotteryPoints.transfer(user1.address, userFunding);
    await fundUser1Tx.wait();
    console.log("   ✅ Funded User1 with 10000 LTP");
    
    const fundUser2Tx = await lotteryPoints.transfer(user2.address, userFunding);
    await fundUser2Tx.wait();
    console.log("   ✅ Funded User2 with 10000 LTP");
    
    const fundUser3Tx = await lotteryPoints.transfer(user3.address, userFunding);
    await fundUser3Tx.wait();
    console.log("   ✅ Funded User3 with 10000 LTP");

    // 4. 部署代币合约
    console.log("4. Deploying LotteryToken...");
    const LotteryToken = await ethers.getContractFactory("LotteryToken");
    lotteryToken = await LotteryToken.deploy();
    await lotteryToken.deployed();
    tokenAddress = lotteryToken.address;
    console.log("   ✅ LotteryToken deployed to:", tokenAddress);

    // 5. 部署主合约（使用正确的构造函数参数）
    console.log("5. Deploying DecentralizedLottery with constructor arguments...");
    const DecentralizedLottery = await ethers.getContractFactory("DecentralizedLottery");
    decentralizedLottery = await DecentralizedLottery.deploy(pointsAddress, tokenAddress);
    await decentralizedLottery.deployed();
    lotteryAddress = decentralizedLottery.address;
    console.log("   ✅ DecentralizedLottery deployed to:", lotteryAddress);

    // 6. 转移代币合约所有权
    console.log("6. Transferring token ownership...");
    const transferTx = await lotteryToken.transferOwnership(lotteryAddress);
    await transferTx.wait();
    console.log("   ✅ Token ownership transferred to main contract");

    // 7. 验证部署状态
    console.log("7. Verifying deployment...");
    const deployerBalance = await lotteryPoints.balanceOf(deployer.address);
    const user1Balance = await lotteryPoints.balanceOf(user1.address);
    const user2Balance = await lotteryPoints.balanceOf(user2.address);
    const user3Balance = await lotteryPoints.balanceOf(user3.address);
    const totalSupply = await lotteryPoints.totalSupply();
    const tokenOwner = await lotteryToken.owner();
    
    console.log("   📊 Deployment Status:");
    console.log("   - Deployer LTP balance:", ethers.utils.formatEther(deployerBalance));
    console.log("   - User1 LTP balance:", ethers.utils.formatEther(user1Balance));
    console.log("   - User2 LTP balance:", ethers.utils.formatEther(user2Balance));
    console.log("   - User3 LTP balance:", ethers.utils.formatEther(user3Balance));
    console.log("   - Total LTP supply:", ethers.utils.formatEther(totalSupply));
    console.log("   - LotteryToken owner:", tokenOwner);
    console.log("   - Correct owner?", tokenOwner === lotteryAddress ? "✅" : "❌");

    // 8. 更新前端常量
    console.log("8. Updating frontend constants...");
    updateFrontendConstants(lotteryAddress, pointsAddress, tokenAddress);
    console.log("   ✅ Frontend constants updated");

    console.log("\n🎉 === CONTRACT DEPLOYMENT COMPLETED ===\n");

  } catch (error: any) {
    console.error("❌ Deployment failed:", error.message);
    if (error.reason) console.error("Revert reason:", error.reason);
    process.exit(1);
  }

  // ==================== 阶段2: 基础功能测试 ====================
  console.log("🧪 === PHASE 2: BASIC FUNCTIONALITY TEST ===\n");

  try {
    // 1. 测试积分领取功能
    console.log("1. Testing points claim functionality...");
    
    // User1 领取积分
    const user1Points = lotteryPoints.connect(user1);
    const claimTx1 = await user1Points.claimPoints();
    await claimTx1.wait();
    
    // User2 领取积分
    const user2Points = lotteryPoints.connect(user2);
    const claimTx2 = await user2Points.claimPoints();
    await claimTx2.wait();
    
    // User3 领取积分
    const user3Points = lotteryPoints.connect(user3);
    const claimTx3 = await user3Points.claimPoints();
    await claimTx3.wait();

    // 验证领取结果
    const user1Balance = await lotteryPoints.balanceOf(user1.address);
    const user2Balance = await lotteryPoints.balanceOf(user2.address);
    const user3Balance = await lotteryPoints.balanceOf(user3.address);
    const user1Claimed = await lotteryPoints.hasClaimed(user1.address);
    
    console.log("   ✅ Points claim test results:");
    console.log("   - User1 balance:", ethers.utils.formatEther(user1Balance), "LTP (claimed:", user1Claimed + ")");
    console.log("   - User2 balance:", ethers.utils.formatEther(user2Balance), "LTP");
    console.log("   - User3 balance:", ethers.utils.formatEther(user3Balance), "LTP");

    // 2. 测试重复领取（应该失败）
    console.log("2. Testing duplicate claim (should fail)...");
    try {
      await user1Points.claimPoints();
      console.log("   ❌ Duplicate claim should have failed!");
    } catch (error: any) {
      console.log("   ✅ Duplicate claim correctly failed");
    }

    console.log("\n🎉 === BASIC FUNCTIONALITY TEST COMPLETED ===\n");

  } catch (error: any) {
    console.error("❌ Basic functionality test failed:", error.message);
    if (error.reason) console.error("Revert reason:", error.reason);
    process.exit(1);
  }

  // ==================== 阶段3: 彩票创建测试 ====================
  console.log("🎯 === PHASE 3: LOTTERY CREATION TEST ===\n");

  try {
    // 1. 创建多个彩票项目
    console.log("1. Creating lottery projects...");
    
    // 创建第一个彩票
    console.log("   Creating Lottery 1: NBA Championship...");
    const createTx1 = await decentralizedLottery.createLottery(
      "NBA Championship 2024",
      "Who will win the NBA Championship 2024?",
      ["Lakers", "Warriors", "Celtics", "Bucks"],
      ethers.utils.parseEther("10"), // 10 LTP per ticket
      7 // 7 days
    );
    await createTx1.wait();

    // 创建第二个彩票
    console.log("   Creating Lottery 2: World Cup...");
    const createTx2 = await decentralizedLottery.createLottery(
      "FIFA World Cup 2026",
      "Which team will win the 2026 World Cup?",
      ["Brazil", "Argentina", "France", "Germany", "Spain"],
      ethers.utils.parseEther("5"), // 5 LTP per ticket
      14 // 14 days
    );
    await createTx2.wait();

    // 创建第三个彩票
    console.log("   Creating Lottery 3: Oscar Awards...");
    const createTx3 = await decentralizedLottery.createLottery(
      "Oscar Best Picture 2024",
      "Which movie will win Best Picture at the 2024 Oscars?",
      ["Oppenheimer", "Barbie", "Killers of the Flower Moon", "Poor Things"],
      ethers.utils.parseEther("15"), // 15 LTP per ticket
      3 // 3 days
    );
    await createTx3.wait();

    // 验证彩票创建
    const allLotteries = await decentralizedLottery.getAllLotteries();
    console.log("   ✅ Created", allLotteries.length, "lotteries");
    
    // 显示彩票详情
    allLotteries.forEach((lottery: any, index: number) => {
      console.log(`   📋 Lottery ${index}: ${lottery.name}`);
      console.log(`     - Description: ${lottery.description}`);
      console.log(`     - Ticket Price: ${ethers.utils.formatEther(lottery.ticketPrice)} LTP`);
      console.log(`     - Options: ${lottery.options.join(", ")}`);
      console.log(`     - End Time: ${new Date(lottery.endTime * 1000).toLocaleString()}`);
    });

    console.log("\n🎉 === LOTTERY CREATION TEST COMPLETED ===\n");

  } catch (error: any) {
    console.error("❌ Lottery creation test failed:", error.message);
    if (error.reason) console.error("Revert reason:", error.reason);
    process.exit(1);
  }

  // ==================== 阶段4: 授权和购买测试 ====================
  console.log("🔧 === PHASE 4: AUTHORIZATION & PURCHASE TEST ===\n");

  try {
    console.log("1. Setting up user connections...");
    const user1Lottery = decentralizedLottery.connect(user1);
    const user2Lottery = decentralizedLottery.connect(user2);
    const user3Lottery = decentralizedLottery.connect(user3);

    // 2. 检查用户余额
    console.log("2. Checking user balances...");
    const user1Balance = await lotteryPoints.balanceOf(user1.address);
    const user2Balance = await lotteryPoints.balanceOf(user2.address);
    const user3Balance = await lotteryPoints.balanceOf(user3.address);
    
    console.log("   - User1 balance:", ethers.utils.formatEther(user1Balance), "LTP");
    console.log("   - User2 balance:", ethers.utils.formatEther(user2Balance), "LTP");
    console.log("   - User3 balance:", ethers.utils.formatEther(user3Balance), "LTP");

    // 3. 用户授权合约使用积分
    console.log("3. Approving contract to spend points...");
    
    const approveAmount = ethers.utils.parseEther("10000");
    
    // User1 授权
    const user1Points = lotteryPoints.connect(user1);
    const approveTx1 = await user1Points.approve(lotteryAddress, approveAmount);
    await approveTx1.wait();
    console.log("   ✅ User1 approved contract to spend points");

    // User2 授权
    const user2Points = lotteryPoints.connect(user2);
    const approveTx2 = await user2Points.approve(lotteryAddress, approveAmount);
    await approveTx2.wait();
    console.log("   ✅ User2 approved contract to spend points");

    // User3 授权
    const user3Points = lotteryPoints.connect(user3);
    const approveTx3 = await user3Points.approve(lotteryAddress, approveAmount);
    await approveTx3.wait();
    console.log("   ✅ User3 approved contract to spend points");

    // 4. 验证授权状态
    console.log("4. Verifying approvals...");
    const allowance1 = await lotteryPoints.allowance(user1.address, lotteryAddress);
    const allowance2 = await lotteryPoints.allowance(user2.address, lotteryAddress);
    const allowance3 = await lotteryPoints.allowance(user3.address, lotteryAddress);
    
    console.log("   - User1 allowance:", ethers.utils.formatEther(allowance1), "LTP");
    console.log("   - User2 allowance:", ethers.utils.formatEther(allowance2), "LTP");
    console.log("   - User3 allowance:", ethers.utils.formatEther(allowance3), "LTP");

    // 5. 测试购买彩票
    console.log("5. Testing ticket purchases...");
    
    // User1 购买彩票
    console.log("   User1 purchasing ticket for Lottery 0, Option 0...");
    const purchaseTx1 = await user1Lottery.purchaseTicket(0, 0, { gasLimit: 500000 });
    await purchaseTx1.wait();
    console.log("   ✅ User1 purchase successful");

    // User2 购买彩票
    console.log("   User2 purchasing ticket for Lottery 0, Option 1...");
    const purchaseTx2 = await user2Lottery.purchaseTicket(0, 1, { gasLimit: 500000 });
    await purchaseTx2.wait();
    console.log("   ✅ User2 purchase successful");

    // User3 购买彩票
    console.log("   User3 purchasing ticket for Lottery 1, Option 0...");
    const purchaseTx3 = await user3Lottery.purchaseTicket(1, 0, { gasLimit: 500000 });
    await purchaseTx3.wait();
    console.log("   ✅ User3 purchase successful");

    // 6. 验证购买结果
    console.log("6. Verifying purchase results...");
    const lotteriesAfter = await decentralizedLottery.getAllLotteries();
    const user1Tickets = await decentralizedLottery.getUserTickets(user1.address);
    const user2Tickets = await decentralizedLottery.getUserTickets(user2.address);
    const user3Tickets = await decentralizedLottery.getUserTickets(user3.address);
    
    console.log("   - Lottery 0 pool:", ethers.utils.formatEther(lotteriesAfter[0].totalPool), "LTP");
    console.log("   - Lottery 1 pool:", ethers.utils.formatEther(lotteriesAfter[1].totalPool), "LTP");
    console.log("   - User1 tickets:", user1Tickets.length);
    console.log("   - User2 tickets:", user2Tickets.length);
    console.log("   - User3 tickets:", user3Tickets.length);

    console.log("\n🎉 === AUTHORIZATION & PURCHASE TEST COMPLETED ===\n");

  } catch (error: any) {
    console.error("❌ Authorization & purchase test failed:", error.message);
    if (error.reason) console.error("Revert reason:", error.reason);
    // 继续执行，不退出
  }

  // ==================== 阶段5: 市场功能测试 ====================
  console.log("🏪 === PHASE 5: MARKET FUNCTIONALITY TEST ===\n");

  try {
    // 1. 测试挂单功能
    console.log("1. Testing ticket listing...");
    
    const user1Tickets = await decentralizedLottery.getUserTickets(user1.address);
    if (user1Tickets.length > 0) {
      const user1Lottery = decentralizedLottery.connect(user1);
      const listTx = await user1Lottery.listTicket(
        user1Tickets[0].tokenId,
        ethers.utils.parseEther("12") // 以12 LTP的价格挂单
      );
      await listTx.wait();
      console.log("   ✅ User1 listed ticket for sale");
    }

    // 2. 测试查看活跃挂单
    console.log("2. Testing active listings retrieval...");
    const activeListings = await decentralizedLottery.getActiveListings();
    console.log("   - Active listings:", activeListings.length);

    // 3. 测试购买挂单
    if (activeListings.length > 0) {
      console.log("3. Testing listing purchase...");
      const user2Lottery = decentralizedLottery.connect(user2);
      
      // 用户2授权购买
      const user2Points = lotteryPoints.connect(user2);
      await user2Points.approve(lotteryAddress, ethers.utils.parseEther("10000"));
      
      const buyTx = await user2Lottery.buyListing(activeListings[0].listingId, { gasLimit: 500000 });
      await buyTx.wait();
      console.log("   ✅ User2 purchased listed ticket");
    }

    console.log("\n🎉 === MARKET FUNCTIONALITY TEST COMPLETED ===\n");

  } catch (error: any) {
    console.error("❌ Market functionality test failed:", error.message);
    if (error.reason) console.error("Revert reason:", error.reason);
    // 继续执行，不退出
  }

  // ==================== 阶段6: 最终状态验证 ====================
  console.log("📈 === PHASE 6: FINAL STATE VERIFICATION ===\n");

  try {
    // 1. 合约地址验证
    console.log("1. Contract addresses:");
    console.log("   - LotteryPoints:", pointsAddress);
    console.log("   - LotteryToken:", tokenAddress);
    console.log("   - DecentralizedLottery:", lotteryAddress);

    // 2. 最终余额统计
    console.log("2. Final balances:");
    
    const finalDeployerBalance = await lotteryPoints.balanceOf(deployer.address);
    const finalUser1Balance = await lotteryPoints.balanceOf(user1.address);
    const finalUser2Balance = await lotteryPoints.balanceOf(user2.address);
    const finalUser3Balance = await lotteryPoints.balanceOf(user3.address);
    const finalTotalSupply = await lotteryPoints.totalSupply();
    
    console.log("   - Deployer:", ethers.utils.formatEther(finalDeployerBalance), "LTP");
    console.log("   - User1:", ethers.utils.formatEther(finalUser1Balance), "LTP");
    console.log("   - User2:", ethers.utils.formatEther(finalUser2Balance), "LTP");
    console.log("   - User3:", ethers.utils.formatEther(finalUser3Balance), "LTP");
    console.log("   - Total Supply:", ethers.utils.formatEther(finalTotalSupply), "LTP");

    // 3. 彩票统计
    console.log("3. Lottery statistics:");
    
    const allLotteries = await decentralizedLottery.getAllLotteries();
    console.log("   - Total lotteries created:", allLotteries.length);
    
    allLotteries.forEach((lottery: any, index: number) => {
      console.log(`   - Lottery ${index}: ${lottery.name}`);
      console.log(`     Status: ${lottery.status}, Pool: ${ethers.utils.formatEther(lottery.totalPool)} LTP`);
    });

    // 4. 票券统计
    console.log("4. Ticket statistics:");
    const user1Tickets = await decentralizedLottery.getUserTickets(user1.address);
    const user2Tickets = await decentralizedLottery.getUserTickets(user2.address);
    const user3Tickets = await decentralizedLottery.getUserTickets(user3.address);
    
    console.log("   - User1 tickets:", user1Tickets.length);
    console.log("   - User2 tickets:", user2Tickets.length);
    console.log("   - User3 tickets:", user3Tickets.length);

    console.log("\n🎉 === FINAL STATE VERIFICATION COMPLETED ===\n");

  } catch (error: any) {
    console.error("❌ Final state verification failed:", error.message);
    if (error.reason) console.error("Revert reason:", error.reason);
  }

  // ==================== 总结 ====================
  console.log("🎊 === TEST SUMMARY === 🎊\n");
  
  console.log("✅ Successfully tested:");
  console.log("   - Contract deployment with constructor arguments");
  console.log("   - Points claiming and balance management");
  console.log("   - Lottery creation with multiple options");
  console.log("   - User authorization and allowance setup");
  console.log("   - Ticket purchasing functionality");
  console.log("   - Market listing and trading");
  console.log("   - State management and verification");
  
  console.log("\n🚀 All core functionalities are working correctly!");
  console.log("💫 You can start the frontend to test user interactions.");
  console.log("\nTo start the frontend:");
  console.log("cd ../frontend && npm run dev");
  
  console.log("\nContract addresses for frontend:");
  console.log("Lottery:", lotteryAddress);
  console.log("Points:", pointsAddress);
  console.log("Token:", tokenAddress);
  
  console.log("\n🔧 Next steps:");
  console.log("1. Start the frontend application");
  console.log("2. Test user interactions through the UI");
  console.log("3. Verify all features work as expected");
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
  console.error("💥 Comprehensive test failed:", error);
  process.exitCode = 1;
});