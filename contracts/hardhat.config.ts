import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,  // 优化运行次数，值越小字节码越小
      },
      // viaIR: true, // 如果需要进一步优化，可以取消注释这行
    },
  },
  networks: {
    ganache: {
      // rpc url, change it according to your ganache configuration
      url: 'http://localhost:8545',
      // the private key of signers, change it according to your ganache user
      accounts: [
        '0x172a483415c5e119f1ea336d44646572ac34a088e7bc2884f8e1f83da4cb304a'
      ]
    },
  },
};

export default config;