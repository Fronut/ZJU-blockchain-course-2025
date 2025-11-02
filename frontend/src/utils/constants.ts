// src/utils/constants.ts
export const CONTRACT_ADDRESSES = {
  lottery: "0x1563E40111b7e94090f428D09752acc5722AE2Dc",
  points: "0x16940008d9a0541c1AD521D3BC372e3da875A900", 
  token: "0x27b36Db15f4F280D56540cC4bFE0ddB12e8d0525"
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
