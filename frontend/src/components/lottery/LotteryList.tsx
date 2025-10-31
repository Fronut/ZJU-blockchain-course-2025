// src/components/lottery/LotteryList.tsx
import React, { useState } from 'react';
import { useLottery } from '../../hooks/useLottery';
import { LotteryCard } from './LotteryCard';
import { Loading } from '../common/Loading';
import { CreateLottery } from './CreateLottery';
import { LotteryDetail } from './LotteryDetail';
import { Lottery } from '../../types';

export const LotteryList: React.FC = () => {
  const { lotteries, loading } = useLottery();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedLottery, setSelectedLottery] = useState<Lottery | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'ended'>('all');

  const filteredLotteries = lotteries.filter(lottery => {
    if (filter === 'active') return lottery.status === 0;
    if (filter === 'ended') return lottery.status !== 0;
    return true;
  });

  if (selectedLottery) {
    return (
      <LotteryDetail 
        lottery={selectedLottery} 
        onBack={() => setSelectedLottery(null)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Lotteries</h2>
          <p className="text-gray-600 mt-2">Participate in exciting lottery games</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Create Lottery
        </button>
      </div>

      {showCreateForm && (
        <CreateLottery onClose={() => setShowCreateForm(false)} />
      )}

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Lotteries
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'active' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('ended')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'ended' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Ended
        </button>
      </div>

      {loading ? (
        <Loading text="Loading lotteries..." />
      ) : filteredLotteries.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No lotteries found</h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'No lotteries have been created yet.' 
              : `No ${filter} lotteries found.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLotteries.map(lottery => (
            <LotteryCard
              key={lottery.id}
              lottery={lottery}
              onViewDetails={setSelectedLottery}
            />
          ))}
        </div>
      )}
    </div>
  );
};