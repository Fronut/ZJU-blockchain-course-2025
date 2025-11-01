// scripts/market-test-fixed.ts
import { ethers } from "hardhat";

async function main() {
  console.log("🏪 === FIXED MARKET FUNCTIONALITY TEST ===\n");
  
  const [deployer, user1, user2] = await ethers.getSigners();
  
  const lotteryAddress = "0x6054e701946d5ACba39B1a9679066b27e7C7DBe8";
  
  const lotteryABI = [
    "function getUserTickets(address) view returns (tuple(uint256 tokenId, uint256 lotteryId, string lotteryName, uint256 optionId, string optionName, uint256 amount, uint256 purchaseTime, uint8 status)[])",
    "function listTicket(uint256, uint256)",
    "function getActiveListings() view returns (tuple(uint256 listingId, uint256 tokenId, uint256 lotteryId, string lotteryName, uint256 optionId, string optionName, address seller, uint256 price, uint256 ticketAmount, uint256 listingTime, uint8 status)[])",
    "function buyListing(uint256)"
  ];

  try {
    const lottery = new ethers.Contract(lotteryAddress, lotteryABI, deployer);

    console.log("1. Preparing for market test...");
    
    // 获取用户1的票券
    const user1Tickets = await lottery.getUserTickets(user1.address);
    console.log("   - User1 tickets:", user1Tickets.length);
    
    if (user1Tickets.length === 0) {
      console.log("   ❌ No tickets available for testing");
      return;
    }

    const ticket = user1Tickets[0];
    console.log("   - Using ticket ID:", ticket.tokenId.toString());
    console.log("   - Ticket status:", ticket.status);

    // 检查票券状态，确保是 Ready (0)
    if (ticket.status !== 0) {
      console.log("   ⚠️  Ticket not in Ready state, status:", ticket.status);
      console.log("   ℹ️  Only tickets with status 'Ready' can be listed");
      return;
    }

    console.log("\n2. Testing ticket listing...");
    const user1Lottery = lottery.connect(user1);
    
    try {
      const listTx = await user1Lottery.listTicket(
        ticket.tokenId,
        ethers.utils.parseEther("15"), // 稍高的价格
        { gasLimit: 800000 } // 增加 gas limit
      );
      console.log("   ⏳ Listing transaction sent:", listTx.hash);
      const receipt = await listTx.wait();
      console.log("   ✅ Listing successful! Gas used:", receipt.gasUsed.toString());
      
      // 检查挂单结果
      const listings = await lottery.getActiveListings();
      console.log("   - Active listings after listing:", listings.length);
      
      if (listings.length > 0) {
        console.log("   - Listing details:");
        console.log("     Listing ID:", listings[0].listingId.toString());
        console.log("     Price:", ethers.utils.formatEther(listings[0].price), "LTP");
        console.log("     Seller:", listings[0].seller);
        
        console.log("\n3. Testing listing purchase...");
        const user2Lottery = lottery.connect(user2);
        
        // 用户2需要授权和足够余额
        const pointsAddress = "0x4918b54d4402e1E15F545b25bE4b40420D214c2B";
        const points = new ethers.Contract(pointsAddress, [
          "function approve(address, uint256) returns (bool)",
          "function balanceOf(address) view returns (uint256)"
        ], user2);
        
        const user2Balance = await points.balanceOf(user2.address);
        console.log("   - User2 balance:", ethers.utils.formatEther(user2Balance), "LTP");
        
        if (parseFloat(ethers.utils.formatEther(user2Balance)) >= 15) {
          await points.approve(lotteryAddress, ethers.utils.parseEther("10000"));
          console.log("   ✅ User2 approved contract");
          
          const buyTx = await user2Lottery.buyListing(
            listings[0].listingId,
            { gasLimit: 800000 }
          );
          console.log("   ⏳ Purchase transaction sent:", buyTx.hash);
          const buyReceipt = await buyTx.wait();
          console.log("   ✅ Purchase successful! Gas used:", buyReceipt.gasUsed.toString());
          
          // 验证购买结果
          const user2TicketsAfter = await lottery.getUserTickets(user2.address);
          const listingsAfter = await lottery.getActiveListings();
          console.log("   - User2 tickets after purchase:", user2TicketsAfter.length);
          console.log("   - Active listings after purchase:", listingsAfter.length);
        } else {
          console.log("   ❌ User2 doesn't have enough balance for purchase");
        }
      }
      
    } catch (error: any) {
      console.log("   ❌ Listing failed:");
      console.log("   - Error:", error.message);
      if (error.reason) console.log("   - Reason:", error.reason);
    }

  } catch (error: any) {
    console.error("❌ Market test failed:", error.message);
  }
}

main().catch(console.error);