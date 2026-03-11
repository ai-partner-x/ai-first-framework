/**
 * RabbitMQ 适配器
 * 实现 MqAdapter，支持 MqSender send 重载、retry/DLQ
 */

import { connect } from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
import type { MqProperties } from '../config/MqProperties.js';
import type { MqMessage, MqConsumeOptions, WireMessage } from './MqAdapter.js';
import { MqSerializer } from '../core/MqSerializer.js';
import { logger } from '../logger.js';

/** amqplib 连接与通道类型 */
type AmqpConnection = Awaited<ReturnType<typeof connect>>;
type AmqpChannel = Awaited<ReturnType<AmqpConnection['createChannel']>>;

type PendingConsumer = {
  topic: string;
  handler: (body: unknown) => Promise<void>;
  options: MqConsumeOptions;
};

export class RabbitMqAdapter {
  private conn: AmqpConnection | null = null;
  private channel: AmqpChannel | null = null;
  private readonly properties: MqProperties;
  private closed = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly pendingConsumers: PendingConsumer[] = [];

  constructor(properties: MqProperties) {
    this.properties = properties;
  }

  private buildConnectionUrl(): string {
    const { host, port = 5672, username, password, vhost = '/', useTls = false } =
      this.properties;
    const protocol = useTls ? 'amqps' : 'amqp';
    const vhostPath = vhost.startsWith('/') ? vhost : `/${vhost}`;
    return `${protocol}://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}${vhostPath}`;
  }

  private setupChannel(): void {
    if (!this.conn || !this.channel) return;
    const prefetch = this.properties.prefetchCount ?? 10;
    if (prefetch > 0) this.channel.prefetch(prefetch);
  }

  private scheduleReconnect(): void {
    if (this.closed || this.reconnectTimer) return;
    const initial = this.properties.reconnectInitialDelayMs ?? 1000;
    const max = this.properties.reconnectMaxDelayMs ?? 30000;
    let delay = initial;
    const tryReconnect = async () => {
      this.reconnectTimer = null;
      if (this.closed) return;
      try {
        logger.info('Attempting RabbitMQ reconnection...');
        await this.doConnect();
        for (const c of this.pendingConsumers) {
          await this.registerConsumerOnChannel(c.topic, c.handler, c.options);
        }
        logger.info('RabbitMQ reconnected successfully');
      } catch (err) {
        logger.warn('RabbitMQ reconnect failed, will retry', { delay, err });
        this.reconnectTimer = setTimeout(tryReconnect, Math.min(delay, max));
        delay = Math.min(delay * 2, max);
      }
    };
    this.reconnectTimer = setTimeout(tryReconnect, delay);
  }

  private async registerConsumerOnChannel(
    topic: string,
    handler: (body: unknown) => Promise<void>,
    options: MqConsumeOptions
  ): Promise<void> {
    if (!this.channel) return;
    const retry = options.retry ?? this.properties.defaultRetryCount ?? 3;
    const dlq = options.dlq ?? `${topic}.dlq`;

    await this.channel.assertQueue(topic, { durable: true });
    if (this.properties.enableDLQ) {
      await this.channel.assertQueue(dlq, { durable: true });
    }

    this.channel.consume(topic, async (raw) => {
      if (!raw) return;
      const traceId =
        (raw.properties.headers?.traceId as string) ?? uuidv4();
      try {
        const wire: WireMessage<unknown> = JSON.parse(raw.content.toString());
        const body = wire.payload;
        await handler(body);
        this.channel!.ack(raw);
        logger.debug(`ACK ${topic}`, { traceId });
      } catch (err) {
        const wire: WireMessage<unknown> = JSON.parse(raw.content.toString());
        wire.retryCount = (wire.retryCount ?? 0) + 1;
        wire.maxRetries = wire.maxRetries ?? retry;

        if (wire.retryCount >= retry) {
          logger.error(`Max retries reached, moving to DLQ: ${dlq}`, {
            traceId,
            err,
          });
          this.channel!.nack(raw, false, false);
          if (this.properties.enableDLQ) {
            this.channel!.sendToQueue(
              dlq,
              Buffer.from(JSON.stringify(wire)),
              { persistent: true, headers: { traceId } }
            );
          }
        } else {
          logger.warn(`Retrying (${wire.retryCount}/${wire.maxRetries})`, {
            traceId,
          });
          this.channel!.nack(raw, false, true);
        }
      }
    });
  }

  private async doConnect(): Promise<void> {
    const url = this.buildConnectionUrl();
    const { connectionTimeout = 10000 } = this.properties;
    this.conn = await connect(url, { timeout: connectionTimeout });
    this.channel = await this.conn.createChannel();
    this.setupChannel();

    this.conn.on('close', () => {
      logger.warn('RabbitMQ connection closed');
      this.conn = null;
      this.channel = null;
      this.scheduleReconnect();
    });

    this.conn.on('error', (err) => logger.error('RabbitMQ connection error', err));
  }

  async connect(): Promise<void> {
    if (this.conn) return;
    this.closed = false;
    try {
      await this.doConnect();
      logger.info('RabbitMQ connected successfully');
    } catch (err) {
      logger.error('RabbitMQ connection failed', err);
      throw err;
    }
  }

  async send(message: MqMessage<unknown>): Promise<void>;
  async send(topic: string, body: unknown): Promise<void>;
  async send(topic: string, tag: string, body: unknown): Promise<void>;
  async send(
    msgOrTopic: MqMessage<unknown> | string,
    bodyOrTag?: unknown,
    body?: unknown
  ): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');
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
    await this.channel.assertQueue(message.topic, { durable: true });
    this.channel.sendToQueue(message.topic, Buffer.from(json), {
      persistent: true,
      headers: { traceId: wire.traceId },
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
    if (this.channel) {
      await this.registerConsumerOnChannel(topic, h, options);
    }
  }

  async close(): Promise<void> {
    this.closed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.pendingConsumers.length = 0;
    const ch = this.channel;
    const c = this.conn;
    this.channel = null;
    this.conn = null;
    if (ch) await ch.close();
    if (c) await c.close();
    logger.info('RabbitMQ connection closed');
  }
}
