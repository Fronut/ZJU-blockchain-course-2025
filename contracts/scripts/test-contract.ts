// scripts/test-contract.ts
import { ethers } from "hardhat";

async function testContract() {
  console.log("Testing contract functionality...");
  
  // 在 Hardhat 环境中直接使用提供的 ethers
  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  const contractAddress = "0xE378695CBE289A58EB0BeE457CFA61b3defcE891";
  
  // 合约 ABI（只需要测试的函数）
  const ABI = [
    "function createLottery(string name, string description, string[] options, uint256 ticketPrice, uint256 durationInDays)",
    "function getAllLotteries() view returns (tuple(uint256 id, string name, string description, string[] options, uint256 totalPool, uint256 endTime, uint8 status, uint256 winningOption, uint256 ticketPrice, uint256[] optionCounts, uint256[] optionAmounts)[])",
    "function owner() view returns (address)"
  ];
  
  const contract = new ethers.Contract(contractAddress, ABI, deployer);
  
  try {
    // 检查合约所有者
    const owner = await contract.owner();
    console.log("Contract owner:", owner);
    console.log("Deployer address:", deployer.address);
    
    if (owner.toLowerCase() === deployer.address.toLowerCase()) {
      console.log("✅ Ownership correctly set to deployer");
    } else {
      console.log("❌ Ownership issue: deployer is not the owner");
      return;
    }
    
    // 测试创建彩票 - 使用正确的 ethers 方法
    console.log("Creating test lottery...");
    
    // 在 Hardhat 环境中使用 ethers.utils.parseEther 或直接使用 BigNumber
    const ticketPrice = ethers.parseEther ? ethers.parseEther("10") : ethers.utils.parseEther("10");
    
    const tx = await contract.createLottery(
      "Test Lottery",
      "This is a test lottery",
      ["Option A", "Option B"],
      ticketPrice,
      7,
      { gasLimit: 1000000 }
    );
    
    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt?.blockNumber);
    
    // 测试读取数据
    console.log("Fetching lotteries...");
    const lotteries = await contract.getAllLotteries();
    console.log("Lotteries found:", lotteries.length);
    
    if (lotteries.length > 0) {
      console.log("First lottery:", {
        id: lotteries[0].id.toString(),
        name: lotteries[0].name,
        description: lotteries[0].description
      });
    }
    
    console.log("✅ Contract test completed successfully!");
    
  } catch (error: any) {
    console.error("❌ Contract test failed:");
    console.error("Error message:", error.message);
    
    if (error.reason) {
      console.error("Revert reason:", error.reason);
    }
    
    if (error.transaction) {
      console.error("Transaction details:", error.transaction);
    }
    
    if (error.code) {
      console.error("Error code:", error.code);
    }
    
    // 打印更详细的错误信息
    console.error("Full error:", error);
  }
}

testContract().catch((error) => {
  console.error("Test script error:", error);
  process.exitCode = 1;
});