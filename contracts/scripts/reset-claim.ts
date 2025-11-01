// scripts/reset-claim.ts
import { ethers } from "hardhat";

async function resetClaim() {
  console.log("Resetting claim status...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  const lotteryAddress = "0xE378695CBE289A58EB0BeE457CFA61b3defcE891";
  
  const lotteryABI = [
    "function getContractAddresses() view returns (address points, address token)"
  ];

  const pointsABI = [
    "function resetClaim(address) external",
    "function hasClaimed(address) view returns (bool)",
    "function balanceOf(address) view returns (uint256)",
    "function mint(address, uint256) external"
  ];

  try {
    const lotteryContract = new ethers.Contract(lotteryAddress, lotteryABI, deployer);
    const [pointsAddress] = await lotteryContract.getContractAddresses();
    console.log("Points contract address:", pointsAddress);
    
    const pointsContract = new ethers.Contract(pointsAddress, pointsABI, deployer);
    
    // 首先检查当前状态
    console.log("Checking current status...");
    const hasClaimed = await pointsContract.hasClaimed(deployer.address);
    const balance = await pointsContract.balanceOf(deployer.address);
    
    console.log("Current status:");
    console.log("Has claimed:", hasClaimed);
    console.log("Balance:", balance.toString(), "wei");
    console.log("Balance:", (Number(balance) / 1e18).toFixed(2), "LTP");
    
    // 方案1: 尝试调用 resetClaim（如果存在）
    try {
      console.log("Attempting to reset claim status...");
      const tx = await pointsContract.resetClaim(deployer.address);
      await tx.wait();
      console.log("✅ Claim status reset successfully");
    } catch (error: any) {
      console.log("resetClaim function not available, using mint instead...");
      console.log("Mint error:", error.message);
      
      // 方案2: 直接铸造积分
      console.log("Minting 1000 LTP directly...");
      
      // 使用正确的 BigNumber 创建方法
      const mintAmount = ethers.parseEther ? 
        ethers.parseEther("1000") : 
        ethers.BigNumber.from("1000000000000000000000"); // 1000 * 10^18
        
      const mintTx = await pointsContract.mint(deployer.address, mintAmount);
      console.log("Mint transaction sent:", mintTx.hash);
      await mintTx.wait();
      console.log("✅ 1000 LTP minted directly");
    }
    
    // 验证最终结果
    console.log("Verifying final status...");
    const finalHasClaimed = await pointsContract.hasClaimed(deployer.address);
    const finalBalance = await pointsContract.balanceOf(deployer.address);
    
    console.log("Final status:");
    console.log("Has claimed:", finalHasClaimed);
    console.log("Balance:", finalBalance.toString(), "wei");
    console.log("Balance:", (Number(finalBalance) / 1e18).toFixed(2), "LTP");
    
  } catch (error: any) {
    console.error("Error:", error.message);
    if (error.reason) {
      console.error("Revert reason:", error.reason);
    }
  }
}

resetClaim().catch(console.error);