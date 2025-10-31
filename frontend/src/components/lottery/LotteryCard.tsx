// src/components/lottery/LotteryCard.tsx
import React from 'react';
import { Lottery } from '../../types';
import { LOTTERY_STATUS_MAP } from '../../utils/constants';

interface LotteryCardProps {
  lottery: Lottery;
  onViewDetails: (lottery: Lottery) => void;
}

export const LotteryCard: React.FC<LotteryCardProps> = ({ lottery, onViewDetails }) => {
  const timeRemaining = lottery.endTime * 1000 - Date.now();
  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
  
  const totalTickets = lottery.optionCounts.reduce((sum, count) => sum + count, 0);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-gray-900">{lottery.name}</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            lottery.status === 0 ? 'bg-green-100 text-green-800' : 
            lottery.status === 1 ? 'bg-blue-100 text-blue-800' : 
            'bg-gray-100 text-gray-800'
          }`}>
            {LOTTERY_STATUS_MAP[lottery.status as keyof typeof LOTTERY_STATUS_MAP]}
          </span>
        </div>
        
        <p className="text-gray-600 mb-4 line-clamp-2">{lottery.description}</p>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-500">Total Pool</div>
            <div className="text-lg font-semibold text-green-600">
              {parseFloat(lottery.totalPool).toLocaleString()} LTP
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Ticket Price</div>
            <div className="text-lg font-semibold">
              {parseFloat(lottery.ticketPrice).toLocaleString()} LTP
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Total Tickets</div>
            <div className="text-lg font-semibold">{totalTickets.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Time Remaining</div>
            <div className="text-lg font-semibold">
              {timeRemaining > 0 ? `${daysRemaining} days` : 'Ended'}
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-2">Options</div>
          <div className="flex flex-wrap gap-2">
            {lottery.options.slice(0, 3).map((option, index) => (
              <span key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                {option}
              </span>
            ))}
            {lottery.options.length > 3 && (
              <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                +{lottery.options.length - 3} more
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={() => onViewDetails(lottery)}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  );
};