// src/utils/constants.ts
export const CONTRACT_ADDRESSES = {
  lottery: "0x4C4Ea5cEc7a4035143f269B109f22262bCb618d6",
  points: "0x97B1FA2cE89A31cA3DfD9f72f296a5c91BCCC730", 
  token: "0x227BA6A0ffE25e267170Ac57FDCCFfFED3f372Ba"
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
