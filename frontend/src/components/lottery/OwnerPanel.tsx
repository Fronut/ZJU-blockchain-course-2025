import React, { useState } from 'react';
import { useLottery } from '../../hooks/useLottery';
import { Lottery } from '../../types';
import { Loading } from '../common/Loading';
import { LOTTERY_STATUS_MAP } from '../../utils/constants';

interface OwnerPanelProps {
  lotteries: Lottery[];
  onActionComplete: () => void;
}

export const OwnerPanel: React.FC<OwnerPanelProps> = ({ lotteries, onActionComplete }) => {
  const { endLottery, settleLottery, refundLottery } = useLottery();
  const [selectedLottery, setSelectedLottery] = useState<number | null>(null);
  const [winningOption, setWinningOption] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 获取需要公证人处理的彩票（状态为0且已过期的）
  const pendingLotteries = lotteries.filter(lottery => {
    const currentTime = Math.floor(Date.now() / 1000);
    const timeRemaining = lottery.endTime - currentTime;
    return lottery.status === 0 && timeRemaining <= 0;
  });

  // 获取已结束但未结算的彩票（状态为1）
  const drawnLotteries = lotteries.filter(lottery => lottery.status === 1);

  const handleEndLottery = async () => {
    if (selectedLottery === null || winningOption === null) {
      setError('Please select a lottery and winning option');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await endLottery(selectedLottery, winningOption);
      setSelectedLottery(null);
      setWinningOption(null);
      onActionComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to end lottery');
    } finally {
      setLoading(false);
    }
  };

  const handleSettleLottery = async (lotteryId: number) => {
    try {
      setLoading(true);
      setError('');
      await settleLottery(lotteryId);
      onActionComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to settle lottery');
    } finally {
      setLoading(false);
    }
  };

  const handleRefundLottery = async (lotteryId: number) => {
    try {
      setLoading(true);
      setError('');
      await refundLottery(lotteryId);
      onActionComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to refund lottery');
    } finally {
      setLoading(false);
    }
  };

  const selectedLotteryData = selectedLottery !== null ? lotteries[selectedLottery] : null;

  if (pendingLotteries.length === 0 && drawnLotteries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Owner Panel</h3>
        <p className="text-gray-600">No pending lotteries require action.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Owner Panel - Lottery Management</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* 结束彩票表单 */}
      {pendingLotteries.length > 0 && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">End Pending Lotteries</h4>
          <p className="text-sm text-gray-600 mb-4">
            These lotteries have ended and are waiting for results to be announced.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Lottery
              </label>
              <select
                value={selectedLottery || ''}
                onChange={(e) => setSelectedLottery(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a lottery</option>
                {pendingLotteries.map(lottery => (
                  <option key={lottery.id} value={lottery.id}>
                    {lottery.name} (ID: {lottery.id})
                  </option>
                ))}
              </select>
            </div>

            {selectedLotteryData && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Winning Option
                </label>
                <select
                  value={winningOption || ''}
                  onChange={(e) => setWinningOption(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose winning option</option>
                  {selectedLotteryData.options.map((option, index) => (
                    <option key={index} value={index}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {selectedLotteryData && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
              <h5 className="font-semibold text-blue-900 mb-2">Lottery Details:</h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Total Pool:</div>
                <div className="font-semibold">{parseFloat(selectedLotteryData.totalPool).toLocaleString()} LTP</div>
                <div>Total Tickets:</div>
                <div className="font-semibold">
                  {selectedLotteryData.optionCounts.reduce((sum, count) => sum + count, 0)}
                </div>
                <div>Options:</div>
                <div>
                  {selectedLotteryData.options.map((option, index) => (
                    <div key={index} className="text-xs">
                      {option}: {selectedLotteryData.optionCounts[index]} tickets
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleEndLottery}
            disabled={loading || selectedLottery === null || winningOption === null}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center"
          >
            {loading ? <Loading size="sm" text="" /> : 'End Lottery & Set Winner'}
          </button>
        </div>
      )}

      {/* 已结束但未结算的彩票 */}
      {drawnLotteries.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Settle or Refund Drawn Lotteries</h4>
          <p className="text-sm text-gray-600 mb-4">
            These lotteries have been drawn and are ready for prize distribution or refund.
          </p>
          
          <div className="space-y-3">
            {drawnLotteries.map(lottery => (
              <div key={lottery.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{lottery.name}</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 mt-2">
                    <div>Total Pool:</div>
                    <div className="font-semibold">{parseFloat(lottery.totalPool).toLocaleString()} LTP</div>
                    <div>Winning Option:</div>
                    <div className="font-semibold text-green-600">
                      {lottery.options[lottery.winningOption]}
                    </div>
                    <div>Winning Tickets:</div>
                    <div className="font-semibold">
                      {lottery.optionCounts[lottery.winningOption] || 0}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleSettleLottery(lottery.id)}
                    disabled={loading}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Distribute Prizes
                  </button>
                  <button
                    onClick={() => handleRefundLottery(lottery.id)}
                    disabled={loading}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Refund All
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};