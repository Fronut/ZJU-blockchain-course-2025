// scripts/check-points.ts
import { ethers } from "hardhat";

async function checkPoints() {
  console.log("Checking points contract status...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  const lotteryAddress = "0xE378695CBE289A58EB0BeE457CFA61b3defcE891";
  const pointsABI = [
    "function balanceOf(address) view returns (uint256)",
    "function hasClaimed(address) view returns (bool)"
  ];
  
  const lotteryABI = [
    "function getContractAddresses() view returns (address points, address token)",
    "function claimPoints()"
  ];

  const lotteryContract = new ethers.Contract(lotteryAddress, lotteryABI, deployer);
  
  try {
    // 获取积分合约地址
    const [pointsAddress] = await lotteryContract.getContractAddresses();
    console.log("Points contract address:", pointsAddress);
    
    const pointsContract = new ethers.Contract(pointsAddress, pointsABI, deployer);
    
    // 检查是否已经领取
    const hasClaimed = await pointsContract.hasClaimed(deployer.address);
    console.log("Has claimed points:", hasClaimed);
    
    // 检查当前余额 - 使用正确的格式转换
    const balance = await pointsContract.balanceOf(deployer.address);
    const formattedBalance = ethers.formatEther ? 
      ethers.formatEther(balance) : 
      ethers.utils.formatEther(balance);
    console.log("Current points balance:", formattedBalance, "LTP");
    
    if (!hasClaimed) {
      console.log("Attempting to claim points...");
      const tx = await lotteryContract.claimPoints({ gasLimit: 100000 });
      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction confirmed in block:", receipt?.blockNumber);
      
      // 再次检查余额
      const newBalance = await pointsContract.balanceOf(deployer.address);
      const newFormattedBalance = ethers.formatEther ? 
        ethers.formatEther(newBalance) : 
        ethers.utils.formatEther(newBalance);
      console.log("New points balance:", newFormattedBalance, "LTP");
      
      // 检查领取状态
      const newHasClaimed = await pointsContract.hasClaimed(deployer.address);
      console.log("New has claimed status:", newHasClaimed);
    } else {
      console.log("Points already claimed, no action needed.");
    }
    
  } catch (error: any) {
    console.error("Error:", error.message);
    if (error.reason) {
      console.error("Revert reason:", error.reason);
    }
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

checkPoints().catch(console.error);