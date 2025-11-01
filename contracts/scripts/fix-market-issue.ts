// scripts/fix-market-issue.ts
import { ethers } from "hardhat";

async function main() {
  console.log("🔧 === FIXING MARKET LISTING ISSUE ===\n");
  
  const [deployer, user1, user2] = await ethers.getSigners();
  
  const lotteryAddress = "0x6054e701946d5ACba39B1a9679066b27e7C7DBe8";
  const tokenAddress = "0x1e6814370c38EE0d64412Bd722E08dFAFdF39283";
  
  const lotteryABI = [
    "function getUserTickets(address) view returns (tuple(uint256 tokenId, uint256 lotteryId, string lotteryName, uint256 optionId, string optionName, uint256 amount, uint256 purchaseTime, uint8 status)[])",
    "function listTicket(uint256, uint256)",
    "function getActiveListings() view returns (tuple(uint256 listingId, uint256 tokenId, uint256 lotteryId, string lotteryName, uint256 optionId, string optionName, address seller, uint256 price, uint256 ticketAmount, uint256 listingTime, uint8 status)[])",
    "function buyListing(uint256)"
  ];

  const tokenABI = [
    "function approve(address, uint256) returns (bool)",
    "function getApproved(uint256) view returns (address)",
    "function setApprovalForAll(address, bool) returns (bool)",
    "function isApprovedForAll(address, address) view returns (bool)"
  ];

  try {
    const lottery = new ethers.Contract(lotteryAddress, lotteryABI, deployer);
    const token = new ethers.Contract(tokenAddress, tokenABI, deployer);

    console.log("1. Checking current approval status...");
    
    // 获取用户1的票券
    const user1Tickets = await lottery.getUserTickets(user1.address);
    const ticketId = user1Tickets[0].tokenId;
    
    const currentApproval = await token.getApproved(ticketId);
    console.log("   - Current approval for ticket", ticketId.toString() + ":", currentApproval);
    console.log("   - Should be approved to lottery:", lotteryAddress);
    
    const isApprovedForAll = await token.isApprovedForAll(user1.address, lotteryAddress);
    console.log("   - Is approved for all?", isApprovedForAll);

    console.log("\n2. Fixing approval issue...");
    const user1Token = token.connect(user1);
    
    // 方法1: 单独授权这个票券
    console.log("   Method 1: Approving specific ticket...");
    try {
      const approveTx = await user1Token.approve(lotteryAddress, ticketId);
      await approveTx.wait();
      console.log("   ✅ Specific ticket approved");
      
      // 验证授权
      const newApproval = await token.getApproved(ticketId);
      console.log("   - New approval:", newApproval);
      console.log("   - Correct?", newApproval.toLowerCase() === lotteryAddress.toLowerCase());
    } catch (error: any) {
      console.log("   ❌ Specific approval failed:", error.reason || error.message);
      
      // 方法2: 授权所有票券
      console.log("   Method 2: Approving all tickets...");
      try {
        const approveAllTx = await user1Token.setApprovalForAll(lotteryAddress, true);
        await approveAllTx.wait();
        console.log("   ✅ All tickets approved");
        
        const newIsApprovedForAll = await token.isApprovedForAll(user1.address, lotteryAddress);
        console.log("   - Is approved for all now?", newIsApprovedForAll);
      } catch (error2: any) {
        console.log("   ❌ Approve all failed:", error2.reason || error2.message);
      }
    }

    console.log("\n3. Testing listing after approval fix...");
    const user1Lottery = lottery.connect(user1);
    
    try {
      // 重新检查授权状态
      const finalApproval = await token.getApproved(ticketId);
      const finalApprovedForAll = await token.isApprovedForAll(user1.address, lotteryAddress);
      
      console.log("   - Final specific approval:", finalApproval);
      console.log("   - Final approved for all:", finalApprovedForAll);
      
      if (finalApproval.toLowerCase() === lotteryAddress.toLowerCase() || finalApprovedForAll) {
        console.log("   ✅ Authorization confirmed, attempting listing...");
        
        const listTx = await user1Lottery.listTicket(
          ticketId,
          ethers.utils.parseEther("12"),
          { gasLimit: 800000 }
        );
        console.log("   ⏳ Listing transaction sent:", listTx.hash);
        const receipt = await listTx.wait();
        console.log("   ✅ LISTING SUCCESSFUL! Gas used:", receipt.gasUsed.toString());
        
        // 检查挂单结果
        const listings = await lottery.getActiveListings();
        console.log("   - Active listings:", listings.length);
        
        if (listings.length > 0) {
          console.log("\n4. Testing purchase of listed ticket...");
          const user2Lottery = lottery.connect(user2);
          
          // 用户2授权积分
          const pointsAddress = "0x4918b54d4402e1E15F545b25bE4b40420D214c2B";
          const points = new ethers.Contract(pointsAddress, [
            "function approve(address, uint256) returns (bool)",
            "function balanceOf(address) view returns (uint256)"
          ], user2);
          
          await points.approve(lotteryAddress, ethers.utils.parseEther("10000"));
          console.log("   ✅ User2 approved points");
          
          const buyTx = await user2Lottery.buyListing(
            listings[0].listingId,
            { gasLimit: 800000 }
          );
          console.log("   ⏳ Purchase transaction sent:", buyTx.hash);
          const buyReceipt = await buyTx.wait();
          console.log("   ✅ PURCHASE SUCCESSFUL! Gas used:", buyReceipt.gasUsed.toString());
          
          // 最终验证
          const finalListings = await lottery.getActiveListings();
          const user2Tickets = await lottery.getUserTickets(user2.address);
          console.log("   - Final active listings:", finalListings.length);
          console.log("   - User2 tickets after purchase:", user2Tickets.length);
        }
      } else {
        console.log("   ❌ Authorization still not correct after fixes");
      }
      
    } catch (error: any) {
      console.log("   ❌ Listing failed after approval fix:");
      console.log("   - Error:", error.message);
      if (error.reason) console.log("   - Reason:", error.reason);
      if (error.data?.message) console.log("   - Message:", error.data.message);
    }

  } catch (error: any) {
    console.error("❌ Fix failed:", error.message);
  }
}

main().catch(console.error);