// src/utils/constants.ts
export const CONTRACT_ADDRESSES = {
  lottery: "0xC59c02F115E9EF8c49F7B9E10647599AF0e789c4",
  points: "0x472fC09ABB3A0490e7b9D1e7A781Cd97EC1AA586",
  token: "0xAFb3AD4A50412AC2430BC1dB561Ef776C0df6CDb"
};

export const SUPPORTED_CHAINS = {
  1337: "Ganache",
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