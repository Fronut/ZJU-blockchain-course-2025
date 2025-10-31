// src/hooks/usePoints.ts
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../utils/constants';
import { useWeb3 } from './useWeb3';

const POINTS_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function claimPoints()",
  "function hasClaimed(address) view returns (bool)"
];

// 添加 Lottery ABI 用于通过主合约调用 claimPoints
const LOTTERY_ABI = [
  "function claimPoints()",
  "function getContractAddresses() view returns (address points, address token)"
];

export const usePoints = () => {
  const { signer, account, isConnected } = useWeb3();
  const [pointsBalance, setPointsBalance] = useState<string>('0');
  const [hasClaimed, setHasClaimed] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  const pointsContract = signer ? new ethers.Contract(CONTRACT_ADDRESSES.points, POINTS_ABI, signer) : null;
  const lotteryContract = signer ? new ethers.Contract(CONTRACT_ADDRESSES.lottery, LOTTERY_ABI, signer) : null;

  const fetchPointsBalance = useCallback(async () => {
    if (!pointsContract || !account) return;
    
    try {
      const balance = await pointsContract.balanceOf(account);
      setPointsBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error('Failed to fetch points balance:', error);
    }
  }, [pointsContract, account]);

  const checkClaimStatus = useCallback(async () => {
    if (!pointsContract || !account) return;
    
    try {
      const claimed = await pointsContract.hasClaimed(account);
      setHasClaimed(claimed);
    } catch (error) {
      console.error('Failed to check claim status:', error);
    }
  }, [pointsContract, account]);

  const claimPoints = async () => {
    if (!lotteryContract) throw new Error('Wallet not connected');
    
    try {
      setLoading(true);
      const tx = await lotteryContract.claimPoints();
      await tx.wait();
      await fetchPointsBalance();
      await checkClaimStatus();
    } catch (error) {
      console.error('Failed to claim points:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchPointsBalance();
      checkClaimStatus();
    }
  }, [isConnected, fetchPointsBalance, checkClaimStatus]);

  return {
    pointsBalance,
    hasClaimed,
    loading,
    claimPoints,
    refreshPoints: () => {
      fetchPointsBalance();
      checkClaimStatus();
    }
  };
};