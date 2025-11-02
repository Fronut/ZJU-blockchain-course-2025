// src/utils/constants.ts
export const CONTRACT_ADDRESSES = {
  lottery: "0x8b37f90d65a834B836aD5AD72Aa795b3F6c425F7",
  points: "0x882C0116059E6e40a9B100F66738Cd133fd20b0d", 
  token: "0xa405f7847E27d33532CD097E4f286Dfd1aD09481"
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
