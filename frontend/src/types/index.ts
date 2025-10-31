// src/types/index.ts
export interface Lottery {
  id: number;
  name: string;
  description: string;
  options: string[];
  totalPool: string;
  endTime: number;
  status: LotteryStatus;
  winningOption: number;
  ticketPrice: string;
  optionCounts: number[];
  optionAmounts: string[];
}

export interface Ticket {
  tokenId: number;
  lotteryId: number;
  lotteryName: string;
  optionId: number;
  optionName: string;
  amount: string;
  purchaseTime: number;
  status: TicketStatus;
}

export interface Listing {
  listingId: number;
  tokenId: number;
  lotteryId: number;
  lotteryName: string;
  optionId: number;
  optionName: string;
  seller: string;
  price: string;
  ticketAmount: string;
  listingTime: number;
  status: ListingStatus;
}

export enum LotteryStatus {
  Active = 0,
  Drawn = 1,
  Refunded = 2
}

export enum TicketStatus {
  Ready = 0,
  OnSale = 1,
  Winning = 2,
  Losing = 3
}

export enum ListingStatus {
  Selling = 0,
  Cancelled = 1,
  Sold = 2
}

export interface OrderBookLevel {
  price: string;
  quantity: number;
}

export interface Web3State {
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  provider: any;
  signer: any;
}