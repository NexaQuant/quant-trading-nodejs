// d:\node.js API\src\utils\logger.test.ts
import logger from './logger';

describe('Logger Utility Tests', () => {
  it('logger instance should be defined', () => {
    expect(logger).toBeDefined();
  });

  it('logger should have common logging methods', () => {
    expect(logger.info).toBeInstanceOf(Function);
    expect(logger.warn).toBeInstanceOf(Function);
    expect(logger.error).toBeInstanceOf(Function);
    expect(logger.debug).toBeInstanceOf(Function);
    expect(logger.fatal).toBeInstanceOf(Function);
    expect(logger.trace).toBeInstanceOf(Function);
  });

  // 这是一个更高级的测试，它会实际调用日志方法。
  // 注意：在 CI 环境或不需要实际输出日志的测试中，
  // 可能需要 mock logger.info 等方法以避免产生不必要的输出。
  // 例如，可以使用 jest.spyOn(logger, 'info').mockImplementation(() => {});
  it('logger.info should be callable without errors', () => {
    // 尝试调用 info 方法，但不检查其输出，只确保调用不抛出错误
    // 在更复杂的场景下，你可能需要 mock pino 的 transport 来捕获输出并进行断言
    expect(() => logger.info('Test info message from logger.test.ts')).not.toThrow();
  });

});

// 提醒：
// 1. 对于涉及外部依赖（如文件系统写入日志、网络请求）或依赖特定环境配置的测试，
//    通常需要使用 Jest 的 mock 功能 (jest.mock, jest.spyOn) 来隔离被测试单元。
// 2. 随着 logger.ts 功能的增加或配置的复杂化，可以添加更多针对性的测试用例。
//    例如，测试不同 LOG_LEVEL 下的行为，或测试 pino-pretty transport 是否按预期工作（这可能需要更复杂的 mock 设置）。