// scripts/fix-contract-addresses.ts
import { ethers } from "hardhat";

async function main() {
  console.log("🛠️ === FIXING CONTRACT ADDRESS MISMATCH ===\n");
  
  const [deployer, user1] = await ethers.getSigners();

  // 外部部署的合约地址
  const externalPointsAddress = "0x56bf994f3917680069038fEd572082b47c6A3D0c";
  const lotteryAddress = "0x2988CDcD1d31700C0297d3ac9D0c95dEa562B073";
  
  const lotteryABI = [
    "function getContractAddresses() view returns (address points, address token)",
    "function purchaseTicket(uint256 lotteryId, uint256 optionId)"
  ];

  const pointsABI = [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address, address) view returns (uint256)",
    "function approve(address, uint256) returns (bool)"
  ];

  try {
    const lotteryContract = new ethers.Contract(lotteryAddress, lotteryABI, deployer);
    const externalPointsContract = new ethers.Contract(externalPointsAddress, pointsABI, deployer);

    console.log("1. Checking address mismatch...");
    const [internalPointsAddr, internalTokenAddr] = await lotteryContract.getContractAddresses();
    
    console.log("   - External Points address:", externalPointsAddress);
    console.log("   - Internal Points address:", internalPointsAddr);
    console.log("   - Addresses match?", externalPointsAddress.toLowerCase() === internalPointsAddr.toLowerCase());

    if (externalPointsAddress.toLowerCase() !== internalPointsAddr.toLowerCase()) {
      console.log("\n❌ CRITICAL: Contract address mismatch detected!");
      console.log("   The lottery contract is using a different points contract than we're testing with.");
      
      console.log("\n2. Options to fix:");
      console.log("   Option A: Redeploy all contracts together");
      console.log("   Option B: Use the internal points contract for testing");
      
      // 让我们使用内部积分合约进行测试
      console.log("\n3. Switching to internal points contract...");
      const internalPointsContract = new ethers.Contract(internalPointsAddr, pointsABI, deployer);
      
      // 检查内部积分合约状态
      const internalBalance = await internalPointsContract.balanceOf(user1.address);
      console.log("   - User1 balance in internal contract:", ethers.utils.formatEther(internalBalance), "LTP");
      
      if (internalBalance.eq(0)) {
        console.log("   ⚠️  User1 has no points in internal contract, minting...");
        // 给内部积分合约铸造积分
        const mintTx = await internalPointsContract.mint(user1.address, ethers.utils.parseEther("10000"));
        await mintTx.wait();
        console.log("   ✅ Minted 10000 LTP to user1 in internal contract");
      }
      
      // 用户授权给主合约
      const user1InternalPoints = internalPointsContract.connect(user1);
      const approveTx = await user1InternalPoints.approve(lotteryAddress, ethers.utils.parseEther("10000"));
      await approveTx.wait();
      console.log("   ✅ User1 approved internal contract");
      
      // 测试购买
      console.log("\n4. Testing purchase with internal contract...");
      const user1Lottery = lotteryContract.connect(user1);
      try {
        const purchaseTx = await user1Lottery.purchaseTicket(0, 0, { gasLimit: 500000 });
        await purchaseTx.wait();
        console.log("   ✅ PURCHASE SUCCESSFUL with internal points contract!");
        
        // 验证结果
        const lotteries = await lotteryContract.getAllLotteries();
        const nbaLottery = lotteries[0];
        console.log("   - Lottery pool:", ethers.utils.formatEther(nbaLottery.totalPool), "LTP");
        
      } catch (error: any) {
        console.log("   ❌ Purchase with internal contract failed:", error.reason || error.message);
      }
    } else {
      console.log("\n✅ Addresses match, the issue is elsewhere.");
    }

  } catch (error: any) {
    console.error("❌ Fix failed:", error.message);
  }
}

main().catch(console.error);