/**
 * InMemoryMqAdapter - 内存消息队列
 * 实现 MqAdapter，文档格式 + retry/DLQ
 */

import { v4 as uuidv4 } from 'uuid';
import type { MqProperties } from '../config/MqProperties.js';
import type { MqMessage, MqConsumeOptions, WireMessage } from './MqAdapter.js';

type PendingConsumer = {
  handler: (body: unknown) => Promise<void>;
  options: MqConsumeOptions;
};

export class InMemoryMqAdapter {
  private readonly queues = new Map<string, WireMessage<unknown>[]>();
  private readonly dlqQueues = new Map<string, WireMessage<unknown>[]>();
  private readonly consumers = new Map<string, PendingConsumer>();

  constructor(_properties: MqProperties) {}

  async connect(): Promise<void> {}

  async send(message: MqMessage<unknown>): Promise<void>;
  async send(topic: string, body: unknown): Promise<void>;
  async send(topic: string, tag: string, body: unknown): Promise<void>;
  async send(
    msgOrTopic: MqMessage<unknown> | string,
    bodyOrTag?: unknown,
    body?: unknown
  ): Promise<void> {
    let message: MqMessage<unknown>;
    if (typeof msgOrTopic === 'object') {
      message = msgOrTopic;
    } else if (body !== undefined) {
      message = { topic: msgOrTopic, tag: String(bodyOrTag ?? ''), body };
    } else {
      message = { topic: msgOrTopic, tag: '', body: bodyOrTag };
    }

    const wire: WireMessage<unknown> = {
      id: uuidv4(),
      timestamp: Date.now(),
      traceId: uuidv4(),
      payload: message.body,
      retryCount: 0,
      maxRetries: 3,
    };

    await this.deliverOrEnqueue(message.topic, wire);
  }

  private async deliverOrEnqueue(
    topic: string,
    wire: WireMessage<unknown>
  ): Promise<void> {
    const consumer = this.consumers.get(topic);
    if (consumer) {
      await this.deliverWithRetry(topic, wire, consumer);
    } else {
      const list = this.queues.get(topic) ?? [];
      list.push(wire);
      this.queues.set(topic, list);
    }
  }

  private async deliverWithRetry(
    topic: string,
    wire: WireMessage<unknown>,
    consumer: PendingConsumer
  ): Promise<void> {
    const retry = consumer.options.retry ?? 3;
    const dlq = consumer.options.dlq ?? `${topic}.dlq`;

    try {
      await consumer.handler(wire.payload);
    } catch {
      wire.retryCount = (wire.retryCount ?? 0) + 1;

      if (wire.retryCount >= retry) {
        const dlqList = this.dlqQueues.get(dlq) ?? [];
        dlqList.push(wire);
        this.dlqQueues.set(dlq, dlqList);
      } else {
        await this.deliverWithRetry(topic, wire, consumer);
      }
    }
  }

  async consume<T>(
    topic: string,
    handler: (body: T) => Promise<void>,
    options: MqConsumeOptions = {}
  ): Promise<void> {
    const h = handler as (body: unknown) => Promise<void>;
    this.consumers.set(topic, { handler: h, options });

    const list = this.queues.get(topic);
    if (list?.length) {
      for (const wire of list) {
        await this.deliverWithRetry(topic, wire, { handler: h, options });
      }
      this.queues.set(topic, []);
    }
  }

  async close(): Promise<void> {
    this.queues.clear();
    this.dlqQueues.clear();
    this.consumers.clear();
  }

  getDlqMessages(topic: string): WireMessage<unknown>[] {
    return this.dlqQueues.get(topic) ?? [];
  }
}
