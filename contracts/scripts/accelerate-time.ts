// contracts/scripts/accelerate-time.ts
import { network } from "hardhat";

async function main() {
  const days = process.argv[2] ? parseInt(process.argv[2]) : 7;
  const seconds = days * 24 * 60 * 60;
  
  console.log(`加速时间 ${days} 天 (${seconds} 秒)...`);
  
  await network.provider.send("evm_increaseTime", [seconds]);
  await network.provider.send("evm_mine");
  
  const block = await network.provider.send("eth_getBlockByNumber", ["latest", false]);
  console.log(`时间加速完成！当前区块时间: ${new Date(parseInt(block.timestamp, 16) * 1000)}`);
}

main().catch(console.error);