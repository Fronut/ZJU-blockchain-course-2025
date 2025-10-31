// src/hooks/useLottery.ts
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { Lottery, Ticket, Listing, OrderBookLevel } from '../types';
import { CONTRACT_ADDRESSES } from '../utils/constants';
import { useWeb3 } from './useWeb3';

// 这里需要导入实际的 ABI，暂时用空对象代替
const LOTTERY_ABI = [
  "function getAllLotteries() view returns (tuple(uint256 id, string name, string description, string[] options, uint256 totalPool, uint256 endTime, uint8 status, uint256 winningOption, uint256 ticketPrice, uint256[] optionCounts, uint256[] optionAmounts)[])",
  "function getUserTickets(address user) view returns (tuple(uint256 tokenId, uint256 lotteryId, string lotteryName, uint256 optionId, string optionName, uint256 amount, uint256 purchaseTime, uint8 status)[])",
  "function getActiveListings() view returns (tuple(uint256 listingId, uint256 tokenId, uint256 lotteryId, string lotteryName, uint256 optionId, string optionName, address seller, uint256 price, uint256 ticketAmount, uint256 listingTime, uint8 status)[])",
  "function getOrderBook(uint256 lotteryId, uint256 optionId) view returns (uint256[] prices, uint256[] quantities)",
  "function createLottery(string name, string description, string[] options, uint256 ticketPrice, uint256 durationInDays)",
  "function purchaseTicket(uint256 lotteryId, uint256 optionId)",
  "function listTicket(uint256 tokenId, uint256 price)",
  "function cancelListing(uint256 listingId)",
  "function buyListing(uint256 listingId)",
  "function buyAtBestPrice(uint256 lotteryId, uint256 optionId)",
  "function claimPoints()",  // 确保包含这个方法
  "function getContractAddresses() view returns (address points, address token)"
];

export const useLottery = () => {
  const { signer, account, isConnected } = useWeb3();
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [activeListings, setActiveListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);

  const lotteryContract = signer ? new ethers.Contract(CONTRACT_ADDRESSES.lottery, LOTTERY_ABI, signer) : null;

  const fetchAllLotteries = useCallback(async () => {
    if (!lotteryContract) return;
    
    try {
      setLoading(true);
      const lotteriesData = await lotteryContract.getAllLotteries();
      const formattedLotteries: Lottery[] = lotteriesData.map((lottery: any) => ({
        id: Number(lottery.id),
        name: lottery.name,
        description: lottery.description,
        options: lottery.options,
        totalPool: ethers.formatEther(lottery.totalPool),
        endTime: Number(lottery.endTime),
        status: lottery.status,
        winningOption: Number(lottery.winningOption),
        ticketPrice: ethers.formatEther(lottery.ticketPrice),
        optionCounts: lottery.optionCounts.map((count: bigint) => Number(count)),
        optionAmounts: lottery.optionAmounts.map((amount: bigint) => ethers.formatEther(amount))
      }));
      setLotteries(formattedLotteries);
    } catch (error) {
      console.error('Failed to fetch lotteries:', error);
    } finally {
      setLoading(false);
    }
  }, [lotteryContract]);

  const fetchMyTickets = useCallback(async () => {
    if (!lotteryContract || !account) return;
    
    try {
      const ticketsData = await lotteryContract.getUserTickets(account);
      const formattedTickets: Ticket[] = ticketsData.map((ticket: any) => ({
        tokenId: Number(ticket.tokenId),
        lotteryId: Number(ticket.lotteryId),
        lotteryName: ticket.lotteryName,
        optionId: Number(ticket.optionId),
        optionName: ticket.optionName,
        amount: ethers.formatEther(ticket.amount),
        purchaseTime: Number(ticket.purchaseTime),
        status: ticket.status
      }));
      setMyTickets(formattedTickets);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    }
  }, [lotteryContract, account]);

  const fetchActiveListings = useCallback(async () => {
    if (!lotteryContract) return;
    
    try {
      const listingsData = await lotteryContract.getActiveListings();
      const formattedListings: Listing[] = listingsData.map((listing: any) => ({
        listingId: Number(listing.listingId),
        tokenId: Number(listing.tokenId),
        lotteryId: Number(listing.lotteryId),
        lotteryName: listing.lotteryName,
        optionId: Number(listing.optionId),
        optionName: listing.optionName,
        seller: listing.seller,
        price: ethers.formatEther(listing.price),
        ticketAmount: ethers.formatEther(listing.ticketAmount),
        listingTime: Number(listing.listingTime),
        status: listing.status
      }));
      setActiveListings(formattedListings);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    }
  }, [lotteryContract]);

  const createLottery = async (
    name: string,
    description: string,
    options: string[],
    ticketPrice: string,
    durationInDays: number
  ) => {
    if (!lotteryContract) throw new Error('Wallet not connected');
    
    const tx = await lotteryContract.createLottery(
      name,
      description,
      options,
      ethers.parseEther(ticketPrice),
      durationInDays
    );
    await tx.wait();
    await fetchAllLotteries();
  };

  const purchaseTicket = async (lotteryId: number, optionId: number) => {
    if (!lotteryContract) throw new Error('Wallet not connected');
    
    const tx = await lotteryContract.purchaseTicket(lotteryId, optionId);
    await tx.wait();
    await fetchMyTickets();
  };

  const listTicket = async (tokenId: number, price: string) => {
    if (!lotteryContract) throw new Error('Wallet not connected');
    
    const tx = await lotteryContract.listTicket(tokenId, ethers.parseEther(price));
    await tx.wait();
    await fetchMyTickets();
    await fetchActiveListings();
  };

  const buyListing = async (listingId: number) => {
    if (!lotteryContract) throw new Error('Wallet not connected');
    
    const tx = await lotteryContract.buyListing(listingId);
    await tx.wait();
    await fetchMyTickets();
    await fetchActiveListings();
  };

  useEffect(() => {
    if (isConnected) {
      fetchAllLotteries();
      fetchMyTickets();
      fetchActiveListings();
    }
  }, [isConnected, fetchAllLotteries, fetchMyTickets, fetchActiveListings]);

  return {
    lotteries,
    myTickets,
    activeListings,
    loading,
    createLottery,
    purchaseTicket,
    listTicket,
    buyListing,
    refreshData: () => {
      fetchAllLotteries();
      fetchMyTickets();
      fetchActiveListings();
    }
  };
};