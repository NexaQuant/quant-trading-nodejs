import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import crypto from 'crypto';
import { config } from '@/config';
import logger from '@/utils/logger';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'X-MBX-APIKEY': config.BINANCE_API_KEY,
      },
    });

    this.client.interceptors.request.use((reqConfig) => {
      if (reqConfig.method?.toUpperCase() !== 'GET' && reqConfig.url?.includes('/api/v3/order')) {
         // For signed endpoints, typically POST, DELETE
        if (!reqConfig.params) {
          reqConfig.params = {};
        }
        reqConfig.params.timestamp = Date.now();
        const queryString = this.buildQueryString(reqConfig.params);
        reqConfig.params.signature = this.generateSignature(queryString);
      }
      logger.debug(`Sending API request: ${reqConfig.method?.toUpperCase()} ${reqConfig.url} ${JSON.stringify(reqConfig.params)}`);
      return reqConfig;
    });

    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`Received API response: ${response.status} ${JSON.stringify(response.data)}`);
        return response.data; // Return only data part of the response
      },
      (error: AxiosError) => {
        if (error.response) {
          logger.error(
            `API request failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
          );
          // Handle specific Binance error codes (e.g., 429 for rate limits, 418 for IP ban)
          if (error.response.status === 429) {
            logger.warn('Rate limit exceeded. Consider implementing a retry mechanism with backoff.');
          }
          if (error.response.status === 418) {
            logger.error('IP address has been auto-banned by Binance. Check your request patterns.');
          }
        } else if (error.request) {
          logger.error('API request failed: No response received.', error.request);
        } else {
          logger.error('API request failed: Error setting up request.', error.message);
        }
        return Promise.reject(error);
      },
    );
  }

  private buildQueryString(params: Record<string, any>): string {
    return Object.keys(params)
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
  }

  private generateSignature(data: string): string {
    return crypto
      .createHmac('sha256', config.BINANCE_API_SECRET)
      .update(data)
      .digest('hex');
  }

  // Public methods for API endpoints
  public async getServerTime(): Promise<any> {
    return this.client.get('/api/v3/time');
  }

  public async getExchangeInfo(): Promise<any> {
    return this.client.get('/api/v3/exchangeInfo');
  }

  public async getAccountInfo(options?: Record<string, any>): Promise<any> {
    const params = { ...options, timestamp: Date.now() };
    const queryString = this.buildQueryString(params);
    const signature = this.generateSignature(queryString);
    return this.client.get('/api/v3/account', { params: { ...params, signature } });
  }

  // Example: Place a new order (Signed Endpoint)
  public async placeOrder(orderParams: Record<string, any>): Promise<any> {
    // The signature is handled by the interceptor for POST requests to /api/v3/order
    return this.client.post('/api/v3/order', null, { params: orderParams });
  }

  // Add more methods for other Binance API endpoints as needed
  // e.g., getOrder, cancelOrder, getTrades, etc.
}

export default ApiClient;