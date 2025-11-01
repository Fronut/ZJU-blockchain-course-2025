// scripts/deep-debug-transferFrom.ts
import { ethers } from "hardhat";

async function main() {
  console.log("🔍 === DEEP DEBUGGING transferFrom ISSUE ===\n");
  
  const [deployer, user1] = await ethers.getSigners();

  const pointsAddress = "0x56bf994f3917680069038fEd572082b47c6A3D0c";
  
  // 完整的ERC20 ABI，包含所有可能的方法
  const pointsABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transferFrom(address sender, address recipient, uint256 amount) returns (bool)",
    "function mint(address to, uint256 amount) external",
    "function claimPoints() external",
    "function hasClaimed(address) view returns (bool)"
  ];

  const pointsContract = new ethers.Contract(pointsAddress, pointsABI, deployer);

  try {
    console.log("1. Checking ERC20 metadata...");
    const name = await pointsContract.name();
    const symbol = await pointsContract.symbol();
    const decimals = await pointsContract.decimals();
    const totalSupply = await pointsContract.totalSupply();
    
    console.log("   - Name:", name);
    console.log("   - Symbol:", symbol);
    console.log("   - Decimals:", decimals);
    console.log("   - Total Supply:", ethers.utils.formatEther(totalSupply), "LTP");

    console.log("\n2. Testing basic transfer...");
    // 先测试基本的transfer功能
    try {
      const testAmount = ethers.utils.parseEther("100");
      const transferTx = await pointsContract.transfer(user1.address, testAmount);
      await transferTx.wait();
      console.log("   ✅ Basic transfer works");
    } catch (error: any) {
      console.log("   ❌ Basic transfer failed:", error.reason || error.message);
    }

    console.log("\n3. Testing approve...");
    // 测试approve功能
    try {
      const approveAmount = ethers.utils.parseEther("1000");
      const approveTx = await pointsContract.connect(user1).approve(deployer.address, approveAmount);
      await approveTx.wait();
      console.log("   ✅ Approve works");
      
      // 验证approve
      const allowance = await pointsContract.allowance(user1.address, deployer.address);
      console.log("   - Allowance:", ethers.utils.formatEther(allowance), "LTP");
    } catch (error: any) {
      console.log("   ❌ Approve failed:", error.reason || error.message);
    }

    console.log("\n4. Testing transferFrom with different scenarios...");
    
    // 场景1: 从user1到deployer（应该工作）
    console.log("   Scenario 1: user1 -> deployer");
    try {
      const transferFromTx = await pointsContract.transferFrom(
        user1.address, 
        deployer.address, 
        ethers.utils.parseEther("10")
      );
      await transferFromTx.wait();
      console.log("   ✅ transferFrom user1->deployer works");
    } catch (error: any) {
      console.log("   ❌ transferFrom user1->deployer failed:", error.reason || error.message);
    }

    // 场景2: 从user1到合约自身
    console.log("   Scenario 2: user1 -> contract self");
    try {
      const transferFromTx2 = await pointsContract.transferFrom(
        user1.address, 
        pointsAddress, 
        ethers.utils.parseEther("10")
      );
      await transferFromTx2.wait();
      console.log("   ✅ transferFrom user1->contract works");
    } catch (error: any) {
      console.log("   ❌ transferFrom user1->contract failed:", error.reason || error.message);
    }

    // 场景3: 使用user1作为调用者
    console.log("   Scenario 3: Using user1 as caller");
    try {
      const user1Points = pointsContract.connect(user1);
      const transferFromTx3 = await user1Points.transferFrom(
        user1.address, 
        deployer.address, 
        ethers.utils.parseEther("10")
      );
      await transferFromTx3.wait();
      console.log("   ✅ transferFrom with user1 as caller works");
    } catch (error: any) {
      console.log("   ❌ transferFrom with user1 as caller failed:", error.reason || error.message);
    }

    console.log("\n5. Checking the actual LotteryPoints contract code...");
    // 让我们检查合约是否真的实现了transferFrom
    const code = await ethers.provider.getCode(pointsAddress);
    console.log("   - Contract code length:", code.length);
    console.log("   - Is contract?", code !== "0x");

    // 检查transferFrom selector是否在字节码中
    const transferFromSelector = "0x23b872dd"; // transferFrom的function selector
    const hasTransferFrom = code.includes(transferFromSelector.slice(2));
    console.log("   - Has transferFrom function?", hasTransferFrom);

  } catch (error: any) {
    console.error("❌ Deep debug failed:", error.message);
  }
}

main().catch(console.error);