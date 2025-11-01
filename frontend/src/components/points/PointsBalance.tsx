// src/components/points/PointsBalance.tsx
import React from 'react';
import { usePoints } from '../../hooks/usePoints';

export const PointsBalance: React.FC = () => {
  const { pointsBalance, contractError } = usePoints();

  if (contractError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded-lg">
        <div className="text-sm font-medium">Connection Error</div>
        <div className="text-xs">Check contract deployment</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg shadow-md">
      <div className="text-sm font-medium">Points Balance</div>
      <div className="text-lg font-bold">{parseFloat(pointsBalance).toLocaleString()} LTP</div>
    </div>
  );
};