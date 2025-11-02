// contracts/scripts/fix-lottery-status.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("=== 修复彩票状态 ===");
  
  // 使用 Hardhat 的 provider
  const provider = ethers.provider;
  
  // 获取当前区块链时间
  const block = await provider.getBlock("latest");
  console.log(`当前区块链时间: ${new Date(block!.timestamp * 1000)}`);
  
  // 合约地址 - 替换为你的实际合约地址
  const LOTTERY_ADDRESS = "0xA186798C8498525AdA9049d6b34Abc0e352b6F19"; // 替换为你的合约地址
  
  // 获取合约
  const lottery = await ethers.getContractAt("DecentralizedLottery", LOTTERY_ADDRESS);
  
  // 获取所有彩票
  const lotteries = await lottery.getAllLotteries();
  console.log(`找到 ${lotteries.length} 个彩票`);
  
  for (let i = 0; i < lotteries.length; i++) {
    const lotteryInfo = lotteries[i];
    const endTime = Number(lotteryInfo.endTime);
    
    console.log(`\n彩票 ${i}: ${lotteryInfo.name}`);
    console.log(`结束时间: ${new Date(endTime * 1000)}`);
    console.log(`状态: ${lotteryInfo.status} (0=Active, 1=Drawn, 2=Refunded)`);
    
    // 如果彩票已过期但状态还是 Active
    if (lotteryInfo.status === 0 && endTime < block!.timestamp) {
      console.log(`彩票已过期，需要结束...`);
      
      try {
        // 结束彩票（设置一个获胜选项）
        console.log(`设置获胜选项为 0...`);
        const tx = await lottery.endLottery(i, 0); // 设置选项0为获胜者
        console.log(`交易已发送: ${tx.hash}`);
        await tx.wait();
        console.log(`✅ 彩票 ${i} 已结束`);
        
        // 分配奖金
        console.log(`分配奖金...`);
        const settleTx = await lottery.settleLottery(i);
        await settleTx.wait();
        console.log(`✅ 奖金已分配`);
        
      } catch (error: any) {
        console.log(`❌ 操作失败:`, error.reason || error.message);
      }
    } else if (lotteryInfo.status === 0) {
      console.log(`彩票仍在进行中，剩余时间: ${endTime - block!.timestamp} 秒`);
    } else {
      console.log(`彩票状态正常`);
    }
  }
  
  console.log("\n=== 修复完成 ===");
  
  // 显示修复后的状态
  console.log("\n=== 修复后状态 ===");
  const updatedLotteries = await lottery.getAllLotteries();
  for (let i = 0; i < updatedLotteries.length; i++) {
    const lotteryInfo = updatedLotteries[i];
    console.log(`彩票 ${i}: ${lotteryInfo.name} - 状态: ${lotteryInfo.status}`);
  }
}

main().catch(console.error);