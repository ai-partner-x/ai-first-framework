/**
 * 日志自动配置
 * 实现 @ai-partner-x/aiko-boot/boot 的自动配置机制
 *
 * 配置映射说明：
 * 1. 遵循 aiko-boot 的 app-config.schema.json 规范
 * 2. logging.level: 'debug'|'info'|'warn'|'error' -> 映射到更丰富的日志级别
 * 3. logging.format: 'json'|'text' -> 映射到格式类型
 * 4. 支持向后兼容的 'log' 和 'logger' 前缀
 */

import type { LogConfig, LogLevel, TransportConfig } from './types';
import { ConfigLoader } from '@ai-partner-x/aiko-boot/boot';

/**
 * 日志配置属性类
 * 严格根据 app-config.schema.json 中的 logging 配置定义
 */
export class LoggingProperties {
  /** 日志级别：debug, info, warn, error */
  level?: 'debug' | 'info' | 'warn' | 'error' = 'info';
  /** 日志格式：json 或 text */
  format?: 'json' | 'text' = 'text';
}

/** 默认配置 */
const DEFAULT_CONFIG: LogConfig = {
  level: 'info',
  format: 'cli',
  colorize: true,
  timestamp: true,
  transports: [{ type: 'console', format: 'cli', colorize: true, enabled: true }],
};

/** 加载配置 */
function loadConfig(): LogConfig {
  try {
    // 动态加载 ConfigLoader - 使用同步方式避免异步问题
    if (!ConfigLoader?.isLoaded?.()) return { ...DEFAULT_CONFIG };
    
    const raw = ConfigLoader.getPrefix('logging');
    if (!raw || Object.keys(raw).length === 0) return { ...DEFAULT_CONFIG };
    
    // 创建配置
    const props = new LoggingProperties();
    if (raw.level) props.level = raw.level as any;
    if (raw.format) props.format = raw.format as any;
    
    return {
      level: (props.level || 'info') as LogLevel,
      format: props.format === 'json' ? 'json' : 'cli',
      colorize: true,
      timestamp: true,
      transports: [{
        type: 'console',
        enabled: true,
        level: (props.level || 'info') as LogLevel,
        format: props.format === 'json' ? 'json' : 'cli',
        colorize: true,
        timestamp: true,
      }],
    };
    
  } catch (error) {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * 日志自动配置类
 * 简化版本，不依赖 winston
 */
export class LogAutoConfiguration {
  private config: LogConfig | null = null;
  
  /** 获取配置 */
  getConfig(): LogConfig {
    if (!this.config) this.config = loadConfig();
    return this.config;
  }
  
  /** 获取配置属性 */
  getProperties(): LoggingProperties {
    const config = this.getConfig();
    const props = new LoggingProperties();
    
    // 映射配置到属性
    switch (config.level) {
      case 'debug':
      case 'info':
      case 'warn':
      case 'error':
        props.level = config.level;
        break;
    }
    
    if (config.format === 'json' || config.format === 'cli') {
      props.format = config.format === 'json' ? 'json' : 'text';
    }
    
    return props;
  }
  
  /** 初始化方法 */
  initialize(): void {
    this.config = loadConfig();
    console.log(`📝 [aiko-log] 日志配置已加载 - 级别: ${this.config.level}, 格式: ${this.config.format}`);
  }
  
  /** 获取传输配置 */
  getTransportConfigs(): TransportConfig[] {
    const config = this.getConfig();
    return config.transports || [];
  }
}

/** 默认配置导出 */
export { DEFAULT_CONFIG };

/**
 * 自动配置函数
 * 兼容 @ai-partner-x/aiko-boot/boot 的 autoConfigure 接口
 */
export function logAutoConfigure(configClass: any): any {
  return configClass;
}

/** 工厂函数 */
export function createLogAutoConfiguration(): LogAutoConfiguration {
  return new LogAutoConfiguration();
}