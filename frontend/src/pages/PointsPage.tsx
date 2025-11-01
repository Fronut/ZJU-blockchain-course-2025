// src/pages/PointsPage.tsx
import React, { useState, useEffect } from 'react';
import { ClaimPoints } from '../components/points/ClaimPoints';
import { usePoints } from '../hooks/usePoints';
import { Loading } from '../components/common/Loading';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../utils/constants';
import { useWeb3 } from '../hooks/useWeb3';

export const PointsPage: React.FC = () => {
  const { pointsBalance, hasClaimed, contractError, refreshPoints } = usePoints();
  const { account, isConnected } = useWeb3();
  const [approving, setApproving] = useState(false);
  const [approvalError, setApprovalError] = useState('');
  const [ltpAllowance, setLtpAllowance] = useState<string>('0');
  const [needsApproval, setNeedsApproval] = useState(false);

  // 检查LTP授权状态
  const checkLTPApproval = async () => {
    if (!isConnected || !account) return;
    
    try {
      const { ethereum } = window as any;
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      
      const pointsContract = new ethers.Contract(CONTRACT_ADDRESSES.points, [
        "function allowance(address, address) view returns (uint256)"
      ], signer);
      
      const allowance = await pointsContract.allowance(account, CONTRACT_ADDRESSES.lottery);
      const allowanceFormatted = ethers.formatEther(allowance);
      
      setLtpAllowance(allowanceFormatted);
      
      // 如果授权额度小于100 LTP，认为需要重新授权（考虑到可能的交易费用）
      const needsMoreApproval = parseFloat(allowanceFormatted) < 100;
      setNeedsApproval(needsMoreApproval);
      
    } catch (error) {
      console.error('Failed to check LTP approval:', error);
      setNeedsApproval(true); // 如果检查失败，保守起见显示授权提示
    }
  };

  // 授权函数
  const handleApproveLTP = async () => {
    if (!isConnected || !account) {
      setApprovalError('Please connect your wallet first');
      return;
    }

    try {
      setApproving(true);
      setApprovalError('');
      
      const { ethereum } = window as any;
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      
      const pointsContract = new ethers.Contract(CONTRACT_ADDRESSES.points, [
        "function approve(address, uint256) returns (bool)"
      ], signer);
      
      // 授权足够大的金额
      const approveAmount = ethers.parseEther("100000");
      const tx = await pointsContract.approve(CONTRACT_ADDRESSES.lottery, approveAmount);
      await tx.wait();
      
      // 重新检查授权状态
      await checkLTPApproval();
      
    } catch (error: any) {
      console.error('LTP approval failed:', error);
      setApprovalError(error.message || 'Failed to approve LTP usage');
    } finally {
      setApproving(false);
    }
  };

  // 监听账户和连接状态变化
  useEffect(() => {
    if (isConnected && account) {
      checkLTPApproval();
    }
  }, [isConnected, account]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* 积分领取 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Get Test Points</h2>
          <ClaimPoints />
        </div>

        {/* 当前余额 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Balance</h3>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-green-600">
              {parseFloat(pointsBalance).toLocaleString()} LTP
            </p>
            <button
              onClick={refreshPoints}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Refresh
            </button>
          </div>
          {contractError && (
            <div className="mt-2 bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-800 text-sm">{contractError}</p>
            </div>
          )}
        </div>

        {/* LTP 使用授权 - 只在需要时显示 */}
        {needsApproval && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">LTP Usage Authorization</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">
                    Why Authorization is Required
                  </h4>
                  <div className="mt-2 text-sm text-blue-700">
                    <p className="mb-2">
                      To use your LTP points for purchasing lottery tickets and trading on the market, 
                      you need to authorize the contract to spend your points on your behalf.
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>This is a standard security practice for ERC20 tokens</li>
                      <li>Authorization is required only once</li>
                      <li>You can revoke authorization at any time</li>
                      <li>Your funds remain secure in your wallet</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-orange-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-orange-800 font-medium">
                  Required for: Purchasing tickets • Buying from market • All LTP transactions
                </span>
              </div>
            </div>

            {!isConnected ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-center">
                  Please connect your wallet to authorize LTP usage
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={handleApproveLTP}
                  disabled={approving}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
                >
                  {approving ? (
                    <Loading size="sm" text="Authorizing..." />
                  ) : (
                    'Authorize LTP Usage'
                  )}
                </button>

                {approvalError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{approvalError}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 授权完成状态显示 */}
        {!needsApproval && isConnected && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">LTP Authorization Status</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-green-800 font-semibold">LTP Authorization Complete</h4>
                  <p className="text-green-700 text-sm mt-1">
                    Your LTP points are authorized for use. You can purchase lottery tickets and trade on the market.
                    {ltpAllowance !== '0' && (
                      <span> Current allowance: {parseFloat(ltpAllowance).toLocaleString()} LTP</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 使用指南 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use Your Points</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl mb-2 text-blue-600">1️⃣</div>
              <h4 className="font-semibold text-blue-900 mb-2">Claim Points</h4>
              <p className="text-blue-700 text-sm">Get your test LTP points to start playing</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl mb-2 text-green-600">2️⃣</div>
              <h4 className="font-semibold text-green-900 mb-2">Authorize Usage</h4>
              <p className="text-green-700 text-sm">Allow the contract to use your LTP for transactions</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl mb-2 text-purple-600">3️⃣</div>
              <h4 className="font-semibold text-purple-900 mb-2">Start Playing</h4>
              <p className="text-purple-700 text-sm">Buy lottery tickets and trade on the market</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};