// scripts/fix-existing.ts
import { ethers } from "hardhat";

async function main() {
  console.log("Fixing existing contract issues...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // 使用最新部署的合约地址
  const lotteryAddress = "0xe690CEE1F6145e78f952667dc2AB70454fd4824E";
  const pointsAddress = "0xeA892DBE4028877E6c5dd0e896650E54b91C65b6";
  
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
    "function mint(address, uint256) external"
  ];

  try {
    const lotteryContract = new ethers.Contract(lotteryAddress, lotteryABI, deployer);
    const pointsContract = new ethers.Contract(pointsAddress, pointsABI, deployer);
    
    console.log("Current state:");
    const balance = await pointsContract.balanceOf(deployer.address);
    const hasClaimed = await pointsContract.hasClaimed(deployer.address);
    const totalSupply = await pointsContract.totalSupply();
    
    console.log("Deployer balance:", ethers.utils.formatEther(balance), "LTP");
    console.log("Has claimed:", hasClaimed);
    console.log("Total supply:", ethers.utils.formatEther(totalSupply), "LTP");

    // 如果余额为0，直接铸造积分
    if (balance.eq(0)) {
      console.log("\nMinting initial points to deployer...");
      const mintAmount = ethers.utils.parseEther("1000");
      const mintTx = await pointsContract.mint(deployer.address, mintAmount);
      await mintTx.wait();
      console.log("✅ Minted 1000 LTP to deployer");
    }

    // 测试通过主合约领取
    console.log("\nTesting claim through lottery contract...");
    try {
      const claimTx = await lotteryContract.claimPoints();
      await claimTx.wait();
      console.log("✅ Claim successful through lottery contract");
    } catch (claimError: any) {
      console.log("Claim through lottery failed, trying direct...");
      
      // 直接调用积分合约的领取
      const directClaimTx = await pointsContract.claimPoints();
      await directClaimTx.wait();
      console.log("✅ Direct claim successful");
    }

    // 验证最终状态
    const finalBalance = await pointsContract.balanceOf(deployer.address);
    const finalHasClaimed = await pointsContract.hasClaimed(deployer.address);
    
    console.log("\nFinal state:");
    console.log("Balance:", ethers.utils.formatEther(finalBalance), "LTP");
    console.log("Has claimed:", finalHasClaimed);

  } catch (error: any) {
    console.error("Fix failed:", error.message);
    if (error.reason) {
      console.error("Revert reason:", error.reason);
    }
  }
}

main().catch(console.error);