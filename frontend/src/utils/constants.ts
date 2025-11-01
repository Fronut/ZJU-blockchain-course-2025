// src/utils/constants.ts
export const CONTRACT_ADDRESSES = {
  lottery: "0xE378695CBE289A58EB0BeE457CFA61b3defcE891",
  points: "0x436C0f624d107A3d8C6224d023eE44337727EF3F", 
  token: "0x0DB17C02ACDECA3D4E072fD0379Da385C0bc52b6"
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