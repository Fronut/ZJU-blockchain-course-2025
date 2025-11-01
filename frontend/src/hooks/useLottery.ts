// src/hooks/useLottery.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { Lottery, Ticket, Listing, OrderBookLevel } from '../types';
import { CONTRACT_ADDRESSES } from '../utils/constants';
import { useWeb3 } from './useWeb3';

// 完整的 Lottery 合约 ABI
const LOTTERY_ABI = [
  // 视图函数
  "function getAllLotteries() view returns (tuple(uint256 id, string name, string description, string[] options, uint256 totalPool, uint256 endTime, uint8 status, uint256 winningOption, uint256 ticketPrice, uint256[] optionCounts, uint256[] optionAmounts)[])",
  "function getUserTickets(address user) view returns (tuple(uint256 tokenId, uint256 lotteryId, string lotteryName, uint256 optionId, string optionName, uint256 amount, uint256 purchaseTime, uint8 status)[])",
  "function getActiveListings() view returns (tuple(uint256 listingId, uint256 tokenId, uint256 lotteryId, string lotteryName, uint256 optionId, string optionName, address seller, uint256 price, uint256 ticketAmount, uint256 listingTime, uint8 status)[])",
  "function getOrderBook(uint256 lotteryId, uint256 optionId) view returns (uint256[] prices, uint256[] quantities)",
  "function getContractAddresses() view returns (address points, address token)",
  "function claimPoints()",
  
  // 交易函数
  "function createLottery(string name, string description, string[] options, uint256 ticketPrice, uint256 durationInDays)",
  "function purchaseTicket(uint256 lotteryId, uint256 optionId)",
  "function listTicket(uint256 tokenId, uint256 price)",
  "function cancelListing(uint256 listingId)",
  "function buyListing(uint256 listingId)",
  "function buyAtBestPrice(uint256 lotteryId, uint256 optionId)",
  "function endLottery(uint256 lotteryId, uint256 winningOption)",
  "function settleLottery(uint256 lotteryId)",
  "function refundLottery(uint256 lotteryId)"
];

