// src/components/common/Header.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletConnect } from './WalletConnect';
import { PointsBalance } from '../points/PointsBalance';

export const Header: React.FC = () => {
  const location = useLocation();
  
  const navigation = [
    { path: '/lotteries', label: 'Lotteries' },
    { path: '/market', label: 'Market' },
    { path: '/my-tickets', label: 'My Tickets' },
    { path: '/points', label: 'Points' }
  ];

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-gray-900 hover:text-gray-700">
              EasyBet
            </Link>
            <nav className="ml-10 flex space-x-8">
              {navigation.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
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