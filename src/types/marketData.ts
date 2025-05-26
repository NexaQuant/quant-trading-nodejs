// General Market Data Interface (can be extended)
export interface IMarketData {
  eventType: string;    // e.g., 'trade', 'depthUpdate', 'kline'
  eventTime: Date;      // Event time
  symbol: string;       // Symbol
}

// Trade Stream Data
export interface ITradeData extends IMarketData {
  eventType: 'trade';
  tradeId: number;      // Trade ID
  price: number;        // Price
  quantity: number;     // Quantity
  buyerOrderId: number; // Buyer order ID
  sellerOrderId: number;// Seller order ID
  tradeTime: Date;      // Trade time
  isMarketMaker: boolean; // Is the buyer the market maker?
  // ignore?: boolean;      // Ignore
}

// Depth Stream Data (Partial Book Depth)
export interface IDepthData extends IMarketData {
  eventType: 'depthUpdate';
  firstUpdateId?: number; // First update ID in event (for future use with order book synchronization)
  finalUpdateId: number;   // Final update ID in event
  bids: [number, number][]; // Bids to be updated [[price, quantity]]
  asks: [number, number][]; // Asks to be updated [[price, quantity]]
}

// Kline/Candlestick Stream Data
export interface IKlineData extends IMarketData {
  eventType: 'kline';
  klineStartTime: Date; // Kline start time
  klineCloseTime: Date; // Kline close time
  interval: string;     // Interval
  firstTradeId: number; // First trade ID
  lastTradeId: number;  // Last trade ID
  openPrice: number;    // Open price
  closePrice: number;   // Close price
  highPrice: number;    // High price
  lowPrice: number;     // Low price
  baseAssetVolume: number; // Base asset volume
  numberOfTrades: number;  // Number of trades
  isKlineClosed: boolean;  // Is this kline closed?
  quoteAssetVolume: number;// Quote asset volume
  takerBuyBaseAssetVolume: number; // Taker buy base asset volume
  takerBuyQuoteAssetVolume: number;// Taker buy quote asset volume
  // ignore: any; // Ignore
}

// Individual Ticker Stream Data
export interface ITickerData extends IMarketData {
  eventType: '24hrTicker'; // Event type for individual symbol ticker
  priceChange: number;          // Price change
  priceChangePercent: number;   // Price change percent
  weightedAvgPrice: number;     // Weighted average price
  prevDayClosePrice: number;    // Previous day's close price
  currentDayClosePrice: number; // Current day's close price
  closeTradeQuantity: number;   // Close trade's quantity
  bestBidPrice: number;         // Best bid price
  bestBidQuantity: number;      // Best bid quantity
  bestAskPrice: number;         // Best ask price
  bestAskQuantity: number;      // Best ask quantity
  openPrice: number;            // Open price
  highPrice: number;            // High price
  lowPrice: number;             // Low price
  totalTradedBaseAssetVolume: number; // Total traded base asset volume
  totalTradedQuoteAssetVolume: number;// Total traded quote asset volume
  statisticsOpenTime: Date;     // Statistics open time
  statisticsCloseTime: Date;    // Statistics close time
  firstTradeId: number;         // First trade ID
  lastTradeId: number;          // Last trade ID
  totalNumberOfTrades: number;  // Total number of trades
}

// All Market Tickers Stream Data (Array of ITickerData for multiple symbols)
export interface IAllMarketTickersData extends IMarketData {
  eventType: '!ticker@arr'; // Special event type for all market tickers
  tickers: ITickerData[];
}

// Add other necessary type definitions for API responses, order types, etc.
export interface IOrder {
  symbol: string;
  orderId: number;
  orderListId: number; // Unless OCO, value will be -1
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: string; // e.g., NEW, PARTIALLY_FILLED, FILLED, CANCELED, PENDING_CANCEL (currently unused), REJECTED, EXPIRED
  timeInForce: string; // e.g., GTC, IOC, FOK
  type: string; // e.g., LIMIT, MARKET, STOP_LOSS, STOP_LOSS_LIMIT, TAKE_PROFIT, TAKE_PROFIT_LIMIT, LIMIT_MAKER
  side: string; // BUY, SELL
  stopPrice?: string;
  icebergQty?: string;
  time: number; // Order time
  updateTime: number; // Last update time
  isWorking: boolean;
  origQuoteOrderQty?: string; // Original quote order quantity
}