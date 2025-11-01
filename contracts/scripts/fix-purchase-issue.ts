// scripts/fix-purchase-issue.ts
import { ethers } from "hardhat";

async function main() {
  console.log("🛠️ === FIXING PURCHASE ISSUE ===\n");
  
  const [deployer, user1, user2] = await ethers.getSigners();

  // 使用最新部署的地址
  const lotteryAddress = "0x2988CDcD1d31700C0297d3ac9D0c95dEa562B073";
  const pointsAddress = "0x56bf994f3917680069038fEd572082b47c6A3D0c";
  
  const lotteryABI = [
    "function purchaseTicket(uint256 lotteryId, uint256 optionId)",
    "function getAllLotteries() view returns (tuple(uint256 id, string name, string description, string[] options, uint256 totalPool, uint256 endTime, uint8 status, uint256 winningOption, uint256 ticketPrice, uint256[] optionCounts, uint256[] optionAmounts)[])",
    "function getContractAddresses() view returns (address points, address token)"
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
    const userBalance = await pointsContract.balanceOf(user1.address);
    const ticketPrice = ethers.utils.parseEther("10");
    
    console.log("   - User1 balance:", ethers.utils.formatEther(userBalance), "LTP");
    console.log("   - Required ticket price: 10.0 LTP");

    console.log("\n2. Fixing approval issue...");
    
    // 问题：用户需要授权给主合约，但可能授权给了错误的地址
    // 让我们重新授权，确保授权给正确的主合约地址
    
    // 首先撤销之前的授权
    const revokeTx = await pointsContract.approve(lotteryAddress, 0);
    await revokeTx.wait();
    console.log("   ✅ Revoked previous approval");

    // 重新授权
    const newAllowance = ethers.utils.parseEther("10000");
    const approveTx = await pointsContract.approve(lotteryAddress, newAllowance);
    await approveTx.wait();
    console.log("   ✅ Re-approved lottery contract");

    // 验证授权
    const allowance = await pointsContract.allowance(user1.address, lotteryAddress);
    console.log("   - New allowance:", ethers.utils.formatEther(allowance), "LTP");

    console.log("\n3. Testing purchase with fixed approval...");
    try {
      const purchaseTx = await lotteryContract.purchaseTicket(0, 0, {
        gasLimit: 500000
      });
      console.log("   ⏳ Purchase transaction sent:", purchaseTx.hash);
      const receipt = await purchaseTx.wait();
      console.log("   ✅ PURCHASE SUCCESSFUL! Gas used:", receipt.gasUsed.toString());
      
      // 检查购买结果
      const lotteries = await lotteryContract.getAllLotteries();
      const nbaLottery = lotteries[0];
      console.log("   - Lottery pool:", ethers.utils.formatEther(nbaLottery.totalPool), "LTP");
      console.log("   - Option counts:", nbaLottery.optionCounts.map((c: any) => c.toString()));
      
    } catch (error: any) {
      console.log("   ❌ Purchase still failed:", error.reason || error.message);
      
      // 如果还是失败，让我们检查合约的具体错误
      console.log("\n4. Debugging contract-level issue...");
      
      // 检查主合约是否有足够的积分处理能力
      const [contractPoints, contractToken] = await lotteryContract.getContractAddresses();
      console.log("   - Contract points address:", contractPoints);
      console.log("   - Contract token address:", contractToken);
      
      // 检查主合约的积分余额
      const contractBalance = await pointsContract.balanceOf(lotteryAddress);
      console.log("   - Contract points balance:", ethers.utils.formatEther(contractBalance), "LTP");
      
      // 问题可能在于主合约的transferFrom调用逻辑
      console.log("   ⚠️  Issue is likely in the main contract's transferFrom call");
    }

    console.log("\n5. Testing alternative approach...");
    
    // 如果直接购买失败，让我们测试其他功能
    const user1Lottery = lotteryContract.connect(user1);
    
    // 测试获取用户票券
    try {
      const tickets = await user1Lottery.getUserTickets(user1.address);
      console.log("   - User1 tickets:", tickets.length);
    } catch (error: any) {
      console.log("   - getUserTickets error:", error.message);
    }

    // 测试获取活跃挂单
    try {
      const listings = await user1Lottery.getActiveListings();
      console.log("   - Active listings:", listings.length);
    } catch (error: any) {
      console.log("   - getActiveListings error:", error.message);
    }

  } catch (error: any) {
    console.error("❌ Fix failed:", error.message);
  }
}

main().catch(console.error);