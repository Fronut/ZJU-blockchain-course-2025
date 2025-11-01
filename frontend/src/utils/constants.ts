// src/utils/constants.ts
export const CONTRACT_ADDRESSES = {
  lottery: "0x4F689402C7F3A175E6bcBC0d0Eb928606844f3F3",
  points: "0x0c1634C1A6eC7F387466eDa17b584356b6354E1D", 
  token: "0x2d71d2d74E0E508CDf57804A143077447D6068A9"
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
