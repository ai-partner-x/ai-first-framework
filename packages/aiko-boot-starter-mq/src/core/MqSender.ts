/**
 * 统一发送接口
 * 文档 3.5
 */

import type { MqMessage } from './MqMessage.js';

export interface MqSender {
  send(message: MqMessage<unknown>): Promise<void>;
  send(topic: string, body: unknown): Promise<void>;
  send(topic: string, tag: string, body: unknown): Promise<void>;
}
