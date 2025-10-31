// src/App.tsx
import React, { useState } from 'react';
import { Header } from './components/common/Header';
import { LotteryList } from './components/lottery/LotteryList';
import { MarketList } from './components/market/MarketList';
import { MyTickets } from './components/market/MyTickets';
import { ClaimPoints } from './components/points/ClaimPoints';
import { useWeb3 } from './hooks/useWeb3';
import { Loading } from './components/common/Loading';

type ActiveTab = 'lotteries' | 'market' | 'my-tickets' | 'points';

export const App: React.FC = () => {
  const { isConnected } = useWeb3();
  const [activeTab, setActiveTab] = useState<ActiveTab>('lotteries');

  const renderContent = () => {
    if (!isConnected) {
      return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-6xl mb-4">🔗</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to start using EasyBet lottery platform.
            </p>
            <p className="text-sm text-gray-500">
              Make sure you're connected to the correct network (Ganache/Hardhat)
            </p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'lotteries':
        return <LotteryList />;
      case 'market':
        return <MarketList />;
      case 'my-tickets':
        return <MyTickets />;
      case 'points':
        return (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Points System</h2>
              <p className="text-gray-600 mt-2">Manage your LTP points</p>
            </div>
            <ClaimPoints />
          </div>
        );
      default:
        return <LotteryList />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Tab Navigation */}
      {isConnected && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('lotteries')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'lotteries'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Lotteries
              </button>
              <button
                onClick={() => setActiveTab('market')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'market'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Secondary Market
              </button>
              <button
                onClick={() => setActiveTab('my-tickets')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my-tickets'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Tickets
              </button>
              <button
                onClick={() => setActiveTab('points')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'points'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Points
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main>
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">EasyBet</h3>
              <p className="text-gray-600 text-sm">Decentralized Lottery Platform</p>
            </div>
            <div className="text-sm text-gray-500">
              Built with ❤️ for the blockchain community
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;