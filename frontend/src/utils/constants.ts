// src/utils/constants.ts
export const CONTRACT_ADDRESSES = {
  lottery: "0x85876d3935FedC966826fD9d6fc19C94b59394d9",
  points: "0x8DAEfB572f4e6b437F0b8b442302EC851f662980", 
  token: "0x9ce6521Afd62Db41FCbD5a789910BD029469341b"
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
