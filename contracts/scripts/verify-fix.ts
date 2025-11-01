// scripts/verify-fix.ts
import { ethers } from "hardhat";

async function verifyFix() {
  console.log("=== Verifying Contract Fix ===");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const lotteryAddress = "0xc9fD7ab6AcBc7cFf0a472b71A02f225A25056315";
  
  const lotteryABI = [
    "function getContractAddresses() view returns (address points, address token)",
    "function claimPoints()"
  ];

  const pointsABI = [
    "function balanceOf(address) view returns (uint256)",
    "function hasClaimed(address) view returns (bool)",
    "function totalSupply() view returns (uint256)", 
    "function CLAIM_AMOUNT() view returns (uint256)",
    "function MAX_SUPPLY() view returns (uint256)",
    "function claimPointsFor(address) external"
  ];

  try {
    const lotteryContract = new ethers.Contract(lotteryAddress, lotteryABI, deployer);
    const [pointsAddress, tokenAddress] = await lotteryContract.getContractAddresses();
    
    console.log("Points contract:", pointsAddress);
    console.log("Token contract:", tokenAddress);
    
    const pointsContract = new ethers.Contract(pointsAddress, pointsABI, deployer);
    
    // 检查所有常量是否存在
    console.log("\n=== Checking Contract Constants ===");
    const claimAmount = await pointsContract.CLAIM_AMOUNT();
    const maxSupply = await pointsContract.MAX_SUPPLY();
    const totalSupply = await pointsContract.totalSupply();
    const hasClaimed = await pointsContract.hasClaimed(deployer.address);
    const balance = await pointsContract.balanceOf(deployer.address);
    
    console.log("CLAIM_AMOUNT:", claimAmount.toString());
    console.log("MAX_SUPPLY:", maxSupply.toString()); 
    console.log("Total supply:", totalSupply.toString());
    console.log("Has claimed:", hasClaimed);
    console.log("Balance:", balance.toString());
    
    console.log("\n=== Value Verification ===");
    console.log("CLAIM_AMOUNT = 1000?", claimAmount.toString() === "1000000000000000000000");
    console.log("MAX_SUPPLY = 10,000,000?", maxSupply.toString() === "10000000000000000000000000");
    console.log("Initial supply = 1,000,000?", balance.toString() === "1000000000000000000000000");
    console.log("Has claimed = false?", hasClaimed === false);
    
    // 测试领取功能
    if (!hasClaimed) {
      console.log("\n=== Testing Claim Function ===");
      // 直接调用LotteryPoints合约的claimPointsFor函数
      const tx = await pointsContract.claimPointsFor(deployer.address, { gasLimit: 200000 });
      console.log("Transaction hash:", tx.hash);
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log("✅ Claim transaction successful!");
        
        // 检查领取后的状态
        const newBalance = await pointsContract.balanceOf(deployer.address);
        const newHasClaimed = await pointsContract.hasClaimed(deployer.address);
        const newTotalSupply = await pointsContract.totalSupply();
        
        console.log("\n=== After Claim ===");
        console.log("New balance:", newBalance.toString());
        console.log("New has claimed:", newHasClaimed);
        console.log("New total supply:", newTotalSupply.toString());
        
        console.log("\n=== Final Verification ===");
        console.log("Balance increased by 1000?", newBalance.sub(balance).toString() === "1000000000000000000000");
        console.log("Has claimed updated to true?", newHasClaimed === true);
        console.log("Total supply increased correctly?", newTotalSupply.sub(totalSupply).toString() === "1000000000000000000000");
        
        if (newHasClaimed && newBalance.sub(balance).toString() === "1000000000000000000000") {
          console.log("\n🎉 CONTRACT FIX VERIFIED SUCCESSFULLY!");
        }
      } else {
        console.log("❌ Claim transaction failed");
      }
    } else {
      console.log("❌ Cannot test claim - already claimed");
    }
    
  } catch (error: any) {
    console.error("❌ Verification error:", error.message);
    if (error.reason) {
      console.error("Revert reason:", error.reason);
    }
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

verifyFix().catch(console.error);