import React from 'react';
import { useTimeCheck } from '../../hooks/useTimeCheck';

export const TimeMismatchAlert: React.FC = () => {
  const { blockchainTime, checking, checkTimeConsistency } = useTimeCheck();
  
  const localTime = Math.floor(Date.now() / 1000);
  const timeDiff = Math.abs(blockchainTime - localTime);
  const hoursDiff = (timeDiff / 3600).toFixed(1);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <div className="text-6xl mb-6">⏰</div>
        <h2 className="text-3xl font-bold text-red-900 mb-4">时间同步错误</h2>
        <p className="text-red-700 mb-6 text-lg">
          检测到前端时间与区块链时间不一致，请校准时间以确保功能正常。
        </p>
        
        <div className="bg-white rounded-lg p-6 mb-6 text-left max-w-md mx-auto">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-right text-gray-600">区块链时间:</div>
            <div className="font-mono">{new Date(blockchainTime * 1000).toLocaleString()}</div>
            
            <div className="text-right text-gray-600">本地时间:</div>
            <div className="font-mono">{new Date().toLocaleString()}</div>
            
            <div className="text-right text-gray-600">时间差异:</div>
            <div className="font-mono text-red-600">{hoursDiff} 小时</div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">如何修复:</h3>
          <ul className="text-yellow-700 text-sm text-left list-disc list-inside space-y-1">
            <li>确保您的系统时间设置正确</li>
            <li>如果您在测试环境中，请同时调整系统时间和区块链时间</li>
            <li>重启浏览器和应用</li>
            <li>检查时区设置</li>
          </ul>
        </div>

        <button
          onClick={checkTimeConsistency}
          disabled={checking}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          {checking ? '检查中...' : '重新检查时间'}
        </button>
        
        <p className="text-red-600 text-sm mt-4">
          所有功能已被禁用，直到时间同步问题解决
        </p>
      </div>
    </div>
  );
};