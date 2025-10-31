import { ethers } from "hardhat";

async function main() {
  const DecentralizedLottery = await ethers.getContractFactory("DecentralizedLottery");
  const decentralizedLottery = await DecentralizedLottery.deploy();
  await decentralizedLottery.deployed();

  console.log(`DecentralizedLottery deployed to ${decentralizedLottery.address}`);

  // 获取子合约地址
  const [pointsAddress, tokenAddress] = await decentralizedLottery.getContractAddresses();
  console.log(`LotteryPoints deployed to: ${pointsAddress}`);
  console.log(`LotteryToken deployed to: ${tokenAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});