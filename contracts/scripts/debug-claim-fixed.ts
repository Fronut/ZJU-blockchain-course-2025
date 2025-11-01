// scripts/debug-claim-fixed.ts
import { ethers } from "hardhat";

async function debugClaimFixed() {
  console.log("=== Debugging Claim Function ===");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const lotteryAddress = "0x692AC33FE52Ca3e23c8fa4f648Da79fe3c451301";
  
  const lotteryABI = [
    "function claimPoints()",
    "function getContractAddresses() view returns (address points, address token)"
  ];

  const pointsABI = [
    "function balanceOf(address) view returns (uint256)",
    "function hasClaimed(address) view returns (bool)",
    "function totalSupply() view returns (uint256)",
    "function CLAIM_AMOUNT() view returns (uint256)"
  ];

  try {
    const lotteryContract = new ethers.Contract(lotteryAddress, lotteryABI, deployer);
    const [pointsAddress] = await lotteryContract.getContractAddresses();
    const pointsContract = new ethers.Contract(pointsAddress, pointsABI, deployer);
    
    console.log("Points contract:", pointsAddress);
    
    // 检查状态（移除 MAX_SUPPLY 检查）
    console.log("\n=== Contract State ===");
    const balance = await pointsContract.balanceOf(deployer.address);
    const hasClaimed = await pointsContract.hasClaimed(deployer.address);
    const totalSupply = await pointsContract.totalSupply();
    const claimAmount = await pointsContract.CLAIM_AMOUNT();
    
    console.log("Deployer balance:", balance.toString());
    console.log("Has claimed:", hasClaimed);
    console.log("Total supply:", totalSupply.toString());
    console.log("Claim amount:", claimAmount.toString());
    console.log("Can claim?", !hasClaimed);
    
    // 尝试领取
    if (!hasClaimed) {
      console.log("\n=== Attempting Claim ===");
      try {
        const tx = await lotteryContract.claimPoints({
          gasLimit: 300000
        });
        console.log("Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("Transaction status:", receipt.status === 1 ? "Success" : "Failed");
        
        if (receipt.status === 1) {
          console.log("✅ Claim successful!");
          
          // 检查结果
          const newBalance = await pointsContract.balanceOf(deployer.address);
          const newHasClaimed = await pointsContract.hasClaimed(deployer.address);
          console.log("New balance:", newBalance.toString());
          console.log("New has claimed:", newHasClaimed);
          console.log("Balance increase:", (Number(newBalance) - Number(balance)).toString());
        }
      } catch (txError: any) {
        console.error("❌ Transaction error:", txError.message);
        if (txError.reason) console.error("Revert reason:", txError.reason);
        if (txError.data) console.error("Error data:", txError.data);
      }
    } else {
      console.log("❌ Already claimed");
    }
    
  } catch (error: any) {
    console.error("❌ Debug error:", error.message);
  }
}

debugClaimFixed().catch(console.error);