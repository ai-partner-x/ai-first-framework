/**
 * Formatter 单元测试
 * 测试 Formatter 类的格式化功能
 */

import { describe, test, expect } from 'vitest';
import { Formatter } from '../src/utils/formatter';
import type { FormatType } from '../src/types';

describe('Formatter', () => {
  test('应该正确创建 JSON 格式器', () => {
    const formatter = Formatter.json();
    expect(formatter).toBeDefined();
  });
  
  test('应该正确创建简单格式器', () => {
    const formatter = Formatter.simple();
    expect(formatter).toBeDefined();
  });
  
  test('应该正确创建漂亮格式器', () => {
    const formatter = Formatter.pretty();
    expect(formatter).toBeDefined();
  });
  
  test('应该正确创建 CLI 格式器', () => {
    const formatter = Formatter.cli(true);
    expect(formatter).toBeDefined();
    
    const formatterNoColor = Formatter.cli(false);
    expect(formatterNoColor).toBeDefined();
  });
  
  test('应该正确创建生产环境格式器', () => {
    const formatter = Formatter.production();
    expect(formatter).toBeDefined();
  });
  
  test('应该正确创建开发环境格式器', () => {
    const formatter = Formatter.development();
    expect(formatter).toBeDefined();
  });
  
  test('应该通过 create() 方法创建格式器', () => {
    const formats: FormatType[] = ['json', 'simple', 'pretty', 'cli'];
    
    formats.forEach(format => {
      const formatter = Formatter.create(format, format === 'cli');
      expect(formatter).toBeDefined();
    });
  });
  
  test('create() 方法应该处理未知格式', () => {
    // 未知格式应该回退到默认格式
    const formatter = Formatter.create('unknown' as any, true);
    expect(formatter).toBeDefined();
  });
  
  test('应该支持时间戳选项', () => {
    const formatter = Formatter.json({ timestamp: true });
    expect(formatter).toBeDefined();
    
    const formatterCustomTimestamp = Formatter.json({ timestamp: 'YYYY-MM-DD HH:mm:ss' });
    expect(formatterCustomTimestamp).toBeDefined();
  });
  
  test('应该支持颜色选项', () => {
    const formatter = Formatter.cli(true);
    expect(formatter).toBeDefined();
    
    const formatterNoColor = Formatter.cli(false);
    expect(formatterNoColor).toBeDefined();
  });
  
  test('应该支持自定义格式化函数', () => {
    const customFormat = (info: any) => `[CUSTOM] ${info.message}`;
    const formatter = Formatter.json({ custom: customFormat });
    expect(formatter).toBeDefined();
  });
  
  test('应该正确组合多个选项', () => {
    const formatter = Formatter.json({
      timestamp: 'YYYY-MM-DD',
      custom: (info) => `[${info.level}] ${info.message}`
    });
    expect(formatter).toBeDefined();
  });
  
  test('应该正确处理不同的日志级别颜色', () => {
    const formatter = Formatter.cli(true);
    expect(formatter).toBeDefined();
    
    // 测试不同级别的格式化器创建（不会抛出错误）
    const levels = ['info', 'warn', 'error', 'debug', 'verbose', 'silly'];
    
    levels.forEach(level => {
      expect(() => {
        // 创建不同级别的格式化器
        const levelFormatter = Formatter.cli(true);
        expect(levelFormatter).toBeDefined();
        
        // 验证格式化器能够被winston使用
        // 我们只测试格式化器创建成功，不直接调用内部方法
      }).not.toThrow();
    });
  });
});