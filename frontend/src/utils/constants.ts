// src/utils/constants.ts
export const CONTRACT_ADDRESSES = {
  lottery: "0x2C19F2D731E51d42F8e2e1E3a35F7A787595025d",
  points: "0xA84cbEcbf280F5F6c813654a63318bF413909935", 
  token: "0x86819c161081187486551fFFD4D30a1be1D3aaEA"
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