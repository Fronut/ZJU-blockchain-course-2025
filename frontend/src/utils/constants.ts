// src/utils/constants.ts
export const CONTRACT_ADDRESSES = {
  lottery: "0x2988CDcD1d31700C0297d3ac9D0c95dEa562B073",
  points: "0x56bf994f3917680069038fEd572082b47c6A3D0c", 
  token: "0xeac178ae1b6ffA42B7ce0bFDeF3a21900B4a6EAd"
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
