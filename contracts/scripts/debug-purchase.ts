// scripts/debug-purchase.ts
import { ethers } from "hardhat";

async function main() {
  console.log("🔍 === DEBUGGING PURCHASE ISSUE ===\n");
  
  const [deployer, user1] = await ethers.getSigners();
  
  const lotteryAddress = "0x3141118110f87875f600B3FeE4DF9c8E826e2003";
  const pointsAddress = "0x4918b54d4402e1E15F545b25bE4b40420D214c2B";
  
  const lotteryABI = [
    "function getAllLotteries() view returns (tuple(uint256 id, string name, string description, string[] options, uint256 totalPool, uint256 endTime, uint8 status, uint256 winningOption, uint256 ticketPrice, uint256[] optionCounts, uint256[] optionAmounts)[])",
    "function purchaseTicket(uint256 lotteryId, uint256 optionId)",
    "function getContractAddresses() view returns (address points, address token)"
  ];

  const pointsABI = [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address, address) view returns (uint256)"
  ];

  try {
    const lottery = new ethers.Contract(lotteryAddress, lotteryABI, deployer);
    const points = new ethers.Contract(pointsAddress, pointsABI, deployer);

    console.log("1. Checking lottery details...");
    const lotteries = await lottery.getAllLotteries();
    
    if (lotteries.length === 0) {
      console.log("   ❌ No lotteries found");
      return;
    }

    const lottery0 = lotteries[0];
    console.log("   - Lottery 0:", lottery0.name);
    console.log("   - Status:", lottery0.status);
    console.log("   - Ticket Price:", ethers.utils.formatEther(lottery0.ticketPrice), "LTP");
    console.log("   - Options:", lottery0.options);
    console.log("   - End Time:", new Date(Number(lottery0.endTime) * 1000).toLocaleString());
    console.log("   - Current Time:", new Date().toLocaleString());
    console.log("   - Is active?", lottery0.status === 0 && Number(lottery0.endTime) > Math.floor(Date.now() / 1000));

    console.log("\n2. Checking user balance and allowance...");
    const userBalance = await points.balanceOf(user1.address);
    const userAllowance = await points.allowance(user1.address, lotteryAddress);
    
    console.log("   - User balance:", ethers.utils.formatEther(userBalance), "LTP");
    console.log("   - User allowance:", ethers.utils.formatEther(userAllowance), "LTP");
    console.log("   - Ticket price:", ethers.utils.formatEther(lottery0.ticketPrice), "LTP");
    console.log("   - Has enough balance?", userBalance >= lottery0.ticketPrice);
    console.log("   - Has enough allowance?", userAllowance >= lottery0.ticketPrice);

    console.log("\n3. Testing purchase directly...");
    const user1Lottery = lottery.connect(user1);
    
    try {
      // 测试购买 Option 0
      console.log("   Testing Option 0...");
      const tx0 = await user1Lottery.purchaseTicket(0, 0, { gasLimit: 500000 });
      await tx0.wait();
      console.log("   ✅ Option 0 purchase successful");
    } catch (error: any) {
      console.log("   ❌ Option 0 failed:", error.reason || error.message);
    }

    try {
      // 测试购买 Option 1
      console.log("   Testing Option 1...");
      const tx1 = await user1Lottery.purchaseTicket(0, 1, { gasLimit: 500000 });
      await tx1.wait();
      console.log("   ✅ Option 1 purchase successful");
    } catch (error: any) {
      console.log("   ❌ Option 1 failed:", error.reason || error.message);
    }

    try {
      // 测试购买 Option 2
      console.log("   Testing Option 2...");
      const tx2 = await user1Lottery.purchaseTicket(0, 2, { gasLimit: 500000 });
      await tx2.wait();
      console.log("   ✅ Option 2 purchase successful");
    } catch (error: any) {
      console.log("   ❌ Option 2 failed:", error.reason || error.message);
    }

  } catch (error: any) {
    console.error("❌ Debug failed:", error.message);
  }
}

main().catch(console.error);