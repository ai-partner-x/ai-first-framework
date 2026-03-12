/**
 * 日志格式化器
 */

import * as winston from 'winston';
import type { FormatType, FormatOptions } from './types';

/**
 * 日志格式化工具类
 */
export class Formatter {
  /** 创建格式化器 */
  static create(type: FormatType, colorize = true): winston.Logform.Format {
    switch (type) {
      case 'json': return this.json();
      case 'simple': return this.simple();
      case 'pretty': return this.pretty();
      default: return this.cli(colorize);
    }
  }

  /** JSON 格式 */
  static json(): winston.Logform.Format {
    return winston.format.combine(winston.format.timestamp(), winston.format.json());
  }

  /** 简单格式 */
  static simple(): winston.Logform.Format {
    return winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(this.formatMessage)
    );
  }

  /** 美化格式 */
  static pretty(): winston.Logform.Format {
    return winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ level, message, timestamp, logger, ...meta }) => {
        const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
        const loggerStr = logger ? `[${logger}] ` : '';
        return `${timestamp} [${(level as string).toUpperCase()}] ${loggerStr}${message}${metaStr}`;
      })
    );
  }

  /** CLI 格式（带颜色） */
  static cli(colorize = true): winston.Logform.Format {
    const formats = [
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.printf(({ level, message, timestamp, logger, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        const loggerStr = logger ? `[${logger}] ` : '';
        return `${timestamp} [${(level as string).toUpperCase().padEnd(7)}] ${loggerStr}${message}${metaStr}`;
      }),
    ];

    if (colorize) formats.unshift(winston.format.colorize({ all: true }));
    return winston.format.combine(...formats);
  }

  /** 自定义格式 */
  static custom(options: FormatOptions): winston.Logform.Format {
    const formats: winston.Logform.Format[] = [];

    if (options.timestamp) {
      const tsFormat = typeof options.timestamp === 'string' ? options.timestamp : 'YYYY-MM-DD HH:mm:ss';
      formats.push(winston.format.timestamp({ format: tsFormat }));
    }
    if (options.colorize) formats.push(winston.format.colorize({ all: true }));
    formats.push(winston.format.printf(options.custom ?? this.formatMessage));

    return winston.format.combine(...formats);
  }

  /** 生产环境格式 */
  static production(): winston.Logform.Format {
    return winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );
  }

  /** 开发环境格式 */
  static development(): winston.Logform.Format {
    return winston.format.combine(
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.colorize({ all: true }),
      winston.format.printf(({ level, message, timestamp, logger, stack, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        const stackStr = stack ? `\n${stack}` : '';
        const loggerStr = logger ? `[${logger}] ` : '';
        return `${timestamp} [${level}] ${loggerStr}${message}${metaStr}${stackStr}`;
      })
    );
  }

  // ========== 组合格式工具 ==========

  static combine(...formats: winston.Logform.Format[]): winston.Logform.Format {
    return winston.format.combine(...formats);
  }

  static withTimestamp(format = 'YYYY-MM-DD HH:mm:ss'): winston.Logform.Format {
    return winston.format.timestamp({ format });
  }

  static withColorize(): winston.Logform.Format {
    return winston.format.colorize({ all: true });
  }

  static withLabel(label: string): winston.Logform.Format {
    return winston.format.label({ label });
  }

  static withErrors(): winston.Logform.Format {
    return winston.format.errors({ stack: true });
  }

  /** 默认消息格式 */
  private static formatMessage({ level, message, timestamp, logger, ...meta }: winston.Logform.TransformableInfo): string {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    const loggerStr = logger ? `[${logger}] ` : '';
    return `${timestamp} [${(level as string).toUpperCase()}] ${loggerStr}${message}${metaStr}`;
  }
}