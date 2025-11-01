// scripts/debug-points.ts
import { ethers } from "hardhat";

async function debugPoints() {
  console.log("=== Debugging Points Contract ===");
  
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  const lotteryAddress = "0x2C19F2D731E51d42F8e2e1E3a35F7A787595025d";
  
  const lotteryABI = [
    "function getContractAddresses() view returns (address points, address token)",
    "function claimPoints()"
  ];

  const pointsABI = [
    "function balanceOf(address) view returns (uint256)",
    "function hasClaimed(address) view returns (bool)",
    "function totalSupply() view returns (uint256)",
    "function CLAIM_AMOUNT() view returns (uint256)",
    "function owner() view returns (address)"
  ];

  try {
    const lotteryContract = new ethers.Contract(lotteryAddress, lotteryABI, deployer);
    const [pointsAddress, tokenAddress] = await lotteryContract.getContractAddresses();
    
    console.log("Points address:", pointsAddress);
    console.log("Token address:", tokenAddress);
    
    const pointsContract = new ethers.Contract(pointsAddress, pointsABI, deployer);
    
    // 检查合约状态
    console.log("\n=== Contract Status ===");
    const owner = await pointsContract.owner();
    console.log("Points owner:", owner);
    console.log("Is deployer owner?", owner.toLowerCase() === deployer.address.toLowerCase());
    
    const claimAmount = await pointsContract.CLAIM_AMOUNT();
    console.log("Claim amount:", claimAmount.toString());
    
    const totalSupply = await pointsContract.totalSupply();
    console.log("Total supply:", totalSupply.toString());
    
    const hasClaimed = await pointsContract.hasClaimed(deployer.address);
    console.log("Has claimed:", hasClaimed);
    
    const balance = await pointsContract.balanceOf(deployer.address);
    console.log("Current balance:", balance.toString());
    
    // 尝试直接调用 claimPoints
    if (!hasClaimed) {
      console.log("\n=== Attempting Claim ===");
      try {
        const tx = await lotteryContract.claimPoints({
          gasLimit: 200000
        });
        console.log("Claim transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("Transaction status:", receipt?.status === 1 ? "Success" : "Failed");
        
        if (receipt?.status === 1) {
          // 检查结果
          console.log("\n=== After Claim ===");
          const newHasClaimed = await pointsContract.hasClaimed(deployer.address);
          const newBalance = await pointsContract.balanceOf(deployer.address);
          const newTotalSupply = await pointsContract.totalSupply();
          
          console.log("New has claimed:", newHasClaimed);
          console.log("New balance:", newBalance.toString());
          console.log("New total supply:", newTotalSupply.toString());
          console.log("Balance increased by:", (Number(newBalance) - Number(balance)).toString());
        }
      } catch (error: any) {
        console.error("Claim error:", error.message);
        if (error.reason) console.error("Revert reason:", error.reason);
      }
    }
    
  } catch (error: any) {
    console.error("Debug error:", error.message);
  }
}

debugPoints().catch(console.error);