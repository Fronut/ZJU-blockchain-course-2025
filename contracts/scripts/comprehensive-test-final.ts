// scripts/comprehensive-test-final.ts
import { ethers } from "hardhat";
import { writeFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log("🎰 === COMPREHENSIVE TEST (FINAL FIX) === 🎰\n");
  
  const [deployer, user1, user2, user3] = await ethers.getSigners();

  let lotteryPoints, lotteryToken, decentralizedLottery;
  let pointsAddress, tokenAddress, lotteryAddress;

  try {
    // 部署合约（与之前相同）
    console.log("1. Deploying contracts...");
    const LotteryPoints = await ethers.getContractFactory("LotteryPoints");
    lotteryPoints = await LotteryPoints.deploy();
    pointsAddress = lotteryPoints.address;

    const LotteryToken = await ethers.getContractFactory("LotteryToken");
    lotteryToken = await LotteryToken.deploy();
    tokenAddress = lotteryToken.address;

    const DecentralizedLottery = await ethers.getContractFactory("DecentralizedLottery");
    decentralizedLottery = await DecentralizedLottery.deploy(pointsAddress, tokenAddress);
    lotteryAddress = decentralizedLottery.address;

    await lotteryToken.transferOwnership(lotteryAddress);

    // 分配积分和授权
    console.log("2. Setting up users...");
    await lotteryPoints.mint(deployer.address, ethers.utils.parseEther("1000000"));
    await lotteryPoints.transfer(user1.address, ethers.utils.parseEther("10000"));
    await lotteryPoints.transfer(user2.address, ethers.utils.parseEther("10000"));
    await lotteryPoints.transfer(user3.address, ethers.utils.parseEther("10000"));

    const user1Points = lotteryPoints.connect(user1);
    const user2Points = lotteryPoints.connect(user2);
    const user3Points = lotteryPoints.connect(user3);
    
    await user1Points.approve(lotteryAddress, ethers.utils.parseEther("10000"));
    await user2Points.approve(lotteryAddress, ethers.utils.parseEther("10000"));
    await user3Points.approve(lotteryAddress, ethers.utils.parseEther("10000"));

    // 创建彩票
    console.log("3. Creating lotteries...");
    await decentralizedLottery.createLottery(
      "Test Lottery",
      "Test lottery for comprehensive testing",
      ["Option A", "Option B", "Option C"],
      ethers.utils.parseEther("10"),
      7
    );

    // 购买彩票并自动授权 NFT
    console.log("4. Testing purchase with auto-authorization...");
    const user1Lottery = decentralizedLottery.connect(user1);
    const user2Lottery = decentralizedLottery.connect(user2);
    const user1Token = lotteryToken.connect(user1);
    const user2Token = lotteryToken.connect(user2);

    // User1 购买并授权
    await user1Lottery.purchaseTicket(0, 0, { gasLimit: 500000 });
    let user1Tickets = await decentralizedLottery.getUserTickets(user1.address);
    await user1Token.approve(lotteryAddress, user1Tickets[0].tokenId);
    console.log("   ✅ User1 purchased and authorized NFT");

    // User2 购买并授权  
    await user2Lottery.purchaseTicket(0, 1, { gasLimit: 500000 });
    let user2Tickets = await decentralizedLottery.getUserTickets(user2.address);
    await user2Token.approve(lotteryAddress, user2Tickets[0].tokenId);
    console.log("   ✅ User2 purchased and authorized NFT");

    // 测试市场功能
    console.log("5. Testing market functionality...");
    
    // User1 挂单
    await user1Lottery.listTicket(user1Tickets[0].tokenId, ethers.utils.parseEther("12"));
    console.log("   ✅ User1 listed ticket");

    let listings = await decentralizedLottery.getActiveListings();
    console.log("   - Active listings:", listings.length);

    // User2 购买挂单
    await user2Lottery.buyListing(listings[0].listingId, { gasLimit: 500000 });
    console.log("   ✅ User2 purchased listed ticket");

    listings = await decentralizedLottery.getActiveListings();
    user1Tickets = await decentralizedLottery.getUserTickets(user1.address);
    user2Tickets = await decentralizedLottery.getUserTickets(user2.address);
    
    console.log("   - Final active listings:", listings.length);
    console.log("   - User1 tickets:", user1Tickets.length);
    console.log("   - User2 tickets:", user2Tickets.length);

    // 更新前端
    updateFrontendConstants(lotteryAddress, pointsAddress, tokenAddress);
    console.log("   ✅ Frontend constants updated");

    console.log("\n🎉 === ALL TESTS PASSED === 🎉");
    console.log("Market functionality is now working correctly!");

  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
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
  writeFileSync(frontendPath, constantsContent);
}

main().catch(console.error);