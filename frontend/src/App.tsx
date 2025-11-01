// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/common/Header';
import { LotteriesPage } from './pages/LotteriesPage';
import { MarketPage } from './pages/MarketPage';
import { MyTicketsPage } from './pages/MyTicketsPage';
import { PointsPage } from './pages/PointsPage';
import { useWeb3 } from './hooks/useWeb3';
import { NetworkStatus } from './components/common/NetworkStatus';

const MainContent: React.FC = () => {
  const { isConnected } = useWeb3();

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-6">🎰</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to EasyBet</h2>
          <p className="text-gray-600 mb-6 text-lg">
            A decentralized lottery platform built on Ethereum. Connect your wallet to start playing!
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-semibold text-blue-900 mb-2">Play Lotteries</h3>
              <p className="text-blue-700 text-sm">Participate in exciting lottery games with multiple options</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">🏪</div>
              <h3 className="font-semibold text-green-900 mb-2">Trade Tickets</h3>
              <p className="text-green-700 text-sm">Buy and sell lottery tickets in the secondary market</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">🪙</div>
              <h3 className="font-semibold text-purple-900 mb-2">Earn Rewards</h3>
              <p className="text-purple-700 text-sm">Win big prizes and manage your earnings</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              <strong>Note:</strong> Make sure you're connected to the correct network (Ganache/Hardhat) and have MetaMask installed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <NetworkStatus />
      <Routes>
        <Route path="/" element={<LotteriesPage />} />
        <Route path="/lotteries" element={<LotteriesPage />} />
        <Route path="/market" element={<MarketPage />} />
        <Route path="/my-tickets" element={<MyTicketsPage />} />
        <Route path="/points" element={<PointsPage />} />
      </Routes>
    </>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main>
          <MainContent />
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
    </Router>
  );
};

export default App;