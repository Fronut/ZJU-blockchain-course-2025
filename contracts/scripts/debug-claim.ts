// scripts/debug-claim.ts
import { ethers } from "hardhat";

async function debugClaim() {
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
    "function CLAIM_AMOUNT() view returns (uint256)",
    "function MAX_SUPPLY() view returns (uint256)"
  ];

  try {
    const lotteryContract = new ethers.Contract(lotteryAddress, lotteryABI, deployer);
    const [pointsAddress] = await lotteryContract.getContractAddresses();
    const pointsContract = new ethers.Contract(pointsAddress, pointsABI, deployer);
    
    console.log("Points contract:", pointsAddress);
    
    // 检查所有相关状态
    console.log("\n=== Contract State ===");
    const balance = await pointsContract.balanceOf(deployer.address);
    const hasClaimed = await pointsContract.hasClaimed(deployer.address);
    const totalSupply = await pointsContract.totalSupply();
    const claimAmount = await pointsContract.CLAIM_AMOUNT();
    const maxSupply = await pointsContract.MAX_SUPPLY ? await pointsContract.MAX_SUPPLY() : ethers.BigNumber.from("0");
    
    console.log("Deployer balance:", balance.toString());
    console.log("Has claimed:", hasClaimed);
    console.log("Total supply:", totalSupply.toString());
    console.log("Claim amount:", claimAmount.toString());
    console.log("Max supply:", maxSupply.toString());
    console.log("Can claim?", !hasClaimed);
    console.log("Supply check:", totalSupply.add(claimAmount).lte(maxSupply));
    
    // 如果状态正常，尝试领取
    if (!hasClaimed && totalSupply.add(claimAmount).lte(maxSupply)) {
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
        } else {
          console.log("❌ Claim failed in transaction");
        }
      } catch (txError: any) {
        console.error("❌ Transaction error:", txError.message);
        if (txError.reason) console.error("Revert reason:", txError.reason);
      }
    } else {
      console.log("❌ Cannot claim - state check failed");
    }
    
  } catch (error: any) {
    console.error("❌ Debug error:", error.message);
  }
}

debugClaim().catch(console.error);