// contracts/scripts/debug-lottery-status.ts
import { ethers } from "hardhat";

async function main() {
  console.log("=== 详细诊断彩票状态 ===");
  
  const [deployer] = await ethers.getSigners();
  const provider = ethers.provider;
  const LOTTERY_ADDRESS = "0xA186798C8498525AdA9049d6b34Abc0e352b6F19";
  
  const lottery = await ethers.getContractAt("DecentralizedLottery", LOTTERY_ADDRESS);
  
  // 获取区块链时间
  const block = await provider.getBlock("latest");
  console.log(`当前区块链时间: ${new Date(block!.timestamp * 1000)}`);
  
  // 获取所有彩票详细信息
  const lotteries = await lottery.getAllLotteries();
  console.log(`\n找到 ${lotteries.length} 个彩票:`);
  
  for (let i = 0; i < lotteries.length; i++) {
    const l = lotteries[i];
    console.log(`\n=== 彩票 ${i}: ${l.name} ===`);
    console.log(`ID: ${l.id}`);
    console.log(`状态 (原始): ${l.status}`);
    console.log(`状态 (数字): ${Number(l.status)}`);
    console.log(`获胜选项: ${l.winningOption}`);
    console.log(`结束时间: ${new Date(Number(l.endTime) * 1000)}`);
    console.log(`总奖池: ${ethers.utils.formatEther(l.totalPool.toString())} LTP`);
    console.log(`选项统计: ${l.optionCounts}`);
    
    // 格式化选项金额
    const formattedAmounts = l.optionAmounts.map((amt: any) => 
      ethers.utils.formatEther(amt.toString())
    );
    console.log(`选项金额: ${formattedAmounts}`);
  }
  
  // 检查票券状态
  console.log(`\n=== 检查用户票券状态 ===`);
  const users = await provider.listAccounts();
  
  for (const user of users.slice(0, 3)) { // 只检查前3个用户
    console.log(`\n用户: ${user}`);
    try {
      const tickets = await lottery.getUserTickets(user);
      console.log(`票券数量: ${tickets.length}`);
      
      for (const ticket of tickets) {
        console.log(`- Token ${ticket.tokenId}: 状态 ${ticket.status}, 彩票 ${ticket.lotteryId}, 选项 ${ticket.optionId}`);
      }
    } catch (error: any) {
      console.log(`获取票券失败: ${error.message}`);
    }
  }
}

main().catch(console.error);