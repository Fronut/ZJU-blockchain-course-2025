// scripts/deploy-with-update.ts
import { ethers } from "hardhat";
import { writeFileSync, readFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log("Deploying contracts and updating frontend constants...");
  
  const DecentralizedLottery = await ethers.getContractFactory("DecentralizedLottery");
  const decentralizedLottery = await DecentralizedLottery.deploy();
  await decentralizedLottery.deployed();

  const lotteryAddress = decentralizedLottery.address;
  console.log(`DecentralizedLottery deployed to ${lotteryAddress}`);

  // 获取子合约地址
  const [pointsAddress, tokenAddress] = await decentralizedLottery.getContractAddresses();
  console.log(`LotteryPoints deployed to: ${pointsAddress}`);
  console.log(`LotteryToken deployed to: ${tokenAddress}`);

  // 更新前端常量文件
  updateFrontendConstants(lotteryAddress, pointsAddress, tokenAddress);
  
  console.log("\n✅ Deployment completed and frontend constants updated!");
}

function updateFrontendConstants(lottery: string, points: string, token: string) {
  const constantsContent = `// src/utils/constants.ts
export const CONTRACT_ADDRESSES = {
  lottery: "${lottery}",
  points: "${points}", 
  token: "${token}"
};

export const SUPPORTED_CHAINS = {
  1337: "Ganache Local",
  31337: "Hardhat Network"
};

export const LOTTERY_STATUS_MAP = {
  0: "Active",
  1: "Drawn", 
  2: "Refunded"
};

export const TICKET_STATUS_MAP = {
  0: "Ready",
  1: "On Sale",
  2: "Winning",
  3: "Losing"
};
`;

  // 前端项目在 ../frontend 目录
  const frontendPath = join(__dirname, "..", "..", "frontend", "src", "utils", "constants.ts");
  
  try {
    writeFileSync(frontendPath, constantsContent);
    console.log(`✅ Updated frontend constants at: ${frontendPath}`);
  } catch (error) {
    console.log("⚠️  Could not update frontend constants automatically.");
    console.log("Please manually update src/utils/constants.ts with:");
    console.log(`Lottery: ${lottery}`);
    console.log(`Points: ${points}`);
    console.log(`Token: ${token}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});