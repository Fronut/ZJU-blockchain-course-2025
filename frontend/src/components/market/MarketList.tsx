// src/components/market/MarketList.tsx
import React, { useState } from 'react';
import { useLottery } from '../../hooks/useLottery';
import { usePoints } from '../../hooks/usePoints';
import { Listing } from '../../types';
import { Loading } from '../common/Loading';
import { useWeb3 } from '../../hooks/useWeb3';

export const MarketList: React.FC = () => {
  const { activeListings, buyListing, loading } = useLottery();
  const { pointsBalance } = usePoints();
  const { account } = useWeb3(); // 添加账户信息
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [purchasing, setPurchasing] = useState<number | null>(null);

  const handleBuyListing = async (listingId: number) => {
    try {
      setPurchasing(listingId);
      await buyListing(listingId);
    } catch (error) {
      console.error('Failed to buy listing:', error);
    } finally {
      setPurchasing(null);
    }
  };

  const canAfford = (price: string) => {
    return parseFloat(pointsBalance) >= parseFloat(price);
  };

  // 检查是否是用户自己的挂单
  const isOwnListing = (listing: Listing) => {
    return listing.seller.toLowerCase() === account?.toLowerCase();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Loading text="Loading market listings..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Secondary Market</h2>
        <p className="text-gray-600 mt-2">Buy and sell lottery tickets from other players</p>
      </div>

      {activeListings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🏪</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No active listings</h3>
          <p className="text-gray-600">There are no tickets available for sale at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {activeListings.map(listing => {
            const ownListing = isOwnListing(listing);
            
            return (
              <div
                key={listing.listingId}
                className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{listing.lotteryName}</h3>
                      <p className="text-gray-600 text-sm">Option: {listing.optionName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                        For Sale
                      </span>
                      {ownListing && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                          Your Listing
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Original Value:</span>
                      <span className="font-medium">{parseFloat(listing.ticketAmount).toLocaleString()} LTP</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Asking Price:</span>
                      <span className="font-semibold text-green-600">
                        {parseFloat(listing.price).toLocaleString()} LTP
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Seller:</span>
                      <span className="font-mono text-xs">
                        {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Listed:</span>
                      <span>{new Date(listing.listingTime * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedListing(listing)}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded font-medium transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleBuyListing(listing.listingId)}
                      disabled={!canAfford(listing.price) || purchasing === listing.listingId || ownListing}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-2 rounded font-medium transition-colors flex items-center justify-center"
                    >
                      {purchasing === listing.listingId ? (
                        <Loading size="sm" text="" />
                      ) : ownListing ? (
                        'Your Listing'
                      ) : (
                        'Buy Now'
                      )}
                    </button>
                  </div>

                  {!canAfford(listing.price) && !ownListing && (
                    <p className="text-red-600 text-xs mt-2 text-center">
                      Need {parseFloat(listing.price)} LTP
                    </p>
                  )}
                  
                  {ownListing && (
                    <p className="text-blue-600 text-xs mt-2 text-center">
                      This is your own listing
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Listing Detail Modal */}
      {selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Ticket Details</h3>
                <button
                  onClick={() => setSelectedListing(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Lottery</label>
                  <p className="font-medium">{selectedListing.lotteryName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Option</label>
                  <p className="font-medium">{selectedListing.optionName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Original Value</label>
                  <p className="font-medium">{parseFloat(selectedListing.ticketAmount).toLocaleString()} LTP</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Asking Price</label>
                  <p className="font-semibold text-green-600 text-lg">
                    {parseFloat(selectedListing.price).toLocaleString()} LTP
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Seller</label>
                  <p className="font-mono text-sm">{selectedListing.seller}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Listed On</label>
                  <p>{new Date(selectedListing.listingTime * 1000).toLocaleString()}</p>
                </div>
                
                {isOwnListing(selectedListing) && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-blue-700 text-sm text-center">
                      This is your own listing. You cannot buy it.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setSelectedListing(null)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (!isOwnListing(selectedListing)) {
                      handleBuyListing(selectedListing.listingId);
                      setSelectedListing(null);
                    }
                  }}
                  disabled={!canAfford(selectedListing.price) || purchasing === selectedListing.listingId || isOwnListing(selectedListing)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-2 rounded font-medium transition-colors"
                >
                  {purchasing === selectedListing.listingId ? 'Buying...' : 
                   isOwnListing(selectedListing) ? 'Your Listing' : 'Buy Ticket'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};