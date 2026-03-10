/**
 * MQ 全局异常处理器
 * 文档 3.2，消费异常时回调
 */

import { logger } from '../logger.js';

export class MqErrorHandler {
  handle(topic: string, tag: string, _msg: unknown, e: Error): void {
    logger.error(`[MQ消费异常] topic=${topic} tag=${tag}`, e);
  }
}
