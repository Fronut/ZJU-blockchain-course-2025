// scripts/debug-purchase.ts
import { ethers } from "hardhat";

async function main() {
  console.log("🔍 === DEBUGGING PURCHASE ISSUE ===\n");
  
  const [deployer, user1] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("User1:", user1.address);

  // 使用最新部署的地址
  const lotteryAddress = "0x2988CDcD1d31700C0297d3ac9D0c95dEa562B073";
  const pointsAddress = "0x56bf994f3917680069038fEd572082b47c6A3D0c";
  
  const lotteryABI = [
    "function purchaseTicket(uint256 lotteryId, uint256 optionId)",
    "function getAllLotteries() view returns (tuple(uint256 id, string name, string description, string[] options, uint256 totalPool, uint256 endTime, uint8 status, uint256 winningOption, uint256 ticketPrice, uint256[] optionCounts, uint256[] optionAmounts)[])"
  ];

  const pointsABI = [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address, address) view returns (uint256)",
    "function approve(address, uint256) returns (bool)",
    "function transferFrom(address, address, uint256) returns (bool)"
  ];

  try {
    const lotteryContract = new ethers.Contract(lotteryAddress, lotteryABI, user1);
    const pointsContract = new ethers.Contract(pointsAddress, pointsABI, user1);

    console.log("1. Checking current state...");
    
    // 检查用户余额
    const userBalance = await pointsContract.balanceOf(user1.address);
    console.log("   - User1 balance:", ethers.utils.formatEther(userBalance), "LTP");

    // 检查彩票价格
    const lotteries = await lotteryContract.getAllLotteries();
    const nbaLottery = lotteries[0];
    const ticketPrice = nbaLottery.ticketPrice;
    console.log("   - Ticket price:", ethers.utils.formatEther(ticketPrice), "LTP");

    // 检查授权额度（关键！检查对主合约的授权）
    const allowanceToLottery = await pointsContract.allowance(user1.address, lotteryAddress);
    console.log("   - Allowance to Lottery contract:", ethers.utils.formatEther(allowanceToLottery), "LTP");

    // 检查授权额度（检查对积分合约本身的授权）
    const allowanceToPoints = await pointsContract.allowance(user1.address, pointsAddress);
    console.log("   - Allowance to Points contract:", ethers.utils.formatEther(allowanceToPoints), "LTP");

    console.log("\n2. Testing conditions...");
    console.log("   - Balance >= Price?", userBalance.gte(ticketPrice));
    console.log("   - Allowance >= Price?", allowanceToLottery.gte(ticketPrice));

    // 如果授权不足，重新授权
    if (allowanceToLottery.lt(ticketPrice)) {
      console.log("\n3. Re-approving contract...");
      const approveTx = await pointsContract.approve(lotteryAddress, ethers.utils.parseEther("10000"));
      await approveTx.wait();
      console.log("   ✅ Re-approved lottery contract");
      
      // 重新检查授权
      const newAllowance = await pointsContract.allowance(user1.address, lotteryAddress);
      console.log("   - New allowance:", ethers.utils.formatEther(newAllowance), "LTP");
    }

    console.log("\n4. Testing direct transferFrom...");
    try {
      // 测试从用户到主合约的transferFrom
      const testTx = await pointsContract.transferFrom(
        user1.address, 
        lotteryAddress, 
        ticketPrice,
        { gasLimit: 200000 }
      );
      await testTx.wait();
      console.log("   ✅ Direct transferFrom successful!");
    } catch (error: any) {
      console.log("   ❌ Direct transferFrom failed:", error.reason || error.message);
      
      // 如果transferFrom失败，问题可能在积分合约的授权逻辑
      console.log("\n5. Debugging transferFrom failure...");
      
      // 检查积分合约的owner
      const pointsOwner = await pointsContract.owner ? await pointsContract.owner() : "No owner function";
      console.log("   - Points contract owner:", pointsOwner);
      
      // 检查是否实现了正确的ERC20接口
      console.log("   - Checking ERC20 implementation...");
    }

    console.log("\n6. Attempting purchase with detailed error handling...");
    try {
      const purchaseTx = await lotteryContract.purchaseTicket(0, 0, {
        gasLimit: 500000
      });
      console.log("   ⏳ Purchase transaction sent:", purchaseTx.hash);
      const receipt = await purchaseTx.wait();
      console.log("   ✅ Purchase successful! Gas used:", receipt.gasUsed.toString());
      
      // 检查购买后的状态
      const lotteriesAfter = await lotteryContract.getAllLotteries();
      const nbaAfter = lotteriesAfter[0];
      console.log("   - Lottery pool after purchase:", ethers.utils.formatEther(nbaAfter.totalPool), "LTP");
      
    } catch (error: any) {
      console.log("   ❌ Purchase failed with details:");
      console.log("   - Error:", error.message);
      if (error.reason) console.log("   - Reason:", error.reason);
      if (error.data) console.log("   - Data:", error.data);
      
      // 检查交易回滚的具体原因
      if (error.transaction) {
        console.log("   - Transaction:", error.transaction);
      }
    }

  } catch (error: any) {
    console.error("❌ Debug failed:", error.message);
  }
}

main().catch(console.error);