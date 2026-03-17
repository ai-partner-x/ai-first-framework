/**
 * 自动配置单元测试
 * 测试 auto-configuration.ts 中的自动配置功能
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import {
  LogAutoConfiguration,
  DEFAULT_CONFIG,
  createLogAutoConfiguration,
  logAutoConfigure,
  LoggingProperties
} from '../src/config/auto-configuration';
import type { LogConfig, LogLevel } from '../src/types';

describe('自动配置', () => {
  let autoConfig: LogAutoConfiguration;
  
  beforeEach(() => {
    autoConfig = new LogAutoConfiguration();
  });
  
  test('应该正确创建 LogAutoConfiguration 实例', () => {
    expect(autoConfig).toBeInstanceOf(LogAutoConfiguration);
  });
  
  test('应该正确创建 LoggingProperties 实例', () => {
    const props = new LoggingProperties();
    expect(props).toBeInstanceOf(LoggingProperties);
    expect(props.level).toBe('info'); // 默认值
    expect(props.format).toBe('text'); // 默认值
  });
  
  test('LoggingProperties 应该支持自定义值', () => {
    const props = new LoggingProperties();
    props.level = 'debug';
    props.format = 'json';
    
    expect(props.level).toBe('debug');
    expect(props.format).toBe('json');
  });
  
  test('应该正确获取默认配置', () => {
    expect(DEFAULT_CONFIG).toBeDefined();
    expect(DEFAULT_CONFIG.level).toBe('info');
    expect(DEFAULT_CONFIG.format).toBe('cli');
    expect(DEFAULT_CONFIG.transports).toBeInstanceOf(Array);
    expect(DEFAULT_CONFIG.transports.length).toBeGreaterThan(0);
  });
  
  test('应该通过 getConfig() 获取配置', () => {
    const config = autoConfig.getConfig();
    expect(config).toBeDefined();
    expect(config.level).toBeDefined();
    expect(config.format).toBeDefined();
    expect(config.transports).toBeInstanceOf(Array);
  });
  
  test('应该通过 getProperties() 获取配置属性', () => {
    const props = autoConfig.getProperties();
    expect(props).toBeInstanceOf(LoggingProperties);
    expect(props.level).toBeDefined();
    expect(props.format).toBeDefined();
  });
  
  test('应该通过 getTransportConfigs() 获取传输配置', () => {
    const transports = autoConfig.getTransportConfigs();
    expect(transports).toBeInstanceOf(Array);
    
    if (transports.length > 0) {
      const transport = transports[0];
      expect(transport.type).toBeDefined();
      expect(transport.enabled).toBe(true);
    }
  });
  
  test('应该正确初始化配置', async () => {
    await expect(async () => {
      await autoConfig.initialize();
    }).not.toThrow();
    
    const config = autoConfig.getConfig();
    expect(config).toBeDefined();
  });
  
  test('应该通过工厂函数创建配置', () => {
    const configInstance = createLogAutoConfiguration();
    expect(configInstance).toBeInstanceOf(LogAutoConfiguration);
  });
  
  test('logAutoConfigure 应该是一个函数', () => {
    expect(typeof logAutoConfigure).toBe('function');
  });
  
  test('logAutoConfigure 应该返回配置类', () => {
    const result = logAutoConfigure(LogAutoConfiguration);
    expect(result).toBe(LogAutoConfiguration);
  });
  
  test('应该正确处理配置映射', () => {
    const props = autoConfig.getProperties();
    
    // 测试属性映射
    expect(['debug', 'info', 'warn', 'error']).toContain(props.level);
    expect(['json', 'text']).toContain(props.format);
  });
  
  test('应该支持配置缓存', () => {
    const config1 = autoConfig.getConfig();
    const config2 = autoConfig.getConfig();
    
    // 第二次调用应该返回相同的配置值（缓存）
    expect(config2).toEqual(config1);
  });
  
  test('initialize() 应该重置缓存', async () => {
    const config1 = autoConfig.getConfig();
    await autoConfig.initialize();
    const config2 = autoConfig.getConfig();
    
    // initialize() 后应该重新加载配置
    expect(config2).not.toBe(config1);
  });
  
  test('应该处理缺失的 ConfigLoader', () => {
    // 在没有 @ai-partner-x/aiko-boot 的情况下应该回退到默认配置
    const config = autoConfig.getConfig();
    expect(config).toBeDefined();
    expect(config.level).toBe('info');
  });
  
  test('应该正确处理不同的日志级别映射', () => {
    const testCases = [
      { input: 'debug' as const, expected: 'debug' as const },
      { input: 'info' as const, expected: 'info' as const },
      { input: 'warn' as const, expected: 'warn' as const },
      { input: 'error' as const, expected: 'error' as const },
    ];
    
    testCases.forEach(({ input, expected }) => {
      const props = new LoggingProperties();
      props.level = input;
      
      expect(props.level).toBe(expected);
    });
  });
  
  test('应该正确处理不同的格式映射', () => {
    const testCases = [
      { input: 'json' as const, expected: 'json' as const },
      { input: 'text' as const, expected: 'text' as const },
    ];
    
    testCases.forEach(({ input, expected }) => {
      const props = new LoggingProperties();
      props.format = input;
      
      expect(props.format).toBe(expected);
    });
  });
  
  test('应该提供有意义的控制台输出', async () => {
    // 捕获 console.log 输出
    const consoleSpy = vi.spyOn(console, 'log');
    
    await autoConfig.initialize();
    
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0][0]).toContain('[aiko-log]');
    
    consoleSpy.mockRestore();
  });
});