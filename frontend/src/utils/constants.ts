// src/utils/constants.ts
export const CONTRACT_ADDRESSES = {
  lottery: "0x3141118110f87875f600B3FeE4DF9c8E826e2003",
  points: "0xc8d8e5aAcAEaE47b710a36a6a144a68613daCd7f", 
  token: "0x36f8a38e99E73bCb49a8a42998cD76179FA831d6"
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
