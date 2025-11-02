// src/components/lottery/LotteryDetail.tsx
import React, { useState, useEffect } from 'react';
import { Lottery } from '../../types';
import { useLottery } from '../../hooks/useLottery';
import { usePoints } from '../../hooks/usePoints';
import { LOTTERY_STATUS_MAP } from '../../utils/constants';
import { Loading } from '../common/Loading';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../../utils/constants';
import { useWeb3 } from '../../hooks/useWeb3';

interface LotteryDetailProps {
  lottery: Lottery;
  onBack: () => void;
}

export const LotteryDetail: React.FC<LotteryDetailProps> = ({ lottery, onBack }) => {
  const { purchaseTicket } = useLottery();
  const { pointsBalance } = usePoints();
  const { account, isConnected } = useWeb3();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsApproval, setNeedsApproval] = useState(false);
  const [approving, setApproving] = useState(false);

  // 修复：正确的活跃状态判断
  const currentTime = Math.floor(Date.now() / 1000);
  const timeRemaining = lottery.endTime - currentTime;
  const isActuallyActive = lottery.status === 0 && timeRemaining > 0;
  const isExpiredButNotProcessed = lottery.status === 0 && timeRemaining <= 0;
  const totalTickets = lottery.optionCounts.reduce((sum, count) => sum + count, 0);
  const hasEnoughPoints = parseFloat(pointsBalance) >= parseFloat(lottery.ticketPrice);

  // 检查授权状态
  const checkApproval = async () => {
    if (!isConnected || !account) return;
    
    try {
      const { ethereum } = window as any;
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      
      const pointsContract = new ethers.Contract(CONTRACT_ADDRESSES.points, [
        "function allowance(address, address) view returns (uint256)"
      ], signer);
      
      const allowance = await pointsContract.allowance(account, CONTRACT_ADDRESSES.lottery);
      const ticketPriceWei = ethers.parseEther(lottery.ticketPrice);
      
      setNeedsApproval(allowance < ticketPriceWei);
    } catch (error) {
      console.error('Failed to check approval:', error);
    }
  };

  // 授权函数
  const handleApprove = async () => {
    try {
      setApproving(true);
      setError('');
      
      const { ethereum } = window as any;
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      
      const pointsContract = new ethers.Contract(CONTRACT_ADDRESSES.points, [
        "function approve(address, uint256) returns (bool)"
      ], signer);
      
      const approveAmount = ethers.parseEther("10000");
      const tx = await pointsContract.approve(CONTRACT_ADDRESSES.lottery, approveAmount);
      await tx.wait();
      
      setNeedsApproval(false);
    } catch (error: any) {
      console.error('Approval failed:', error);
      setError(error.message || 'Failed to approve LTP');
    } finally {
      setApproving(false);
    }
  };

  // 选项选择处理函数
  const handleOptionSelect = (index: number) => {
    if (!isActuallyActive) return;
    
    // 如果点击已选中的选项，取消选择；否则选择新选项
    if (selectedOption === index) {
      setSelectedOption(null);
    } else {
      setSelectedOption(index);
    }
  };

  // 购买函数
  const handlePurchase = async () => {
    if (selectedOption === null || selectedOption === undefined) {
      setError('Please select an option');
      return;
    }

    if (selectedOption < 0 || selectedOption >= lottery.options.length) {
      setError('Invalid option selected');
      return;
    }

    if (!hasEnoughPoints) {
      setError('Insufficient points balance');
      return;
    }

    if (!isActuallyActive) {
      setError('This lottery is no longer active');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await purchaseTicket(lottery.id, selectedOption);
      setSelectedOption(null);
      
      // 购买后重新检查授权状态
      setTimeout(() => {
        checkApproval();
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to purchase ticket');
    } finally {
      setLoading(false);
    }
  };

  const getOptionPercentage = (optionIndex: number) => {
    if (totalTickets === 0) return 0;
    return (lottery.optionCounts[optionIndex] / totalTickets) * 100;
  };

  // 修复：购买按钮禁用条件
  const isPurchaseDisabled = !isActuallyActive || 
    selectedOption === null || 
    selectedOption === undefined ||
    selectedOption < 0 || 
    selectedOption >= lottery.options.length ||
    !hasEnoughPoints || 
    loading;

  // 监听账户和彩票价格变化
  useEffect(() => {
    if (isConnected && account) {
      checkApproval();
    }
  }, [isConnected, account, lottery.ticketPrice]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={onBack}
        className="flex items-center text-blue-500 hover:text-blue-600 mb-6 font-medium"
      >
        ← Back to Lotteries
      </button>

      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{lottery.name}</h1>
              <p className="text-blue-100 text-lg">{lottery.description}</p>
            </div>
            <div className="text-right">
              <div className="text-blue-100 text-sm">Status</div>
              <div className="text-xl font-semibold">
                {LOTTERY_STATUS_MAP[lottery.status as keyof typeof LOTTERY_STATUS_MAP]}
                {isExpiredButNotProcessed && ' (Ended)'}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50 border-b">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {parseFloat(lottery.totalPool).toLocaleString()} LTP
            </div>
            <div className="text-gray-600 text-sm">Total Pool</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{totalTickets.toLocaleString()}</div>
            <div className="text-gray-600 text-sm">Total Tickets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {parseFloat(lottery.ticketPrice).toLocaleString()} LTP
            </div>
            <div className="text-gray-600 text-sm">Ticket Price</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {timeRemaining > 0 
                ? `${Math.ceil(timeRemaining / (60 * 60 * 24))} days`
                : 'Ended'
              }
            </div>
            <div className="text-gray-600 text-sm">Time Remaining</div>
          </div>
        </div>

        {/* Options and Purchase */}
        <div className="p-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Options List */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Options & Statistics</h3>
              <div className="space-y-4">
                {lottery.options.map((option, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedOption === index && isActuallyActive
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${!isActuallyActive ? 'opacity-60 cursor-not-allowed' : ''}`}
                    onClick={() => handleOptionSelect(index)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{option}</div>
                      {lottery.winningOption === index && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                          Winner
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Tickets: {lottery.optionCounts[index].toLocaleString()}</span>
                        <span>Total: {parseFloat(lottery.optionAmounts[index]).toLocaleString()} LTP</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${getOptionPercentage(index)}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        {getOptionPercentage(index).toFixed(1)}%
                      </div>
                    </div>
                    {selectedOption === index && (
                      <div className="mt-2 text-sm text-blue-600 font-medium">
                        ✓ Selected
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Purchase Section */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Purchase Ticket</h3>
              
              {/* 修复：非活跃状态提示 */}
              {!isActuallyActive && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="text-yellow-800 font-semibold">
                        {isExpiredButNotProcessed ? 'Lottery Ended - Pending Results' : 'Lottery Not Active'}
                      </h4>
                      <p className="text-yellow-700 text-sm">
                        {isExpiredButNotProcessed 
                          ? 'This lottery has ended and is waiting for results. Tickets can no longer be purchased.'
                          : 'Tickets are not available for purchase at this time.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!isActuallyActive ? (
                <div className="bg-gray-100 rounded-lg p-6 text-center">
                  <p className="text-gray-600">Ticket purchasing is not available for this lottery.</p>
                </div>
              ) : needsApproval ? (
                // 授权界面
                <div className="space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-orange-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h4 className="text-orange-800 font-semibold">Approval Required</h4>
                        <p className="text-orange-700 text-sm">
                          You need to approve the contract to spend your LTP points before purchasing tickets.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Your Points Balance:</span>
                      <span className="font-semibold">{parseFloat(pointsBalance).toLocaleString()} LTP</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Ticket Price:</span>
                      <span className="font-semibold">{parseFloat(lottery.ticketPrice).toLocaleString()} LTP</span>
                    </div>
                  </div>

                  <button
                    onClick={handleApprove}
                    disabled={approving}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
                  >
                    {approving ? (
                      <Loading size="sm" text="" />
                    ) : (
                      `Approve LTP Usage`
                    )}
                  </button>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800">{error}</p>
                    </div>
                  )}
                </div>
              ) : (
                // 购买界面
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Your Points Balance:</span>
                      <span className="font-semibold">{parseFloat(pointsBalance).toLocaleString()} LTP</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Ticket Price:</span>
                      <span className="font-semibold">{parseFloat(lottery.ticketPrice).toLocaleString()} LTP</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2 font-medium">
                      <span>Remaining after purchase:</span>
                      <span className={hasEnoughPoints ? 'text-green-600' : 'text-red-600'}>
                        {(parseFloat(pointsBalance) - parseFloat(lottery.ticketPrice)).toLocaleString()} LTP
                      </span>
                    </div>
                  </div>

                  {selectedOption !== null && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-green-800">Selected Option</div>
                          <div className="text-green-700">{lottery.options[selectedOption]}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-800 font-semibold">
                            {parseFloat(lottery.ticketPrice).toLocaleString()} LTP
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 选择状态提示 */}
                  {selectedOption === null && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-yellow-800">Please select an option to purchase a ticket</span>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={handlePurchase}
                    disabled={isPurchaseDisabled}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
                  >
                    {loading ? (
                      <Loading size="sm" text="" />
                    ) : (
                      `Purchase Ticket - ${parseFloat(lottery.ticketPrice).toLocaleString()} LTP`
                    )}
                  </button>

                  {!hasEnoughPoints && (
                    <p className="text-red-600 text-sm text-center">
                      Insufficient points. You need {parseFloat(lottery.ticketPrice)} LTP.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};