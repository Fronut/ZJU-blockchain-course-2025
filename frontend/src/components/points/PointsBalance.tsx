// src/components/points/PointsBalance.tsx
import React from 'react';
import { usePoints } from '../../hooks/usePoints';

export const PointsBalance: React.FC = () => {
  const { pointsBalance, contractError, refreshPoints } = usePoints();

  if (contractError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded-lg">
        <div className="text-sm font-medium">Connection Error</div>
        <div className="text-xs">{contractError}</div>
        <button 
          onClick={refreshPoints}
          className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded mt-1"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg shadow-md">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-sm font-medium">Points Balance</div>
          <div className="text-lg font-bold">{parseFloat(pointsBalance).toLocaleString()} LTP</div>
        </div>
        <button
          onClick={refreshPoints}
          className="text-white hover:text-gray-200 text-sm"
          title="Refresh balance"
        >
          🔄
        </button>
      </div>
    </div>
  );
};