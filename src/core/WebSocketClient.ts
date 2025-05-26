import WebSocket from 'ws';
import logger from '@/utils/logger';
import { config } from '@/config';

class WebSocketClient {
  private ws: WebSocket | null = null;
  private readonly url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10; // Max 10 reconnect attempts
  private reconnectInterval = 5000; // 5 seconds
  private pingIntervalId: NodeJS.Timeout | null = null;
  private pingTimeout = 30000; // 30 seconds for ping
  private connectionTimeoutId: NodeJS.Timeout | null = null;

  constructor(url: string = config.WS_BASE_URL) {
    this.url = url;
  }

  public connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      logger.info('WebSocket already connected.');
      return;
    }

    logger.info(`Attempting to connect to WebSocket: ${this.url}`);
    this.ws = new WebSocket(this.url);

    this.ws.on('open', () => {
      logger.info('WebSocket connection established.');
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      this.startPing();
      // TODO: Implement subscription logic here
      // Example: this.subscribeToStreams(['btcusdt@depth']);
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      // TODO: Implement message handling logic
      logger.debug(`Received WebSocket message: ${data.toString()}`);
      this.resetConnectionTimeout(); // Reset connection timeout on receiving any message
    });

    this.ws.on('ping', () => {
      logger.debug('Received ping, sending pong.');
      this.ws?.pong();
      this.resetConnectionTimeout();
    });

    this.ws.on('pong', () => {
      logger.debug('Received pong.');
      this.resetConnectionTimeout();
    });

    this.ws.on('error', (error: Error) => {
      logger.error('WebSocket error:', error);
      // Errors might not always lead to a close event, so we might need to handle reconnection here too
      // or ensure the 'close' event is always triggered.
    });

    this.ws.on('close', (code: number, reason: Buffer) => {
      logger.warn(`WebSocket connection closed. Code: ${code}, Reason: ${reason.toString()}`);
      this.stopPing();
      this.clearConnectionTimeout();
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = Math.min(this.reconnectInterval * Math.pow(2, this.reconnectAttempts -1), 60000); // Exponential backoff, max 1 minute
        logger.info(`Attempting to reconnect in ${delay / 1000} seconds... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        setTimeout(() => this.connect(), delay);
      } else {
        logger.error('Max reconnect attempts reached. Will not reconnect.');
        // TODO: Notify application about permanent disconnection
      }
    });

    this.resetConnectionTimeout(); // Start connection timeout check
  }

  private startPing(): void {
    this.stopPing(); // Clear any existing ping interval
    this.pingIntervalId = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        logger.debug('Sending ping.');
        this.ws.ping();
        this.resetConnectionTimeout(); // Expect a pong or message soon
      }
    }, this.pingTimeout / 2); // Send ping more frequently than timeout
  }

  private stopPing(): void {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
      logger.info('Stopped WebSocket ping interval.');
    }
  }

  private resetConnectionTimeout(): void {
    this.clearConnectionTimeout();
    this.connectionTimeoutId = setTimeout(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        logger.warn('WebSocket connection timeout. No message/pong received. Terminating connection.');
        this.ws.terminate(); // Force close if no activity
      }
    }, this.pingTimeout + 5000); // Allow some grace period over pingTimeout
     logger.debug('WebSocket connection timeout reset.');
  }

  private clearConnectionTimeout(): void {
    if (this.connectionTimeoutId) {
      clearTimeout(this.connectionTimeoutId);
      this.connectionTimeoutId = null;
    }
  }

  public subscribeToStreams(streams: string[]): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        method: 'SUBSCRIBE',
        params: streams,
        id: Date.now(), // Unique ID for the request
      };
      this.ws.send(JSON.stringify(message));
      logger.info(`Subscribed to streams: ${streams.join(', ')}`);
    } else {
      logger.warn('WebSocket not connected. Cannot subscribe to streams.');
    }
  }

  public unsubscribeFromStreams(streams: string[]): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        method: 'UNSUBSCRIBE',
        params: streams,
        id: Date.now(),
      };
      this.ws.send(JSON.stringify(message));
      logger.info(`Unsubscribed from streams: ${streams.join(', ')}`);
    } else {
      logger.warn('WebSocket not connected. Cannot unsubscribe from streams.');
    }
  }

  public close(): void {
    if (this.ws) {
      logger.info('Closing WebSocket connection.');
      this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection on manual close
      this.ws.close();
    }
  }
}

export default WebSocketClient;