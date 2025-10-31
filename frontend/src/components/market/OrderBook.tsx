// src/components/market/OrderBook.tsx
import React, { useState, useEffect } from 'react';
import { useLottery } from '../../hooks/useLottery';
import { usePoints } from '../../hooks/usePoints';
import { OrderBookLevel } from '../../types';
import { Loading } from '../common/Loading';

interface OrderBookProps {
  lotteryId: number;
  optionId: number;
  lotteryName: string;
  optionName: string;
}

export const OrderBook: React.FC<OrderBookProps> = ({ 
  lotteryId, 
  optionId, 
  lotteryName, 
  optionName 
}) => {
  const { buyAtBestPrice } = useLottery();
  const { pointsBalance } = usePoints();
  const [orderBook, setOrderBook] = useState<{ bids: OrderBookLevel[], asks: OrderBookLevel[] }>({
    bids: [],
    asks: []
  });
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  // 模拟获取订单簿数据 - 实际应该从合约获取
  const fetchOrderBook = async () => {
    try {
      setLoading(true);
      // 这里应该是实际的合约调用
      // const [prices, quantities] = await lotteryContract.getOrderBook(lotteryId, optionId);
      
      // 模拟数据
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockBids: OrderBookLevel[] = [
        { price: '15.5', quantity: 3 },
        { price: '15.0', quantity: 5 },
        { price: '14.5', quantity: 2 },
        { price: '14.0', quantity: 4 },
        { price: '13.5', quantity: 1 }
      ];

      const mockAsks: OrderBookLevel[] = [
        { price: '16.0', quantity: 2 },
        { price: '16.5', quantity: 3 },
        { price: '17.0', quantity: 1 },
        { price: '17.5', quantity: 4 },
        { price: '18.0', quantity: 2 }
      ];

      setOrderBook({
        bids: mockBids.sort((a, b) => parseFloat(b.price) - parseFloat(a.price)),
        asks: mockAsks.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
      });
    } catch (error) {
      console.error('Failed to fetch order book:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyAtBestPrice = async () => {
    if (orderBook.asks.length === 0) return;
    
    try {
      setPurchasing(true);
      await buyAtBestPrice(lotteryId, optionId);
      // 刷新订单簿数据
      await fetchOrderBook();
    } catch (error) {
      console.error('Failed to buy at best price:', error);
    } finally {
      setPurchasing(false);
    }
  };

  const bestBid = orderBook.bids[0];
  const bestAsk = orderBook.asks[0];
  const spread = bestBid && bestAsk ? parseFloat(bestAsk.price) - parseFloat(bestBid.price) : 0;

  const canAffordBestAsk = bestAsk ? parseFloat(pointsBalance) >= parseFloat(bestAsk.price) : false;

  useEffect(() => {
    fetchOrderBook();
    
    // 设置轮询更新订单簿
    const interval = setInterval(fetchOrderBook, 10000); // 每10秒更新一次
    return () => clearInterval(interval);
  }, [lotteryId, optionId]);

  const OrderBookTable: React.FC<{ levels: OrderBookLevel[], type: 'bid' | 'ask' }> = ({ 
    levels, 
    type 
  }) => (
    <div className="flex-1">
      <h4 className="font-semibold text-gray-700 mb-2 text-sm uppercase">
        {type === 'bid' ? 'Bids (Buy)' : 'Asks (Sell)'}
      </h4>
      <div className="space-y-1">
        {levels.map((level, index) => (
          <div
            key={index}
            className={`flex justify-between text-sm p-1 rounded ${
              type === 'bid' 
                ? 'bg-green-50 hover:bg-green-100' 
                : 'bg-red-50 hover:bg-red-100'
            }`}
          >
            <span className={
              type === 'bid' ? 'text-green-700 font-medium' : 'text-red-700 font-medium'
            }>
              {parseFloat(level.price).toLocaleString()} LTP
            </span>
            <span className="text-gray-600">{level.quantity}</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <Loading text="Loading order book..." />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Order Book</h3>
            <p className="text-gray-600 text-sm">
              {lotteryName} - {optionName}
            </p>
          </div>
          <button
            onClick={fetchOrderBook}
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Market Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {bestBid ? parseFloat(bestBid.price).toLocaleString() : '--'} LTP
            </div>
            <div className="text-gray-600 text-sm">Best Bid</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {bestAsk ? parseFloat(bestAsk.price).toLocaleString() : '--'} LTP
            </div>
            <div className="text-gray-600 text-sm">Best Ask</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {spread.toFixed(2)} LTP
            </div>
            <div className="text-gray-600 text-sm">Spread</div>
          </div>
        </div>

        {/* Quick Action */}
        {bestAsk && (
          <div className="mb-6">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <div className="font-semibold text-blue-900">Quick Buy</div>
                <div className="text-blue-700 text-sm">
                  Best available price: {parseFloat(bestAsk.price).toLocaleString()} LTP
                </div>
              </div>
              <button
                onClick={handleBuyAtBestPrice}
                disabled={!canAffordBestAsk || purchasing}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                {purchasing ? (
                  <Loading size="sm" text="" />
                ) : (
                  `Buy at ${parseFloat(bestAsk.price).toLocaleString()} LTP`
                )}
              </button>
            </div>
            {!canAffordBestAsk && (
              <p className="text-red-600 text-sm mt-2 text-center">
                Need {parseFloat(bestAsk.price)} LTP for this purchase
              </p>
            )}
          </div>
        )}
      </div>

      {/* Order Book Tables */}
      <div className="p-6">
        <div className="flex gap-6">
          <OrderBookTable levels={orderBook.bids} type="bid" />
          <div className="w-px bg-gray-200"></div>
          <OrderBookTable levels={orderBook.asks} type="ask" />
        </div>

        {/* Order Book Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-2">How Order Book Works</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Bids</strong>: Prices buyers are willing to pay (sorted highest to lowest)</li>
            <li>• <strong>Asks</strong>: Prices sellers are asking for (sorted lowest to highest)</li>
            <li>• <strong>Spread</strong>: Difference between best bid and best ask</li>
            <li>• Orders are matched when bid price ≥ ask price</li>
          </ul>
        </div>
      </div>
    </div>
  );
};