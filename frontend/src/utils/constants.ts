// src/utils/constants.ts
export const CONTRACT_ADDRESSES = {
  lottery: "0x742F4D253295e3b067C1Ac4171B763CE37402409",
  points: "0x1Fc4AFF8255B9363106FFAF73603fD173680B429", 
  token: "0x18544f18AD20112d99A45b7243815f7F837Bf260"
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
