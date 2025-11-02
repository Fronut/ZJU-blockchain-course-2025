import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from './useWeb3';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../utils/constants';

export const useTimeCheck = () => {
  const { signer, isConnected } = useWeb3();
  const [timeMismatch, setTimeMismatch] = useState<boolean>(false);
  const [blockchainTime, setBlockchainTime] = useState<number>(0);
  const [checking, setChecking] = useState<boolean>(false);

  const checkTimeConsistency = useCallback(async () => {
    if (!signer || !isConnected) {
      setTimeMismatch(false);
      return;
    }

    try {
      setChecking(true);
      
      // 方法1: 通过获取最新区块的时间戳
      const provider = signer.provider;
      const block = await provider.getBlock('latest');
      const blockchainTimestamp = block?.timestamp || 0;
      
      setBlockchainTime(blockchainTimestamp);
      
      // 获取前端本地时间（秒）
      const localTime = Math.floor(Date.now() / 1000);
      
      // 允许一定的时间差（5分钟），考虑网络延迟
      const timeDiff = Math.abs(blockchainTimestamp - localTime);
      const hasMismatch = timeDiff > 300; // 5分钟差异
      
      console.log('Time check:', {
        blockchain: blockchainTimestamp,
        local: localTime,
        difference: timeDiff,
        hasMismatch
      });
      
      setTimeMismatch(hasMismatch);
      
    } catch (error) {
      console.error('Failed to check time consistency:', error);
      setTimeMismatch(false);
    } finally {
      setChecking(false);
    }
  }, [signer, isConnected]);

  // 定期检查时间一致性
  useEffect(() => {
    if (isConnected && signer) {
      checkTimeConsistency();
      const interval = setInterval(checkTimeConsistency, 60000); // 每分钟检查一次
      return () => clearInterval(interval);
    }
  }, [isConnected, signer, checkTimeConsistency]);

  return {
    timeMismatch,
    blockchainTime,
    checking,
    checkTimeConsistency
  };
};