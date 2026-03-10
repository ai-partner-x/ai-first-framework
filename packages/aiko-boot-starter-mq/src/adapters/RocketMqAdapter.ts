/**
 * RocketMQ 适配器
 * 基于 rocketmq-client-nodejs，实现 MqAdapter
 * 需 RocketMQ 5.x + Proxy (默认端口 8081)
 */

import { Producer, SimpleConsumer } from 'rocketmq-client-nodejs';
import { v4 as uuidv4 } from 'uuid';
import type { MqProperties } from '../config/MqProperties.js';
import type { MqMessage, MqConsumeOptions, WireMessage } from './MqAdapter.js';
import { MqSerializer } from '../core/MqSerializer.js';
import { logger } from '../logger.js';

type PendingConsumer = {
  topic: string;
  tag: string;
  group: string;
  handler: (body: unknown) => Promise<void>;
  options: MqConsumeOptions;
};

export class RocketMqAdapter {
  private producer: Producer | null = null;
  private readonly consumers: Array<{
    consumer: SimpleConsumer;
    pc: PendingConsumer;
    interval: ReturnType<typeof setInterval>;
  }> = [];
  private readonly properties: MqProperties;
  private readonly pendingConsumers: PendingConsumer[] = [];
  private closed = false;

  constructor(properties: MqProperties) {
    this.properties = properties;
  }

  private getEndpoints(): string {
    const { host, port = 8081, endpoints } = this.properties;
    return endpoints ?? `${host}:${port}`;
  }

  async connect(): Promise<void> {
    this.closed = false;
    const endpoints = this.getEndpoints();

    const namespace = this.properties.namespace ?? '';
    this.producer = new Producer({ endpoints, namespace });
    await this.producer.startup();
    logger.info('RocketMQ producer connected');

    for (const pc of this.pendingConsumers) {
      await this.startReceiveLoop(pc);
    }
  }

  private async startReceiveLoop(pc: PendingConsumer): Promise<void> {
    if (this.closed) return;
    const endpoints = this.getEndpoints();
    const subscriptions = new Map<string, string>();
    subscriptions.set(pc.topic, pc.tag === '*' ? '*' : pc.tag);

    const namespace = this.properties.namespace ?? '';
    const consumer = new SimpleConsumer({
      consumerGroup: pc.group,
      endpoints,
      namespace,
      subscriptions,
    });

    await consumer.startup();

    const runLoop = async () => {
      if (this.closed) return;
      try {
        const messages = await consumer.receive(20);
        for (const msg of messages) {
          try {
            const raw = msg.body?.toString();
            if (!raw) continue;
            const wire: WireMessage<unknown> = JSON.parse(raw);
            await pc.handler(wire.payload);
            await consumer.ack(msg);
          } catch (err) {
            logger.error(`RocketMQ consume error topic=${pc.topic}`, { err });
          }
        }
      } catch (err) {
        if (!this.closed) logger.debug('RocketMQ receive', { err });
      }
      if (!this.closed) {
        const id = setTimeout(runLoop, 100);
        const entry = this.consumers.find((c) => c.pc === pc);
        if (entry) entry.interval = id;
      }
    };

    const interval = setTimeout(runLoop, 100);
    this.consumers.push({ consumer, pc, interval });
  }

  async send(message: MqMessage<unknown>): Promise<void>;
  async send(topic: string, body: unknown): Promise<void>;
  async send(topic: string, tag: string, body: unknown): Promise<void>;
  async send(
    msgOrTopic: MqMessage<unknown> | string,
    bodyOrTag?: unknown,
    body?: unknown
  ): Promise<void> {
    if (!this.producer) throw new Error('Producer not initialized');
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
      maxRetries: this.properties.defaultRetryCount ?? 3,
    };

    const json = MqSerializer.toJson(wire);
    await this.producer.send({
      topic: message.topic,
      tag: message.tag || undefined,
      body: Buffer.from(json),
    });
    logger.debug(`Sent to ${message.topic}`, { traceId: wire.traceId });
  }

  async consume<T>(
    topic: string,
    handler: (body: T) => Promise<void>,
    options: MqConsumeOptions = {}
  ): Promise<void> {
    const h = handler as (body: unknown) => Promise<void>;
    const group = options.group ?? this.properties.groupId ?? 'default-group';
    const tag = options.tag ?? '*';
    const pc: PendingConsumer = {
      topic,
      tag,
      group,
      handler: h,
      options,
    };
    this.pendingConsumers.push(pc);

    if (this.producer) {
      await this.startReceiveLoop(pc);
    }
  }

  async close(): Promise<void> {
    this.closed = true;
    for (const { consumer, interval } of this.consumers) {
      clearTimeout(interval);
      try {
        await consumer.shutdown();
      } catch {}
    }
    this.consumers.length = 0;
    if (this.producer) {
      try {
        await this.producer.shutdown();
      } catch {}
      this.producer = null;
    }
    this.pendingConsumers.length = 0;
    logger.info('RocketMQ connection closed');
  }
}
