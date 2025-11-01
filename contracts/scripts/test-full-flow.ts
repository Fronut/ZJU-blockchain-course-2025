// scripts/test-full-flow.ts
import { ethers } from "hardhat";

async function main() {
  console.log("=== Testing Full Lottery Flow ===");
  
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("User1:", user1.address);
  console.log("User2:", user2.address);

  const lotteryAddress = "0x8672C6a2f13851D8B67D7c3D6f7bad1e89b1bA95";
  
  const lotteryABI = [
    "function getAllLotteries() view returns (tuple(uint256 id, string name, string description, string[] options, uint256 totalPool, uint256 endTime, uint8 status, uint256 winningOption, uint256 ticketPrice, uint256[] optionCounts, uint256[] optionAmounts)[])",
    "function createLottery(string name, string description, string[] options, uint256 ticketPrice, uint256 durationInDays)",
    "function purchaseTicket(uint256 lotteryId, uint256 optionId)",
    "function claimPoints()",
    "function getContractAddresses() view returns (address points, address token)"
  ];

  const pointsABI = [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address, uint256) returns (bool)"
  ];

  try {
    const lotteryContract = new ethers.Contract(lotteryAddress, lotteryABI, deployer);
    const [pointsAddress] = await lotteryContract.getContractAddresses();
    const pointsContract = new ethers.Contract(pointsAddress, pointsABI, deployer);

    console.log("\n=== Step 1: Check Initial State ===");
    const deployerBalance = await pointsContract.balanceOf(deployer.address);
    console.log("Deployer balance:", ethers.utils.formatEther(deployerBalance), "LTP");

    // 给测试用户转账一些积分
    console.log("\n=== Step 2: Fund Test Users ===");
    const transferAmount = ethers.utils.parseEther("100");
    const transferTx1 = await pointsContract.transfer(user1.address, transferAmount);
    await transferTx1.wait();
    const transferTx2 = await pointsContract.transfer(user2.address, transferAmount);
    await transferTx2.wait();
    console.log("Transferred 100 LTP to each test user");

    // 用户1领取积分
    console.log("\n=== Step 3: User1 Claim Points ===");
    const user1LotteryContract = lotteryContract.connect(user1);
    const claimTx = await user1LotteryContract.claimPoints();
    await claimTx.wait();
    console.log("User1 claimed 1000 LTP");

    // 创建测试彩票
    console.log("\n=== Step 4: Create Test Lottery ===");
    const createTx = await lotteryContract.createLottery(
      "NBA Championship 2024",
      "Who will win the NBA Championship 2024?",
      ["Lakers", "Warriors", "Celtics", "Bucks"],
      ethers.utils.parseEther("10"), // 10 LTP per ticket
      7 // 7 days duration
    );
    await createTx.wait();
    console.log("Test lottery created");

    // 获取彩票列表
    console.log("\n=== Step 5: Check Lotteries ===");
    const lotteries = await lotteryContract.getAllLotteries();
    console.log("Total lotteries:", lotteries.length);
    
    if (lotteries.length > 0) {
      const lottery = lotteries[0];
      console.log("First lottery:", {
        id: lottery.id.toString(),
        name: lottery.name,
        description: lottery.description,
        options: lottery.options,
        ticketPrice: ethers.utils.formatEther(lottery.ticketPrice)
      });
    }

    // 用户1购买彩票
    console.log("\n=== Step 6: User1 Purchase Ticket ===");
    const purchaseTx = await user1LotteryContract.purchaseTicket(0, 1); // lotteryId 0, optionId 1 (Warriors)
    await purchaseTx.wait();
    console.log("User1 purchased ticket for Warriors");

    // 用户2购买彩票
    console.log("\n=== Step 7: User2 Purchase Ticket ===");
    const user2LotteryContract = lotteryContract.connect(user2);
    const purchaseTx2 = await user2LotteryContract.purchaseTicket(0, 2); // lotteryId 0, optionId 2 (Celtics)
    await purchaseTx2.wait();
    console.log("User2 purchased ticket for Celtics");

    // 检查最终状态
    console.log("\n=== Step 8: Final State Check ===");
    const finalDeployerBalance = await pointsContract.balanceOf(deployer.address);
    const finalUser1Balance = await pointsContract.balanceOf(user1.address);
    const finalUser2Balance = await pointsContract.balanceOf(user2.address);
    
    console.log("Deployer final balance:", ethers.utils.formatEther(finalDeployerBalance), "LTP");
    console.log("User1 final balance:", ethers.utils.formatEther(finalUser1Balance), "LTP");
    console.log("User2 final balance:", ethers.utils.formatEther(finalUser2Balance), "LTP");

    // 检查彩票状态
    const finalLotteries = await lotteryContract.getAllLotteries();
    if (finalLotteries.length > 0) {
      const finalLottery = finalLotteries[0];
      console.log("Final lottery pool:", ethers.utils.formatEther(finalLottery.totalPool), "LTP");
      console.log("Option counts:", finalLottery.optionCounts.map((count: any) => count.toString()));
    }

    console.log("\n🎉 FULL FLOW TEST COMPLETED SUCCESSFULLY!");

  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
    if (error.reason) {
      console.error("Revert reason:", error.reason);
    }
  }
}

main().catch(console.error);