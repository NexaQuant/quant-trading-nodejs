import axios from 'axios';
import ApiClient from './ApiClient';
import { config } from '@/config'; // Assuming config is correctly set up for tests
import crypto from 'crypto'; // Import crypto for mocking

// Mock axios module
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock crypto module
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'), // Keep original crypto for other uses if any
  createHmac: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mockedSignatureString'),
  })),
}));

// Mock logger to prevent actual logging during tests
jest.mock('@/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    // Reset all mocks before each test
    mockedAxios.create.mockClear();
    mockedAxios.get.mockClear();
    mockedAxios.post.mockClear();

    // Mock the axios.create() call to return a mocked instance
    const mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    } as any; // Type assertion to satisfy AxiosInstance structure for mocking
    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    apiClient = new ApiClient();
  });

  describe('Constructor', () => {
    it('should create an axios instance with correct baseURL and headers', () => {
      expect(mockedAxios.create).toHaveBeenCalledTimes(1);
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: config.API_BASE_URL,
        headers: {
          'Content-Type': 'application/json',
          'X-MBX-APIKEY': config.BINANCE_API_KEY,
        },
      });
    });

    it('should attach request and response interceptors', () => {
      const mockAxiosInstance = mockedAxios.create.mock.results[0].value;
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalledTimes(1);
    });
  });

  describe('getServerTime', () => {
    it('should call client.get with /api/v3/time', async () => {
      const mockResponseData = { serverTime: Date.now() };
      const mockAxiosInstance = mockedAxios.create.mock.results[0].value;
      mockAxiosInstance.get.mockResolvedValue({ data: mockResponseData }); // Mock axios.get to resolve with data

      const result = await apiClient.getServerTime();

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v3/time');
      expect(result).toEqual(mockResponseData); // Interceptor returns response.data
    });

    it('should handle API errors for getServerTime', async () => {
      const mockError = { response: { status: 500, data: { msg: 'Internal Server Error' } } };
      const mockAxiosInstance = mockedAxios.create.mock.results[0].value;
      // The response interceptor handles the error and Promise.rejects it.
      // We need to ensure the mockAxiosInstance.get call itself leads to the interceptor's error path.
      // The interceptor itself is part of ApiClient's setup, so we test the outcome.
      mockAxiosInstance.get.mockRejectedValue(mockError);

      await expect(apiClient.getServerTime()).rejects.toEqual(mockError);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v3/time');
    });
  });

  describe('getExchangeInfo', () => {
    it('should call client.get with /api/v3/exchangeInfo', async () => {
      const mockResponseData = { timezone: 'UTC', serverTime: Date.now(), symbols: [] };
      const mockAxiosInstance = mockedAxios.create.mock.results[0].value;
      mockAxiosInstance.get.mockResolvedValue({ data: mockResponseData });

      const result = await apiClient.getExchangeInfo();

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v3/exchangeInfo');
      expect(result).toEqual(mockResponseData);
    });

    it('should handle API errors for getExchangeInfo', async () => {
      const mockError = { response: { status: 503, data: { msg: 'Service Unavailable' } } };
      const mockAxiosInstance = mockedAxios.create.mock.results[0].value;
      mockAxiosInstance.get.mockRejectedValue(mockError);

      await expect(apiClient.getExchangeInfo()).rejects.toEqual(mockError);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v3/exchangeInfo');
    });
  });

  describe('getAccountInfo', () => {
    const mockAccountInfo = { makerCommission: 10, takerCommission: 10, balances: [] };
    let mockAxiosInstance: any;

    beforeEach(() => {
      mockAxiosInstance = mockedAxios.create.mock.results[0].value;
      mockAxiosInstance.get.mockResolvedValue({ data: mockAccountInfo });
      // Mock Date.now() to control timestamp generation for consistent signature testing
      jest.spyOn(Date, 'now').mockReturnValue(1678886400000); // Example: March 15, 2023 12:00:00 PM UTC
    });

    afterEach(() => {
      jest.spyOn(Date, 'now').mockRestore(); // Restore original Date.now()
    });

    it('should call client.get with /api/v3/account and correct signed parameters', async () => {
      const options = { recvWindow: 5000 };
      const expectedTimestamp = 1678886400000;
      // Expected signature depends on BINANCE_API_SECRET and the exact query string
      // For testing, we can spy on generateSignature or pre-calculate if secret is known for test env
      // Here, we'll check if the parameters passed to axios.get are correct, including a signature.

      const result = await apiClient.getAccountInfo(options);

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
      const calledWithParams = mockAxiosInstance.get.mock.calls[0][1].params;
      expect(calledWithParams.recvWindow).toBe(5000);
      expect(calledWithParams.timestamp).toBe(expectedTimestamp);
      expect(calledWithParams.signature).toBeDefined();
      expect(calledWithParams.signature).toEqual(expect.any(String)); // Check if signature is a string
      // A more robust test would involve mocking crypto and verifying the signature generation process
      // or using a known test secret to verify the exact signature value.
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v3/account', {
        params: expect.objectContaining({
          ...options,
          timestamp: expectedTimestamp,
          signature: expect.any(String),
        }),
      });
      expect(result).toEqual(mockAccountInfo);
    });

    it('should call client.get with /api/v3/account and only timestamp and signature if no options provided', async () => {
      const expectedTimestamp = 1678886400000;
      await apiClient.getAccountInfo();

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
      const calledWithParams = mockAxiosInstance.get.mock.calls[0][1].params;
      expect(calledWithParams.timestamp).toBe(expectedTimestamp);
      expect(calledWithParams.signature).toBeDefined();
      expect(calledWithParams.signature).toEqual(expect.any(String));
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v3/account', {
        params: {
          timestamp: expectedTimestamp,
          signature: expect.any(String),
        },
      });
    });

    it('should handle API errors for getAccountInfo', async () => {
      const mockError = { response: { status: 401, data: { msg: 'Unauthorized' } } };
      mockAxiosInstance.get.mockRejectedValue(mockError);

      await expect(apiClient.getAccountInfo()).rejects.toEqual(mockError);
    });
  });

  describe('placeOrder', () => {
    const mockOrderResponse = { symbol: 'BTCUSDT', orderId: 123, status: 'NEW' };
    let mockAxiosInstance: any;
    const orderParams = { symbol: 'BTCUSDT', side: 'BUY', type: 'LIMIT', quantity: 1, price: '30000', timeInForce: 'GTC' };

    beforeEach(() => {
      mockAxiosInstance = mockedAxios.create.mock.results[0].value;
      mockAxiosInstance.post.mockResolvedValue({ data: mockOrderResponse });
      jest.spyOn(Date, 'now').mockReturnValue(1678886400000);
    });

    afterEach(() => {
      jest.spyOn(Date, 'now').mockRestore();
    });

    it('should call client.post with /api/v3/order and orderParams, with signature handled by interceptor', async () => {
      const result = await apiClient.placeOrder(orderParams);

      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
      // The interceptor modifies reqConfig.params, so we check the call to axios.post
      // The actual signature generation is tested in the interceptor tests
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/v3/order', null, {
        params: expect.objectContaining({
          ...orderParams,
          timestamp: 1678886400000,
          signature: expect.any(String), // Signature is added by interceptor
        }),
      });
      expect(result).toEqual(mockOrderResponse);
    });

    it('should handle API errors for placeOrder', async () => {
      const mockError = { response: { status: 400, data: { code: -1102, msg: 'Mandatory parameter type was not sent' } } };
      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(apiClient.placeOrder(orderParams)).rejects.toEqual(mockError);
    });
  });

  describe('Request Interceptor Logic', () => {
    let requestInterceptor: (config: any) => any;
    let mockAxiosInstance: any;

    beforeEach(() => {
      // Re-initialize ApiClient to get a fresh interceptor setup if needed, or access the one from the main setup
      // For simplicity, we assume the interceptor from the main `beforeEach` is what we're testing.
      mockAxiosInstance = mockedAxios.create.mock.results[0].value;
      requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
      jest.spyOn(Date, 'now').mockReturnValue(1678886400000);
    });

    afterEach(() => {
      jest.spyOn(Date, 'now').mockRestore();
    });

    it('should add timestamp and signature for POST requests to /api/v3/order', () => {
      const reqConfig = {
        method: 'POST',
        url: '/api/v3/order',
        params: { symbol: 'BTCUSDT', side: 'BUY' },
      };
      const processedConfig = requestInterceptor(reqConfig);
      expect(processedConfig.params.timestamp).toBe(1678886400000);
      expect(processedConfig.params.signature).toEqual('mockedSignatureString');
      expect(crypto.createHmac).toHaveBeenCalledWith('sha256', config.BINANCE_API_SECRET);
      const expectedQueryString = `symbol=BTCUSDT&side=BUY&timestamp=${1678886400000}`;
      expect(crypto.createHmac().update).toHaveBeenCalledWith(expectedQueryString);
    });

    it('should add timestamp and signature for DELETE requests to /api/v3/order', () => {
      const reqConfig = {
        method: 'DELETE',
        url: '/api/v3/order',
        params: { symbol: 'BTCUSDT', orderId: '123' },
      };
      const processedConfig = requestInterceptor(reqConfig);
      expect(processedConfig.params.timestamp).toBe(1678886400000);
      expect(processedConfig.params.signature).toEqual('mockedSignatureString');
      expect(crypto.createHmac).toHaveBeenCalledWith('sha256', config.BINANCE_API_SECRET);
      const expectedQueryString = `symbol=BTCUSDT&orderId=123&timestamp=${1678886400000}`;
      expect(crypto.createHmac().update).toHaveBeenCalledWith(expectedQueryString);
    });

    it('should NOT add timestamp and signature for GET requests', () => {
      const reqConfig = {
        method: 'GET',
        url: '/api/v3/time',
        params: {},
      };
      const processedConfig = requestInterceptor(reqConfig);
      expect(processedConfig.params.timestamp).toBeUndefined();
      expect(processedConfig.params.signature).toBeUndefined();
    });

    it('should NOT add timestamp and signature for POST requests to other endpoints', () => {
      const reqConfig = {
        method: 'POST',
        url: '/api/v3/userDataStream',
        params: {},
      };
      const processedConfig = requestInterceptor(reqConfig);
      expect(processedConfig.params.timestamp).toBeUndefined();
      expect(processedConfig.params.signature).toBeUndefined();
    });

    it('should initialize params if not present for signed POST /api/v3/order', () => {
      const reqConfig = {
        method: 'POST',
        url: '/api/v3/order',
        // no params initially
      };
      const processedConfig = requestInterceptor(reqConfig);
      expect(processedConfig.params).toBeDefined();
      expect(processedConfig.params.timestamp).toBe(1678886400000);
      expect(processedConfig.params.signature).toEqual('mockedSignatureString');
      expect(crypto.createHmac).toHaveBeenCalledWith('sha256', config.BINANCE_API_SECRET);
      // For this case, params might be empty before timestamp and signature
      const expectedQueryString = `timestamp=${1678886400000}`;
      expect(crypto.createHmac().update).toHaveBeenCalledWith(expectedQueryString);
    });
  });

  // Tests for response interceptor and direct signature generation can be added here.
});