/**
 * Kafka 适配器
 * 基于 kafkajs，实现 MqAdapter
 */

import { Kafka, type Producer, type Consumer } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import type { MqProperties } from '../config/MqProperties.js';
import type { MqMessage, MqConsumeOptions, WireMessage } from './MqAdapter.js';
import { MqSerializer } from '../core/MqSerializer.js';
import { logger } from '../logger.js';

type PendingConsumer = {
  topic: string;
  handler: (body: unknown) => Promise<void>;
  options: MqConsumeOptions;
};

export class KafkaMqAdapter {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumers: Consumer[] = [];
  private readonly properties: MqProperties;
  private readonly pendingConsumers: PendingConsumer[] = [];
  private closed = false;

  constructor(properties: MqProperties) {
    this.properties = properties;
    const { host, port, clientId = 'aiko-boot-mq' } = properties;
    const kafkaPort = port ?? 9092;
    const brokers = [`${host}:${kafkaPort}`];
    this.kafka = new Kafka({
      clientId,
      brokers,
    });
  }

  async connect(): Promise<void> {
    this.closed = false;
    this.producer = this.kafka.producer();
    await this.producer.connect();
    logger.info('Kafka producer connected');

    for (const c of this.pendingConsumers) {
      await this.startConsumer(c);
    }
  }

  private async startConsumer(pc: PendingConsumer): Promise<void> {
    const groupId = pc.options.group ?? this.properties.groupId ?? 'default-group';
    const consumer = this.kafka.consumer({ groupId });
    await consumer.connect();
    this.consumers.push(consumer);

    await consumer.subscribe({ topic: pc.topic, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        if (this.closed) return;
        const traceId =
          (message.headers?.traceId as Buffer)?.toString() ?? uuidv4();
        try {
          const raw = message.value?.toString();
          if (!raw) return;
          const wire: WireMessage<unknown> = JSON.parse(raw);
          const body = wire.payload;
          await pc.handler(body);
          logger.debug(`ACK ${topic}`, { traceId });
        } catch (err) {
          logger.error(`Kafka consume error topic=${topic}`, { traceId, err });
          throw err;
        }
      },
    });

    logger.info(`Kafka consumer subscribed: ${pc.topic}`);
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
      messages: [
        {
          key: message.key || message.tag || wire.id,
          value: json,
          headers: { traceId: wire.traceId! },
        },
      ],
    });
    logger.debug(`Sent to ${message.topic}`, { traceId: wire.traceId });
  }

  async consume<T>(
    topic: string,
    handler: (body: T) => Promise<void>,
    options: MqConsumeOptions = {}
  ): Promise<void> {
    const h = handler as (body: unknown) => Promise<void>;
    this.pendingConsumers.push({ topic, handler: h, options });
    if (this.producer) {
      await this.startConsumer({ topic, handler: h, options });
    }
  }

  async close(): Promise<void> {
    this.closed = true;
    for (const c of this.consumers) {
      await c.disconnect();
    }
    this.consumers = [];
    if (this.producer) {
      await this.producer.disconnect();
      this.producer = null;
    }
    this.pendingConsumers.length = 0;
    logger.info('Kafka connection closed');
  }
}
