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
  const [contractError, setContractError] = useState<string>('');

  // 验证合约地址格式
  const validateContractAddress = (address: string): string => {
    try {
      return ethers.getAddress(address); // 这会自动修复校验和
    } catch (error) {
      console.error('Invalid contract address:', address);
      throw new Error(`Invalid contract address: ${address}`);
    }
  };

  const getPointsContract = useCallback(() => {
    if (!signer) return null;
    try {
      const validatedAddress = validateContractAddress(CONTRACT_ADDRESSES.points);
      return new ethers.Contract(validatedAddress, POINTS_ABI, signer);
    } catch (error) {
      console.error('Failed to create points contract:', error);
      setContractError('Points contract address is invalid');
      return null;
    }
  }, [signer]);

  const getLotteryContract = useCallback(() => {
    if (!signer) return null;
    try {
      const validatedAddress = validateContractAddress(CONTRACT_ADDRESSES.lottery);
      return new ethers.Contract(validatedAddress, LOTTERY_ABI, signer);
    } catch (error) {
      console.error('Failed to create lottery contract:', error);
      setContractError('Lottery contract address is invalid');
      return null;
    }
  }, [signer]);

  const fetchPointsBalance = useCallback(async () => {
    const pointsContract = getPointsContract();
    if (!pointsContract || !account) return;
    
    try {
      setContractError('');
      const balance = await pointsContract.balanceOf(account);
      setPointsBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error('Failed to fetch points balance:', error);
      setContractError('Failed to fetch points balance. Make sure contracts are deployed.');
    }
  }, [getPointsContract, account]);

  const checkClaimStatus = useCallback(async () => {
    const pointsContract = getPointsContract();
    if (!pointsContract || !account) return;
    
    try {
      setContractError('');
      const claimed = await pointsContract.hasClaimed(account);
      setHasClaimed(claimed);
    } catch (error) {
      console.error('Failed to check claim status:', error);
      setContractError('Failed to check claim status. Make sure contracts are deployed.');
    }
  }, [getPointsContract, account]);

  const claimPoints = async () => {
    const lotteryContract = getLotteryContract();
    if (!lotteryContract) throw new Error('Wallet not connected or contract address invalid');
    
    try {
      setLoading(true);
      setContractError('');
      const tx = await lotteryContract.claimPoints();
      await tx.wait();
      await fetchPointsBalance();
      await checkClaimStatus();
    } catch (error) {
      console.error('Failed to claim points:', error);
      setContractError('Failed to claim points. Make sure you have enough gas and contracts are deployed.');
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
    contractError,
    claimPoints,
    refreshPoints: () => {
      setContractError('');
      fetchPointsBalance();
      checkClaimStatus();
    }
  };
};