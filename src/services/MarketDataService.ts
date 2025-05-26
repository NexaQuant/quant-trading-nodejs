import WebSocketClient from '@/core/WebSocketClient';
import logger from '@/utils/logger';
import { IMarketData, ITradeData, IDepthData } from '@/types/marketData'; // Assuming types are defined

class MarketDataService {
  private wsClient: WebSocketClient;
  private currentSubscriptions: Set<string> = new Set();

  constructor(wsClient: WebSocketClient) {
    this.wsClient = wsClient;
    // Potentially re-subscribe to streams if WebSocket reconnects
    // This needs to be handled carefully, perhaps via events from WebSocketClient
  }

  // Example: Subscribe to trade stream for a symbol
  public subscribeToTrades(symbol: string): void {
    const streamName = `${symbol.toLowerCase()}@trade`;
    if (this.currentSubscriptions.has(streamName)) {
      logger.info(`Already subscribed to ${streamName}`);
      return;
    }
    this.wsClient.subscribeToStreams([streamName]);
    this.currentSubscriptions.add(streamName);
    // TODO: Add logic to handle incoming trade data for this subscription
    // e.g., this.wsClient.on('message', (data) => this.handleTradeData(data, symbol));
  }

  public unsubscribeFromTrades(symbol: string): void {
    const streamName = `${symbol.toLowerCase()}@trade`;
    if (this.currentSubscriptions.has(streamName)) {
      this.wsClient.unsubscribeFromStreams([streamName]);
      this.currentSubscriptions.delete(streamName);
      logger.info(`Unsubscribed from ${streamName}`);
    } else {
      logger.info(`Not currently subscribed to ${streamName}`);
    }
  }

  // Example: Subscribe to depth stream for a symbol
  public subscribeToDepth(symbol: string, level: 5 | 10 | 20 = 5): void {
    const streamName = `${symbol.toLowerCase()}@depth${level}`; // e.g., btcusdt@depth5
    if (this.currentSubscriptions.has(streamName)) {
      logger.info(`Already subscribed to ${streamName}`);
      return;
    }
    this.wsClient.subscribeToStreams([streamName]);
    this.currentSubscriptions.add(streamName);
    // TODO: Add logic to handle incoming depth data
  }

  public unsubscribeFromDepth(symbol: string, level: 5 | 10 | 20 = 5): void {
    const streamName = `${symbol.toLowerCase()}@depth${level}`;
    if (this.currentSubscriptions.has(streamName)) {
      this.wsClient.unsubscribeFromStreams([streamName]);
      this.currentSubscriptions.delete(streamName);
      logger.info(`Unsubscribed from ${streamName}`);
    } else {
      logger.info(`Not currently subscribed to ${streamName}`);
    }
  }

  // Placeholder for handling trade data
  public handleTradeData(rawData: string, symbol: string): void {
    try {
      const parsedData = JSON.parse(rawData);
      if (parsedData.stream === `${symbol.toLowerCase()}@trade`) {
        const trade: ITradeData = {
          eventType: parsedData.e,
          eventTime: new Date(parsedData.E),
          symbol: parsedData.s,
          tradeId: parsedData.t,
          price: parseFloat(parsedData.p),
          quantity: parseFloat(parsedData.q),
          buyerOrderId: parsedData.b,
          sellerOrderId: parsedData.a,
          tradeTime: new Date(parsedData.T),
          isMarketMaker: parsedData.m,
        };
        logger.info(`Trade for ${symbol}: P=${trade.price}, Q=${trade.quantity}`);
        // TODO: Emit event or pass data to strategy/handler
      }
    } catch (error) {
      logger.error('Error parsing trade data:', error);
    }
  }

  // Placeholder for handling depth data
  public handleDepthData(rawData: string, symbol: string): void {
    try {
      const parsedData = JSON.parse(rawData);
      // Example stream name: btcusdt@depth5
      if (parsedData.stream && parsedData.stream.startsWith(`${symbol.toLowerCase()}@depth`)) {
        const depth: IDepthData = {
          eventType: 'depthUpdate', // Binance uses 'depthUpdate' for partial book depth streams
          eventTime: new Date(parsedData.E),
          symbol: parsedData.s,
          firstUpdateId: parsedData.U, // First update ID in event
          finalUpdateId: parsedData.u, // Final update ID in event
          bids: parsedData.b.map((bid: [string, string]) => [parseFloat(bid[0]), parseFloat(bid[1])]),
          asks: parsedData.a.map((ask: [string, string]) => [parseFloat(ask[0]), parseFloat(ask[1])]),
        };
        logger.info(`Depth for ${symbol}: Bids[0]=${depth.bids[0]?.[0]}, Asks[0]=${depth.asks[0]?.[0]}`);
        // TODO: Emit event or pass data to strategy/handler
      }
    } catch (error) {
      logger.error('Error parsing depth data:', error);
    }
  }

  // TODO: Add methods for other market data streams (kline, ticker, etc.)
}

export default MarketDataService;