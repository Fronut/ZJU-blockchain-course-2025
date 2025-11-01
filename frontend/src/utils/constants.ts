// src/utils/constants.ts
export const CONTRACT_ADDRESSES = {
  lottery: "0x6054e701946d5ACba39B1a9679066b27e7C7DBe8",
  points: "0x4918b54d4402e1E15F545b25bE4b40420D214c2B", 
  token: "0x1e6814370c38EE0d64412Bd722E08dFAFdF39283"
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
