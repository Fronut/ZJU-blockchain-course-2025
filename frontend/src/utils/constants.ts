// src/utils/constants.ts
export const CONTRACT_ADDRESSES = {
  lottery: "0xc9fD7ab6AcBc7cFf0a472b71A02f225A25056315",
  points: "0x9873eabcdeB89B547E961Bd57c36d403F485754B", 
  token: "0xb7289f451bb683A719e806FAD8Baa0049481380A"
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
