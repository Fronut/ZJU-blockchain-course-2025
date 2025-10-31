// src/components/common/Header.tsx
import React from 'react';
import { WalletConnect } from './WalletConnect';
import { PointsBalance } from '../points/PointsBalance';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">EasyBet</h1>
            <nav className="ml-10 flex space-x-8">
              <a href="#lotteries" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Lotteries
              </a>
              <a href="#market" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Market
              </a>
              <a href="#my-tickets" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                My Tickets
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <PointsBalance />
            <WalletConnect />
          </div>
        </div>
      </div>
    </header>
  );
};