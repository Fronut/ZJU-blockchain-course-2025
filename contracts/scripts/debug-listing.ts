// scripts/debug-listing.ts
import { ethers } from "hardhat";

async function main() {
  console.log("🔍 === DEBUGGING LISTING ISSUE ===\n");
  
  const [deployer, user1] = await ethers.getSigners();
  
  // 使用最新部署的地址
  const lotteryAddress = "0x6054e701946d5ACba39B1a9679066b27e7C7DBe8";
  const pointsAddress = "0x4918b54d4402e1E15F545b25bE4b40420D214c2B";
  const tokenAddress = "0x1e6814370c38EE0d64412Bd722E08dFAFdF39283";
  
  const lotteryABI = [
    "function getUserTickets(address) view returns (tuple(uint256 tokenId, uint256 lotteryId, string lotteryName, uint256 optionId, string optionName, uint256 amount, uint256 purchaseTime, uint8 status)[])",
    "function getTicketDetails(uint256) view returns (tuple(uint256 lotteryId, uint256 optionId, uint256 purchasePrice, uint256 purchaseTime, address owner, uint8 status))",
    "function getAllLotteries() view returns (tuple(uint256 id, string name, string description, string[] options, uint256 totalPool, uint256 endTime, uint8 status, uint256 winningOption, uint256 ticketPrice, uint256[] optionCounts, uint256[] optionAmounts)[])",
    "function listTicket(uint256, uint256)",
    "function ownerOf(uint256) view returns (address)"
  ];

  const tokenABI = [
    "function ownerOf(uint256) view returns (address)",
    "function getApproved(uint256) view returns (address)"
  ];

  try {
    const lottery = new ethers.Contract(lotteryAddress, lotteryABI, deployer);
    const token = new ethers.Contract(tokenAddress, tokenABI, deployer);

    console.log("1. Checking user1 tickets...");
    const user1Tickets = await lottery.getUserTickets(user1.address);
    console.log("   - User1 tickets count:", user1Tickets.length);
    
    if (user1Tickets.length === 0) {
      console.log("   ❌ No tickets found for user1");
      return;
    }

    const ticket = user1Tickets[0];
    console.log("   - First ticket details:");
    console.log("     Token ID:", ticket.tokenId.toString());
    console.log("     Lottery ID:", ticket.lotteryId.toString());
    console.log("     Lottery Name:", ticket.lotteryName);
    console.log("     Option:", ticket.optionName);
    console.log("     Amount:", ethers.utils.formatEther(ticket.amount), "LTP");
    console.log("     Status:", ticket.status);
    console.log("     Purchase Time:", new Date(ticket.purchaseTime * 1000).toLocaleString());

    console.log("\n2. Checking ticket ownership and approval...");
    const ticketOwner = await token.ownerOf(ticket.tokenId);
    console.log("   - Ticket owner:", ticketOwner);
    console.log("   - Is user1 owner?", ticketOwner.toLowerCase() === user1.address.toLowerCase());
    
    const approvedAddress = await token.getApproved(ticket.tokenId);
    console.log("   - Approved address:", approvedAddress);
    console.log("   - Is lottery approved?", approvedAddress.toLowerCase() === lotteryAddress.toLowerCase());

    console.log("\n3. Checking lottery status...");
    const lotteries = await lottery.getAllLotteries();
    const userLottery = lotteries[ticket.lotteryId];
    console.log("   - Lottery status:", userLottery.status);
    console.log("   - End time:", new Date(userLottery.endTime * 1000).toLocaleString());
    console.log("   - Current time:", new Date().toLocaleString());
    console.log("   - Time remaining:", (userLottery.endTime - Math.floor(Date.now() / 1000)) / 3600, "hours");
    console.log("   - Is active?", userLottery.status === 0 && userLottery.endTime > Math.floor(Date.now() / 1000));

    console.log("\n4. Testing direct ticket details...");
    try {
      const ticketDetails = await lottery.getTicketDetails(ticket.tokenId);
      console.log("   ✅ Ticket details retrieved:");
      console.log("     - Lottery ID:", ticketDetails.lotteryId.toString());
      console.log("     - Option ID:", ticketDetails.optionId.toString());
      console.log("     - Owner:", ticketDetails.owner);
      console.log("     - Status:", ticketDetails.status);
      console.log("     - Purchase Price:", ethers.utils.formatEther(ticketDetails.purchasePrice), "LTP");
    } catch (error: any) {
      console.log("   ❌ Failed to get ticket details:", error.message);
    }

    console.log("\n5. Attempting to list ticket with detailed error handling...");
    const user1Lottery = lottery.connect(user1);
    
    try {
      // 首先确保用户有足够的授权
      const points = new ethers.Contract(pointsAddress, [
        "function approve(address, uint256) returns (bool)"
      ], user1);
      
      await points.approve(lotteryAddress, ethers.utils.parseEther("10000"));
      console.log("   ✅ Re-approved points");

      // 尝试挂单
      const listTx = await user1Lottery.listTicket(
        ticket.tokenId,
        ethers.utils.parseEther("12"),
        { gasLimit: 500000 }
      );
      console.log("   ⏳ Listing transaction sent:", listTx.hash);
      const receipt = await listTx.wait();
      console.log("   ✅ Listing successful! Gas used:", receipt.gasUsed.toString());
      
    } catch (error: any) {
      console.log("   ❌ Listing failed with details:");
      console.log("   - Error:", error.message);
      if (error.reason) console.log("   - Reason:", error.reason);
      if (error.data) console.log("   - Data:", error.data);
      
      // 检查具体的revert原因
      if (error.transaction) {
        console.log("   - Transaction:", error.transaction);
      }
    }

  } catch (error: any) {
    console.error("❌ Debug failed:", error.message);
  }
}

main().catch(console.error);