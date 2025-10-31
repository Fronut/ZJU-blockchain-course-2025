// src/components/market/MyTickets.tsx
import React, { useState } from 'react';
import { useLottery } from '../../hooks/useLottery';
import { Ticket, TicketStatus } from '../../types';
import { TICKET_STATUS_MAP } from '../../utils/constants';
import { Loading } from '../common/Loading';

export const MyTickets: React.FC = () => {
  const { myTickets, listTicket, loading } = useLottery();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [sellPrice, setSellPrice] = useState('');
  const [listing, setListing] = useState<number | null>(null);
  const [filter, setFilter] = useState<TicketStatus | 'all'>('all');

  const filteredTickets = myTickets.filter(ticket => {
    if (filter === 'all') return true;
    return ticket.status === filter;
  });

  const handleListTicket = async (tokenId: number, price: string) => {
    try {
      setListing(tokenId);
      await listTicket(tokenId, price);
      setSelectedTicket(null);
      setSellPrice('');
    } catch (error) {
      console.error('Failed to list ticket:', error);
    } finally {
      setListing(null);
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.Ready: return 'bg-green-100 text-green-800';
      case TicketStatus.OnSale: return 'bg-blue-100 text-blue-800';
      case TicketStatus.Winning: return 'bg-yellow-100 text-yellow-800';
      case TicketStatus.Losing: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Loading text="Loading your tickets..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">My Tickets</h2>
        <p className="text-gray-600 mt-2">Manage your lottery ticket collection</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            filter === 'all' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Tickets ({myTickets.length})
        </button>
        {Object.entries(TICKET_STATUS_MAP).map(([status, label]) => (
          <button
            key={status}
            onClick={() => setFilter(Number(status) as TicketStatus)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === Number(status)
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {label} ({myTickets.filter(t => t.status === Number(status)).length})
          </button>
        ))}
      </div>

      {filteredTickets.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🎫</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No tickets found</h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? "You don't have any lottery tickets yet." 
              : `You don't have any ${TICKET_STATUS_MAP[filter as keyof typeof TICKET_STATUS_MAP]?.toLowerCase()} tickets.`
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTickets.map(ticket => (
            <div
              key={ticket.tokenId}
              className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{ticket.lotteryName}</h3>
                    <p className="text-gray-600 text-sm">Option: {ticket.optionName}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(ticket.status)}`}>
                    {TICKET_STATUS_MAP[ticket.status as keyof typeof TICKET_STATUS_MAP]}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Token ID:</span>
                    <span className="font-mono">#{ticket.tokenId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Purchase Price:</span>
                    <span className="font-medium">{parseFloat(ticket.amount).toLocaleString()} LTP</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Purchased:</span>
                    <span>{new Date(ticket.purchaseTime * 1000).toLocaleDateString()}</span>
                  </div>
                </div>

                {ticket.status === TicketStatus.Ready && (
                  <button
                    onClick={() => setSelectedTicket(ticket)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-medium transition-colors"
                  >
                    Sell Ticket
                  </button>
                )}

                {ticket.status === TicketStatus.OnSale && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Currently listed for sale</p>
                  </div>
                )}

                {ticket.status === TicketStatus.Winning && (
                  <div className="text-center">
                    <p className="text-sm text-green-600 font-semibold">🎉 Winning Ticket!</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sell Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Sell Ticket</h3>
                <button
                  onClick={() => {
                    setSelectedTicket(null);
                    setSellPrice('');
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lottery
                  </label>
                  <p className="font-medium">{selectedTicket.lotteryName}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Option
                  </label>
                  <p className="font-medium">{selectedTicket.optionName}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Value
                  </label>
                  <p className="font-medium">{parseFloat(selectedTicket.amount).toLocaleString()} LTP</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selling Price (LTP)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter selling price"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Set the price you want to sell this ticket for
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setSelectedTicket(null);
                      setSellPrice('');
                    }}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleListTicket(selectedTicket.tokenId, sellPrice)}
                    disabled={!sellPrice || parseFloat(sellPrice) <= 0 || listing === selectedTicket.tokenId}
                    className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white py-2 rounded font-medium transition-colors"
                  >
                    {listing === selectedTicket.tokenId ? 'Listing...' : 'List for Sale'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};