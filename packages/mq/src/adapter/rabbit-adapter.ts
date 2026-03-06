/**
 * RabbitMQ adapter for @ai-first/mq.
 * Install optional dependency: pnpm add amqplib
 */
import type {
  MQMessage,
  PublishOptions,
  ConsumeOptions,
  ConsumeContext,
  RabbitMQConnectionOptions,
  IMQClient,
} from '../types.js';

let amqplib: typeof import('amqplib') | null = null;

async function loadAmqplib(): Promise<typeof import('amqplib')> {
  if (amqplib) return amqplib;
  try {
    amqplib = (await import('amqplib')) as typeof import('amqplib');
    return amqplib;
  } catch {
    throw new Error(
      '@ai-first/mq: RabbitMQ adapter requires amqplib. Install with: pnpm add amqplib'
    );
  }
}

/**
 * Create RabbitMQ client. Throws if amqplib is not installed.
 * Call connect() after creation.
 */
export function createRabbitMQClient(options: RabbitMQConnectionOptions): IMQClient {
  return new RabbitMQClient(options);
}

class RabbitMQClient implements IMQClient {
  private conn: import('amqplib').Connection | null = null;
  private channel: import('amqplib').Channel | null = null;
  private consumers = new Map<string, { queue: string }>();
  private opts: RabbitMQConnectionOptions;

  constructor(options: RabbitMQConnectionOptions) {
    this.opts = options;
  }

  async connect(): Promise<void> {
    const amqp = await loadAmqplib();
    this.conn = await amqp.connect(this.opts.url);
    this.channel = await this.conn.createChannel();

    const assert = this.opts.assert;
    if (assert?.queues) {
      for (const q of assert.queues) {
        await this.channel.assertQueue(q.name, q.options);
      }
    }
    if (assert?.exchanges) {
      for (const ex of assert.exchanges) {
        await this.channel.assertExchange(ex.name, ex.type as 'direct' | 'topic' | 'fanout', ex.options);
      }
    }
    if (assert?.bindings) {
      for (const b of assert.bindings) {
        await this.channel.bindQueue(b.queue, b.exchange, b.routingKey ?? '');
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.channel.close().catch(() => {});
      this.channel = null;
    }
    if (this.conn) {
      await this.conn.close().catch(() => {});
      this.conn = null;
    }
  }

  isConnected(): boolean {
    return this.conn != null && this.conn != undefined;
  }

  async publish<T>(destination: string, message: MQMessage<T>, options?: PublishOptions): Promise<void> {
    if (!this.channel) throw new Error('MQ not connected');
    const content = Buffer.from(JSON.stringify(message.body));
    const opts: import('amqplib').Options.Publish = {
      persistent: options?.persistent ?? true,
      contentType: options?.contentType ?? 'application/json',
      correlationId: options?.correlationId,
      replyTo: options?.replyTo,
      headers: message.headers,
      timestamp: message.timestamp ?? Math.floor(Date.now() / 1000),
    };
    if (options?.priority != null) opts.priority = options.priority;
    // Spring 风格：destination 为 "exchange/routingKey" 时发到交换机，否则发到队列
    if (destination.includes('/')) {
      const [exchange, routingKey] = destination.split(/\/(.*)/).filter(Boolean);
      this.channel.publish(exchange, routingKey || '', content, opts);
    } else {
      this.channel.sendToQueue(destination, content, opts);
    }
  }

  get consume(): import('../types.js').IMQConsumer {
    return {
      subscribe: this.subscribe.bind(this),
      unsubscribe: this.unsubscribe.bind(this),
    };
  }

  private async subscribe<T>(
    queue: string,
    handler: (ctx: ConsumeContext<T>) => void | Promise<void>,
    options?: ConsumeOptions
  ): Promise<string> {
    if (!this.channel) throw new Error('MQ not connected');
    await this.channel.prefetch(options?.prefetch ?? 1);

    const result = await this.channel.consume(
      queue,
      async (raw) => {
        if (!raw) return;
        const body = JSON.parse(raw.content.toString()) as T;
        const message: MQMessage<T> = {
          body,
          headers: raw.properties.headers as Record<string, string> | undefined,
          timestamp: raw.properties.timestamp,
          metadata: { deliveryTag: raw.fields.deliveryTag },
        };
        const ctx: ConsumeContext<T> = {
          message,
          ack: () => this.channel?.ack(raw),
          nack: (requeue) => this.channel?.nack(raw, false, requeue ?? false),
        };
        try {
          await handler(ctx);
        } catch (e) {
          ctx.nack(true);
        }
      },
      { noAck: options?.autoAck ?? false, consumerTag: options?.consumerTag }
    );

    const tag = result.consumerTag;
    this.consumers.set(tag, { queue });
    return tag;
  }

  private async unsubscribe(consumerTag: string): Promise<void> {
    if (this.channel) await this.channel.cancel(consumerTag);
    this.consumers.delete(consumerTag);
  }
}
