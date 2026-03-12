/**
 * 测试环境设置
 * 在所有测试运行之前执行
 */

import { vi, beforeEach, afterEach } from 'vitest';

// 模拟 console 方法以避免测试输出干扰
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'debug').mockImplementation(() => {});
});

// 清理所有模拟
afterEach(() => {
  vi.restoreAllMocks();
});

// Mock @ai-partner-x/aiko-boot/boot 模块
// 避免测试依赖外部模块状态
vi.mock('@ai-partner-x/aiko-boot/boot', () => {
  const mockConfigLoader = {
    isLoaded: vi.fn().mockReturnValue(false),
    getPrefix: vi.fn().mockReturnValue({}),
    get: vi.fn().mockReturnValue(undefined),
    has: vi.fn().mockReturnValue(false),
    getAll: vi.fn().mockReturnValue({}),
    set: vi.fn(),
    load: vi.fn(),
    clear: vi.fn(),
  };

  const mockApplicationContext = {
    getBean: vi.fn(),
    getBeansOfType: vi.fn(),
    registerBean: vi.fn(),
    refresh: vi.fn(),
    close: vi.fn(),
    isActive: vi.fn().mockReturnValue(false),
    getId: vi.fn().mockReturnValue('test-context'),
  };

  return {
    ConfigLoader: mockConfigLoader,
    getApplicationContext: vi.fn().mockReturnValue(mockApplicationContext),
    createApp: vi.fn().mockReturnValue(mockApplicationContext),
    AutoConfiguration: vi.fn(),
    ConditionalOnProperty: vi.fn(),
    Value: vi.fn(),
    Autowired: vi.fn(),
    Component: vi.fn(),
    Service: vi.fn(),
    Repository: vi.fn(),
    Controller: vi.fn(),
    Configuration: vi.fn(),
    Bean: vi.fn(),
  };
});

// 全局导出 mock 引用，供测试文件访问和修改
declare global {
  // eslint-disable-next-line no-var
  var __mockConfigLoader: any;
  // eslint-disable-next-line no-var
  var __mockGetApplicationContext: any;
}

// 在测试中可以通过 globalThis.__mockConfigLoader 访问和修改 mock 行为

// 全局测试辅助函数
globalThis.testHelpers = {
  createMockTransport: (type: 'console' | 'file' | 'stream' = 'console') => {
    switch (type) {
      case 'console':
        return {
          type: 'console' as const,
          enabled: true,
          level: 'debug' as const,
          format: 'cli' as const,
          colorize: true,
          timestamp: true
        };
      case 'file':
        return {
          type: 'file' as const,
          enabled: true,
          filename: './test.log',
          level: 'info' as const,
          maxSize: '1mb',
          maxFiles: 3
        };
      case 'stream':
        return {
          type: 'stream' as const,
          enabled: true,
          stream: {
            write: vi.fn()
          } as any,
          level: 'error' as const
        };
    }
  },
  
  createMockLoggerConfig: (name: string = 'test-logger') => ({
    name,
    level: 'debug' as const,
    defaultMeta: { test: true },
    transports: [
      {
        type: 'console' as const,
        enabled: true,
        level: 'debug' as const,
        format: 'cli' as const
      }
    ],
    format: 'cli' as const,
    colorize: true,
    timestamp: true
  }),
  
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
};