// src/utils/constants.ts
export const CONTRACT_ADDRESSES = {
  lottery: "0x0Ea061E292a4D17885c1d09c30B658748c1AEe7A",
  points: "0x1f2D4d55d63251c9618F56e9ebEC229644B92A8e", 
  token: "0x7Eae58E6D2B774972afF9Ba92EAa25Bae2b00214"
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
