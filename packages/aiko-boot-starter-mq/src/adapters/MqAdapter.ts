/**
 * 共享 MQ 适配器接口
 * 文档 3.4 MqMessage + 内部 wire 格式（retry/DLQ/traceId）
 */

import type { MqMessage } from '../core/MqMessage.js';

/** 文档格式：topic/tag/key/body */
export type { MqMessage } from '../core/MqMessage.js';

/** 内部 wire 格式（RabbitMQ/InMemory 传输层，含 retry/traceId） */
export interface WireMessage<T = unknown> {
  id: string;
  timestamp: number;
  traceId?: string;
  payload: T;
  retryCount: number;
  maxRetries: number;
}

export interface MqConsumeOptions {
  retry?: number;
  dlq?: string;
  /** RocketMQ tag，Kafka 可忽略 */
  tag?: string;
  /** 消费者组，RocketMQ/Kafka 使用 */
  group?: string;
}

/**
 * 统一 MQ 适配器接口
 * 实现 MqSender 的 send 重载，内部使用 wire 格式
 */
export interface MqAdapter {
  connect(): Promise<void>;
  send(message: MqMessage<unknown>): Promise<void>;
  send(topic: string, body: unknown): Promise<void>;
  send(topic: string, tag: string, body: unknown): Promise<void>;
  consume<T>(
    topic: string,
    handler: (body: T) => Promise<void>,
    options?: MqConsumeOptions
  ): Promise<void>;
  close(): Promise<void>;
}