// 防抖 Hook
const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useLottery = () => {
  const { signer, account, isConnected } = useWeb3();
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [activeListings, setActiveListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // 使用防抖避免频繁更新
  const debouncedIsConnected = useDebounce(isConnected, 300);
  const debouncedAccount = useDebounce(account, 300);

  // 使用 useMemo 缓存合约实例
  const lotteryContract = useMemo(() => {
    if (!signer) {
      console.log('No signer available for contract');
      return null;
    }
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.lottery, LOTTERY_ABI, signer);
      console.log('Contract instance created');
      return contract;
    } catch (error) {
      console.error('Failed to create contract instance:', error);
      return null;
    }
  }, [signer]);

  const fetchAllLotteries = useCallback(async () => {
    if (!lotteryContract) {
      console.log('No contract instance available for fetching lotteries');
      return;
    }
    
    try {
      setError('');
      console.log('Fetching lotteries from contract...');
      
      const lotteriesData = await lotteryContract.getAllLotteries();
      console.log('Raw lotteries data received:', lotteriesData);
      
      // 检查数据是否为空
      if (!lotteriesData || lotteriesData.length === 0) {
        console.log('No lotteries found in contract');
        setLotteries([]);
        return;
      }
      
      const formattedLotteries: Lottery[] = lotteriesData.map((lottery: any, index: number) => {
        const endTime = Number(lottery.endTime);
        const currentTime = Math.floor(Date.now() / 1000);
        const timeRemaining = endTime - currentTime;
        const status = Number(lottery.status); // 转换为 number
        const isActive = status === 0 && timeRemaining > 0; // 现在使用 number 比较
        
        console.log(`Lottery ${index}:`, {
          id: Number(lottery.id),
          name: lottery.name,
          status: status, // 现在是 number
          statusRaw: lottery.status, // 原始 BigInt
          endTime: endTime,
          currentTime: currentTime,
          timeRemaining: timeRemaining,
          timeRemainingDays: timeRemaining / (60 * 60 * 24),
          isActive: isActive, // 现在应该为 true
          totalPool: ethers.formatEther(lottery.totalPool),
          ticketPrice: ethers.formatEther(lottery.ticketPrice)
        });
        
        return {
          id: Number(lottery.id),
          name: lottery.name,
          description: lottery.description,
          options: lottery.options,
          totalPool: ethers.formatEther(lottery.totalPool),
          endTime: endTime,
          status: status, // 存储为 number
          winningOption: Number(lottery.winningOption),
          ticketPrice: ethers.formatEther(lottery.ticketPrice),
          optionCounts: lottery.optionCounts.map((count: bigint) => Number(count)),
          optionAmounts: lottery.optionAmounts.map((amount: bigint) => ethers.formatEther(amount))
        };
      });
      
      console.log('Formatted lotteries:', formattedLotteries);
      setLotteries(formattedLotteries);
    } catch (error) {
      console.error('Failed to fetch lotteries:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to load lotteries: ${errorMessage}`);
      setLotteries([]);
    }
  }, [lotteryContract]);

  const fetchMyTickets = useCallback(async () => {
    if (!lotteryContract || !debouncedAccount) {
      console.log('No contract or account available for fetching tickets');
      setMyTickets([]);
      return;
    }
    
    try {
      console.log('Fetching tickets for account:', debouncedAccount);
      const ticketsData = await lotteryContract.getUserTickets(debouncedAccount);
      console.log('Raw tickets data received:', ticketsData);
      
      if (!ticketsData || ticketsData.length === 0) {
        console.log('No tickets found for account - this is normal if no purchases made');
        setMyTickets([]);
        return;
      }
      
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
      
      console.log('Formatted tickets:', formattedTickets);
      setMyTickets(formattedTickets);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      setMyTickets([]);
    }
  }, [lotteryContract, debouncedAccount]);

  const fetchActiveListings = useCallback(async () => {
    if (!lotteryContract) {
      console.log('No contract instance available for fetching listings');
      setActiveListings([]);
      return;
    }
    
    try {
      console.log('Fetching active listings from contract...');
      const listingsData = await lotteryContract.getActiveListings();
      console.log('Raw listings data received:', listingsData);
      
      if (!listingsData || listingsData.length === 0) {
        console.log('No active listings found - this is normal if no tickets listed for sale');
        setActiveListings([]);
        return;
      }
      
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
      
      console.log('Formatted listings:', formattedListings);
      setActiveListings(formattedListings);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
      setActiveListings([]);
    }
  }, [lotteryContract]);

  // 初始化数据 - 使用防抖后的值
  useEffect(() => {
    let mounted = true;

    const initializeData = async () => {
      if (!mounted) return;
      
      if (debouncedIsConnected && lotteryContract) {
        console.log('Initializing lottery data with debounced values...');
        setLoading(true);
        
        try {
          // 顺序加载数据
          await fetchAllLotteries();
          if (!mounted) return;
          
          await fetchMyTickets();
          if (!mounted) return;
          
          await fetchActiveListings();
          if (!mounted) return;
          
        } catch (error) {
          console.error('Error during data initialization:', error);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      } else {
        console.log('Resetting data - not connected or no contract');
        // 重置状态当断开连接时
        setLotteries([]);
        setMyTickets([]);
        setActiveListings([]);
        setError('');
        setLoading(false);
      }
    };

    initializeData();

    return () => {
      mounted = false;
    };
  }, [debouncedIsConnected, lotteryContract, fetchAllLotteries, fetchMyTickets, fetchActiveListings]);

  // 创建彩票
  const createLottery = async (
    name: string,
    description: string,
    options: string[],
    ticketPrice: string,
    durationInDays: number
  ) => {
    if (!lotteryContract) throw new Error('Wallet not connected');
    
    try {
      console.log('Creating lottery:', { name, description, options, ticketPrice, durationInDays });
      const tx = await lotteryContract.createLottery(
        name,
        description,
        options,
        ethers.parseEther(ticketPrice),
        durationInDays
      );
      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      console.log('Transaction confirmed');
      
      // 刷新数据
      await fetchAllLotteries();
    } catch (error) {
      console.error('Failed to create lottery:', error);
      throw error;
    }
  };

  // 购买彩票
  const purchaseTicket = async (lotteryId: number, optionId: number) => {
    if (!lotteryContract) throw new Error('Wallet not connected');
    
    try {
      console.log('Purchasing ticket:', { lotteryId, optionId });
      const tx = await lotteryContract.purchaseTicket(lotteryId, optionId);
      console.log('Purchase transaction sent:', tx.hash);
      await tx.wait();
      console.log('Purchase transaction confirmed');
      
      // === 新增：自动授权 NFT ===
      const tokenContract = new ethers.Contract(CONTRACT_ADDRESSES.token, [
        "function approve(address, uint256) returns (bool)",
        "function balanceOf(address) view returns (uint256)"
      ], signer);
      
      // 获取用户的最新票券
      const userTickets = await lotteryContract.getUserTickets(account);
      const latestTicket = userTickets[userTickets.length - 1];
      
      if (latestTicket) {
        const approveTx = await tokenContract.approve(CONTRACT_ADDRESSES.lottery, latestTicket.tokenId);
        await approveTx.wait();
        console.log('✅ NFT auto-authorized for listing');
      }
      // === 授权结束 ===
      
      // 刷新数据
      await fetchMyTickets();
      await fetchAllLotteries();
    } catch (error) {
      console.error('Failed to purchase ticket:', error);
      throw error;
    }
  };

  // 挂单出售彩票
  const listTicket = async (tokenId: number, price: string) => {
  if (!lotteryContract) throw new Error('Wallet not connected');

    try {
      console.log('Listing ticket:', { tokenId, price });
      
      // === 新增：检查 NFT 授权状态 ===
      const tokenContract = new ethers.Contract(CONTRACT_ADDRESSES.token, [
        "function getApproved(uint256) view returns (address)",
        "function isApprovedForAll(address, address) view returns (bool)"
      ], signer);
      
      const approvedAddress = await tokenContract.getApproved(tokenId);
      const isApprovedForAll = await tokenContract.isApprovedForAll(account, CONTRACT_ADDRESSES.lottery);
      
      if (approvedAddress.toLowerCase() !== CONTRACT_ADDRESSES.lottery.toLowerCase() && !isApprovedForAll) {
        throw new Error('NFT not authorized. Please authorize the NFT first.');
      }
      // === 授权检查结束 ===
      
      const tx = await lotteryContract.listTicket(tokenId, ethers.parseEther(price));
      console.log('List transaction sent:', tx.hash);
      await tx.wait();
      console.log('List transaction confirmed');
      
      await fetchMyTickets();
      await fetchActiveListings();
    } catch (error: any) {
      console.error('Failed to list ticket:', error);
      
      // === 改进错误信息 ===
      let errorMessage = 'Failed to list ticket';
      if (error.reason?.includes('Not ticket owner')) {
        errorMessage = 'You are not the owner of this ticket';
      } else if (error.reason?.includes('Ticket not available')) {
        errorMessage = 'Ticket is not available for listing';
      } else if (error.reason?.includes('Lottery not active')) {
        errorMessage = 'The lottery is no longer active';
      } else if (error.message.includes('NFT not authorized')) {
        errorMessage = 'NFT not authorized. Please authorize the NFT first.';
      }
      
      throw new Error(errorMessage);
    }
  };

  // 购买挂单
  const buyListing = async (listingId: number) => {
    if (!lotteryContract) throw new Error('Wallet not connected');
    
    try {
      console.log('Buying listing:', { listingId });
      const tx = await lotteryContract.buyListing(listingId);
      console.log('Buy listing transaction sent:', tx.hash);
      await tx.wait();
      console.log('Buy listing transaction confirmed');
      
      // 刷新数据
      await fetchMyTickets();
      await fetchActiveListings();
    } catch (error) {
      console.error('Failed to buy listing:', error);
      throw error;
    }
  };

  // 按最优价格购买
  const buyAtBestPrice = async (lotteryId: number, optionId: number) => {
    if (!lotteryContract) throw new Error('Wallet not connected');
    
    try {
      console.log('Buying at best price:', { lotteryId, optionId });
      const tx = await lotteryContract.buyAtBestPrice(lotteryId, optionId);
      console.log('Buy at best price transaction sent:', tx.hash);
      await tx.wait();
      console.log('Buy at best price transaction confirmed');
      
      // 刷新数据
      await fetchMyTickets();
      await fetchActiveListings();
    } catch (error) {
      console.error('Failed to buy at best price:', error);
      throw error;
    }
  };

  // 手动刷新所有数据
  const refreshData = useCallback(async () => {
    console.log('Manual refresh triggered');
    setError('');
    setLoading(true);
    
    try {
      await fetchAllLotteries();
      await fetchMyTickets();
      await fetchActiveListings();
    } catch (error) {
      console.error('Error during manual refresh:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchAllLotteries, fetchMyTickets, fetchActiveListings]);

  return {
    lotteries,
    myTickets,
    activeListings,
    loading,
    error,
    createLottery,
    purchaseTicket,
    listTicket,
    buyListing,
    buyAtBestPrice,
    refreshData
  };
};