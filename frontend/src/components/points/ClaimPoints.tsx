// src/components/points/ClaimPoints.tsx
import React, { useState } from 'react';
import { usePoints } from '../../hooks/usePoints';
export const ClaimPoints: React.FC = () => {
  const { hasClaimed, claimPoints, loading, refreshPoints } = usePoints();
  const [error, setError] = useState<string>('');

  const handleClaim = async () => {
    try {
      setError('');
      await claimPoints();
      // 手动刷新状态
      setTimeout(() => {
        refreshPoints();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to claim points');
    }
  };

  const handleRetry = () => {
    setError('');
    refreshPoints();
  };

  if (hasClaimed) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-800 font-medium">You have already claimed your test points!</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-2">Claim Test Points</h3>
      <p className="text-blue-700 mb-4">
        Get 1,000 LTP test points to start playing! This is only available once per wallet.
      </p>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <p className="text-red-800 text-sm mb-2">{error}</p>
          <button
            onClick={handleRetry}
            className="text-red-600 hover:text-red-800 text-sm underline"
          >
            Check Status Again
          </button>
        </div>
      )}
      
      <button
        onClick={handleClaim}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
      >
        {loading ? 'Claiming...' : 'Claim 1,000 LTP'}
      </button>
    </div>
  );
};