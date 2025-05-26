import WebSocketClient from '../src/core/WebSocketClient';
import logger from '../src/utils/logger';
import { config as appConfig } from '../src/config';

const TOTAL_CONNECTIONS = 100;

// 确保交易对列表是有效的，并且符合Binance stream name的格式 (e.g., btcusdt@kline_1m)
// 以下列表仅为示例，实际测试时应使用有效的、多样化的交易对
const tradingPairsSeed = [
  "btcusdt", "ethusdt", "bnbusdt", "solusdt", "xrpusdt",
  "adausdt", "dogeusdt", "avaxusdt", "dotusdt", "maticusdt",
  "shibusdt", "ltcusdt", "trxusdt", "linkusdt", "uniusdt",
  "atomusdt", "xlmusdt", "vetusdt", "icpusdt", "filusdt",
  "etcusdt", "bchusdt", "algousdt", "hbarusdt", "nearusdt",
  "ftmusdt", "sandusdt", "manausdt", "axsusdt", "aaveusdt",
  "grtusdt", "eosusdt", "xtzusdt", "mkrusdt", "zecusdt",
  "dashusdt", "compusdt", "snxusdt", "sushiusdt", "yfiusdt",
  "batusdt", "enjusdt", "crvusdt", "ankrusdt", "chzusdt",
  "omgusdt", "wavesusdt", "qtumusdt", "zilusdt", "ontusdt",
  "kncusdt", "bandusdt", "balusdt", "iotxusdt", "storjusdt",
  "blzusdt", "sklusdt", "rlcusdt", "lrcusdt", "ctxkusdt",
  "ognusdt", "renusdt", "bntusdt", "nmrusdt", "oceanusdt",
  "kavausdt", "oneusdt", "runeusdt", "cvcusdt", "dgbusdt",
  "rvnusdt", "ardrusdt", "cotiusdt", "stxusdt", "iostusdt",
  "celrusdt", "tfuelusdt", "thetausdt", "xrpbullusdt", "ethbullusdt",
  "eosbullusdt", "bnbbullusdt", "ltcbullusdt", "adabullusdt", "linkbullusdt",
  "xlmbullusdt", "eosbearusdt", "xrpbearusdt", "ethbearusdt", "bnbbearusdt",
  "ltcbearusdt", "adabearusdt", "linkbearusdt", "xlmbearusdt", "btcdownusdt",
  "btcupusdt", "ethdownusdt", "ethupusdt", "adadownusdt", "adaupusdt",
  "linkdownusdt", "linkupusdt", "bnbdownusdt", "bnbupusdt"
];

const streams = tradingPairsSeed.slice(0, TOTAL_CONNECTIONS).map(pair => `${pair.toLowerCase()}@kline_1m`);

const clients: WebSocketClient[] = [];
let successfulInitialSubscriptions = 0;
let failedInitialSubscriptions = 0;

async function runStressTest() {
  logger.info(`Starting WebSocket stress test for ${TOTAL_CONNECTIONS} connections...`);
  // 考虑临时调整日志级别以减少输出
  // logger.level = 'info'; 

  for (let i = 0; i < TOTAL_CONNECTIONS; i++) {
    const client = new WebSocketClient(appConfig.WS_BASE_URL);
    clients.push(client);
    const streamToSubscribe = streams[i % streams.length]; // Handle if streams < TOTAL_CONNECTIONS

    try {
      client.connect();
      // 等待连接建立。理想情况下，WebSocketClient应提供连接成功的回调或Promise
      await new Promise(resolve => setTimeout(resolve, 3000 * (1 + Math.random()))); // 随机延迟以错开连接

      // 检查连接状态 (注意：直接访问 'ws' 是不推荐的)
      // @ts-ignore access private member for test
      if (client.ws && client.ws.readyState === WebSocket.OPEN) {
        client.subscribeToStreams([streamToSubscribe]);
        successfulInitialSubscriptions++;
        logger.info(`Client ${i + 1}/${TOTAL_CONNECTIONS}: Subscription initiated for ${streamToSubscribe}.`);
      } else {
        logger.warn(`Client ${i + 1}/${TOTAL_CONNECTIONS}: WebSocket not open for ${streamToSubscribe} after delay.`);
        failedInitialSubscriptions++;
      }
    } catch (error: any) {
      logger.error(`Client ${i + 1}/${TOTAL_CONNECTIONS}: Failed to initiate connection/subscription for ${streamToSubscribe}. Error: ${error.message}`);
      failedInitialSubscriptions++;
    }

    // 避免同时发起大量连接请求，稍微错开一些
    if ((i + 1) % 20 === 0) { // 每20个连接等待1秒
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  logger.info('All connection and subscription attempts initiated.');
  logger.info(`Successful initial subscription attempts: ${successfulInitialSubscriptions}`);
  logger.info(`Failed initial subscription attempts: ${failedInitialSubscriptions}`);

  const testDurationMinutes = 1; // 测试运行1分钟
  const testDuration = testDurationMinutes * 60 * 1000;
  logger.info(`Stress test will run for ${testDurationMinutes} minutes. Monitoring connections...`);

  const monitorInterval = setInterval(() => {
    let openCount = 0;
    clients.forEach(c => {
      // @ts-ignore access private member for test
      if (c.ws && c.ws.readyState === WebSocket.OPEN) {
        openCount++;
      }
    });
    logger.info(`Current open connections: ${openCount}/${TOTAL_CONNECTIONS}`);
  }, 30000); // 每30秒检查一次

  setTimeout(() => {
    clearInterval(monitorInterval);
    logger.info('Stress test duration finished. Closing all connections...');
    clients.forEach((client, index) => {
      try {
        client.close();
        logger.info(`Client ${index + 1}: Close command sent.`);
      } catch (error: any) {
        logger.error(`Client ${index + 1}: Error closing connection: ${error.message}`);
      }
    });
    logger.info('All WebSocket connections closed. Stress test complete.');
    process.exit(0);
  }, testDuration);

  function handleExit(signal: string) {
    logger.info(`Received ${signal}. Closing connections...`);
    clearInterval(monitorInterval); // Ensure monitor is stopped
    clients.forEach(client => client.close());
    logger.info('Exiting stress test script.');
    process.exit(0);
  }

  process.on('SIGINT', () => handleExit('SIGINT'));
  process.on('SIGTERM', () => handleExit('SIGTERM'));
}

runStressTest().catch(error => {
  logger.error('Unhandled error in stress test:', error);
  process.exit(1);
});