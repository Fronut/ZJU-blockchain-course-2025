// src/components/lottery/LotteryDetail.tsx
import React, { useState } from 'react';
import { Lottery } from '../../types';
import { useLottery } from '../../hooks/useLottery';
import { usePoints } from '../../hooks/usePoints';
import { LOTTERY_STATUS_MAP } from '../../utils/constants';
import { Loading } from '../common/Loading';

interface LotteryDetailProps {
  lottery: Lottery;
  onBack: () => void;
}

export const LotteryDetail: React.FC<LotteryDetailProps> = ({ lottery, onBack }) => {
  const { purchaseTicket } = useLottery();
  const { pointsBalance } = usePoints();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 正确的时间计算
  const currentTime = Math.floor(Date.now() / 1000); // 当前时间戳（秒）
  const timeRemaining = lottery.endTime - currentTime;
  const isActive = lottery.status === 0 && timeRemaining > 0;
  const totalTickets = lottery.optionCounts.reduce((sum, count) => sum + count, 0);
  const hasEnoughPoints = parseFloat(pointsBalance) >= parseFloat(lottery.ticketPrice);

  console.log('LotteryDetail debug:', {
    lotteryId: lottery.id,
    status: lottery.status,
    endTime: lottery.endTime,
    currentTime,
    timeRemaining,
    isActive,
    totalTickets
  });

  const handlePurchase = async () => {
    if (selectedOption === null) {
      setError('Please select an option');
      return;
    }

    if (!hasEnoughPoints) {
      setError('Insufficient points balance');
      return;
    }

    if (!isActive) {
      setError('This lottery is no longer active');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await purchaseTicket(lottery.id, selectedOption);
      setSelectedOption(null);
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
                {!isActive && lottery.status === 0 && ' (Ended)'}
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
                      selectedOption === index && isActive
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${!isActive ? 'opacity-60 cursor-not-allowed' : ''}`}
                    onClick={() => isActive && setSelectedOption(index)}
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
                  </div>
                ))}
              </div>
            </div>

            {/* Purchase Section */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Purchase Ticket</h3>
              
              {!isActive ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">
                    {lottery.status !== 0 
                      ? `This lottery has been ${LOTTERY_STATUS_MAP[lottery.status as keyof typeof LOTTERY_STATUS_MAP].toLowerCase()}.` 
                      : 'This lottery has ended.'
                    }
                  </p>
                </div>
              ) : (
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
                      <span className={
                        hasEnoughPoints ? 'text-green-600' : 'text-red-600'
                      }>
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

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={handlePurchase}
                    disabled={!selectedOption || !hasEnoughPoints || !isActive || loading}
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