// src/components/market/MyTickets.tsx
import React, { useState, useEffect } from 'react';
import { useLottery } from '../../hooks/useLottery';
import { Ticket, TicketStatus } from '../../types';
import { TICKET_STATUS_MAP } from '../../utils/constants';
import { Loading } from '../common/Loading';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../../utils/constants';
import { useWeb3 } from '../../hooks/useWeb3';

// 辅助函数：安全地比较状态（处理 BigInt）
const compareStatus = (status1: any, status2: TicketStatus): boolean => {
  return Number(status1) === Number(status2);
};

export const MyTickets: React.FC = () => {
  const { myTickets, listTicket, loading } = useLottery();
  const { account, isConnected } = useWeb3();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [sellPrice, setSellPrice] = useState('');
  const [listing, setListing] = useState<number | null>(null);
  const [authorizing, setAuthorizing] = useState<number | null>(null);
  const [filter, setFilter] = useState<TicketStatus | 'all'>('all');
  const [nftApprovals, setNftApprovals] = useState<{[key: number]: boolean}>({});

  // 检查NFT授权状态
  const checkNFTApproval = async (tokenId: number) => {
    try {
      const { ethereum } = window as any;
      if (!ethereum || !account) return false;
      
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      
      const tokenContract = new ethers.Contract(CONTRACT_ADDRESSES.token, [
        "function getApproved(uint256) view returns (address)",
        "function isApprovedForAll(address, address) view returns (bool)"
      ], signer);
      
      const approvedAddress = await tokenContract.getApproved(tokenId);
      const isApprovedForAll = await tokenContract.isApprovedForAll(account, CONTRACT_ADDRESSES.lottery);
      
      const isApproved = approvedAddress.toLowerCase() === CONTRACT_ADDRESSES.lottery.toLowerCase() || isApprovedForAll;
      
      setNftApprovals(prev => ({ ...prev, [tokenId]: isApproved }));
      console.log(`NFT ${tokenId} approval status:`, { 
        approvedAddress, 
        lotteryAddress: CONTRACT_ADDRESSES.lottery,
        isApprovedForAll,
        isApproved 
      });
      return isApproved;
    } catch (error) {
      console.error('Failed to check NFT approval:', error);
      return false;
    }
  };

  // 在组件加载时检查所有票券的授权状态
  useEffect(() => {
    if (myTickets.length > 0 && account) {
      console.log('Checking NFT approvals for tickets:', myTickets);
      myTickets.forEach(ticket => {
        if (compareStatus(ticket.status, TicketStatus.Ready)) {
          checkNFTApproval(ticket.tokenId);
        }
      });
    }
  }, [myTickets, account]);

  // === NFT 授权函数 ===
  const authorizeNFT = async (tokenId: number) => {
    try {
      setAuthorizing(tokenId);
      const { ethereum } = window as any;
      
      if (!ethereum) {
        throw new Error('MetaMask not installed');
      }
      
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      
      const tokenContract = new ethers.Contract(CONTRACT_ADDRESSES.token, [
        "function approve(address, uint256) returns (bool)",
        "function getApproved(uint256) view returns (address)"
      ], signer);
      
      // 检查当前授权状态
      const currentApproval = await tokenContract.getApproved(tokenId);
      console.log('Current approval for token', tokenId, ':', currentApproval);
      
      if (currentApproval.toLowerCase() === CONTRACT_ADDRESSES.lottery.toLowerCase()) {
        console.log('NFT already authorized');
        setNftApprovals(prev => ({ ...prev, [tokenId]: true }));
        return;
      }
      
      // 执行授权
      const tx = await tokenContract.approve(CONTRACT_ADDRESSES.lottery, tokenId);
      console.log('Authorization transaction sent:', tx.hash);
      await tx.wait();
      console.log('NFT authorized successfully');
      
      // 验证授权
      const newApproval = await tokenContract.getApproved(tokenId);
      console.log('New approval:', newApproval);
      
      setNftApprovals(prev => ({ ...prev, [tokenId]: true }));
      
    } catch (error: any) {
      console.error('Failed to authorize NFT:', error);
      throw new Error(error.reason || 'Failed to authorize NFT');
    } finally {
      setAuthorizing(null);
    }
  };

  // 修复过滤逻辑 - 使用安全的比较函数
  const filteredTickets = myTickets.filter(ticket => {
    if (filter === 'all') return true;
    return compareStatus(ticket.status, filter);
  });

  // 计算各状态的数量 - 使用安全的比较函数
  const getStatusCount = (status: TicketStatus | 'all') => {
    if (status === 'all') return myTickets.length;
    return myTickets.filter(ticket => compareStatus(ticket.status, status)).length;
  };

  // 调试信息
  useEffect(() => {
    console.log('=== MyTickets Debug Info ===');
    console.log('All tickets:', myTickets);
    console.log('Filter:', filter, TICKET_STATUS_MAP[filter as keyof typeof TICKET_STATUS_MAP]);
    console.log('Filtered tickets:', filteredTickets);
    console.log('Ticket status breakdown:', myTickets.map(t => ({ 
      id: t.tokenId, 
      status: t.status, 
      statusType: typeof t.status,
      statusValue: Number(t.status),
      statusText: TICKET_STATUS_MAP[Number(t.status) as keyof typeof TICKET_STATUS_MAP],
      lottery: t.lotteryName,
      option: t.optionName
    })));
    console.log('Status counts:', {
      all: getStatusCount('all'),
      ready: getStatusCount(TicketStatus.Ready),
      onSale: getStatusCount(TicketStatus.OnSale),
      winning: getStatusCount(TicketStatus.Winning),
      losing: getStatusCount(TicketStatus.Losing)
    });
    console.log('NFT Approvals:', nftApprovals);
    console.log('============================');
  }, [myTickets, filter, filteredTickets, nftApprovals]);

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

  const getStatusColor = (status: any) => {
    const statusNum = Number(status);
    switch (statusNum) {
      case TicketStatus.Ready: return 'bg-green-100 text-green-800';
      case TicketStatus.OnSale: return 'bg-blue-100 text-blue-800';
      case TicketStatus.Winning: return 'bg-yellow-100 text-yellow-800';
      case TicketStatus.Losing: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: any) => {
    return TICKET_STATUS_MAP[Number(status) as keyof typeof TICKET_STATUS_MAP];
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
        
        {/* 授权说明 - 只在有Ready票券且未授权时显示 */}
        {myTickets.some(ticket => 
          compareStatus(ticket.status, TicketStatus.Ready) && 
          !nftApprovals[ticket.tokenId]
        ) && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  NFT Authorization Required
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    To sell your tickets on the market, you need to authorize the contract to transfer your NFT.
                    Click "Authorize NFT" before listing for sale.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
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
          All Tickets ({getStatusCount('all')})
        </button>
        {Object.entries(TICKET_STATUS_MAP).map(([status, label]) => {
          const statusNum = Number(status) as TicketStatus;
          return (
            <button
              key={status}
              onClick={() => setFilter(statusNum)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                compareStatus(filter, statusNum)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {label} ({getStatusCount(statusNum)})
            </button>
          );
        })}
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
                    {getStatusText(ticket.status)}
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

                {compareStatus(ticket.status, TicketStatus.Ready) && (
                  <div className="space-y-2">
                    {/* 只在未授权时显示授权按钮 */}
                    {!nftApprovals[ticket.tokenId] && (
                      <button
                        onClick={() => authorizeNFT(ticket.tokenId)}
                        disabled={authorizing === ticket.tokenId}
                        className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white py-2 rounded font-medium transition-colors flex items-center justify-center"
                      >
                        {authorizing === ticket.tokenId ? (
                          <Loading size="sm" text="" />
                        ) : (
                          'Authorize NFT'
                        )}
                      </button>
                    )}
                    
                    {/* 授权状态提示 */}
                    {nftApprovals[ticket.tokenId] ? (
                      <div className="bg-green-50 border border-green-200 rounded p-2 text-center">
                        <p className="text-green-700 text-sm">✓ NFT Authorized</p>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                        <p className="text-yellow-700 text-sm text-center">
                          Authorize NFT to sell
                        </p>
                      </div>
                    )}
                    
                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      disabled={!nftApprovals[ticket.tokenId]}
                      className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-2 rounded font-medium transition-colors"
                    >
                      Sell Ticket
                    </button>
                  </div>
                )}

                {compareStatus(ticket.status, TicketStatus.OnSale) && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Currently listed for sale</p>
                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      className="mt-2 text-blue-500 hover:text-blue-600 text-sm"
                    >
                      View Details
                    </button>
                  </div>
                )}

                {compareStatus(ticket.status, TicketStatus.Winning) && (
                  <div className="text-center">
                    <p className="text-sm text-green-600 font-semibold">🎉 Winning Ticket!</p>
                    <p className="text-xs text-gray-600 mt-1">Congratulations!</p>
                  </div>
                )}

                {compareStatus(ticket.status, TicketStatus.Losing) && (
                  <div className="text-center">
                    <p className="text-sm text-red-600">Losing Ticket</p>
                    <p className="text-xs text-gray-600 mt-1">Better luck next time!</p>
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

                {/* 授权状态检查 */}
                <div className={`rounded p-3 ${
                  nftApprovals[selectedTicket.tokenId] 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-center">
                    {nftApprovals[selectedTicket.tokenId] ? (
                      <>
                        <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-green-700">
                          NFT is authorized and ready for sale
                        </span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-yellow-700">
                          Please authorize NFT before listing
                        </span>
                      </>
                    )}
                  </div>
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
                    disabled={!sellPrice || parseFloat(sellPrice) <= 0 || listing === selectedTicket.tokenId || !nftApprovals[selectedTicket.tokenId]}
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