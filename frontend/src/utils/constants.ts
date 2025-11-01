// src/utils/constants.ts
export const CONTRACT_ADDRESSES = {
  lottery: "0xA186798C8498525AdA9049d6b34Abc0e352b6F19",
  points: "0x1bfBDeD8ed2C26C5Cf2a8F138492437FEcA40311", 
  token: "0x2Fc10f168199b57eaBE4993834DD3492D0A34044"
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
