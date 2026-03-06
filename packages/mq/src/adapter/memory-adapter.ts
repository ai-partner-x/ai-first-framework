/**
 * In-memory MQ adapter for development and testing.
 * No external dependencies. Not persistent.
 */
import type {
  MQMessage,
  PublishOptions,
  ConsumeOptions,
  ConsumeContext,
  IMQClient,
  IMQConnection,
  IMQProducer,
  IMQConsumer,
} from '../types.js';

type Handler = (ctx: ConsumeContext) => void | Promise<void>;

class MemoryConnection implements IMQConnection {
  private connected = false;

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }
}

class MemoryProducer implements IMQProducer {
  constructor(
    private queues: Map<string, MQMessage<unknown>[]>,
    private connected: () => boolean
  ) {}

  async publish<T>(queue: string, message: MQMessage<T>, _options?: PublishOptions): Promise<void> {
    if (!this.connected()) throw new Error('[MQ Memory] Not connected');
    const list = this.queues.get(queue) ?? [];
    list.push({ ...message, timestamp: message.timestamp ?? Date.now() });
    this.queues.set(queue, list);
  }
}

class MemoryConsumer implements IMQConsumer {
  private tags = new Map<string, { queue: string; handler: Handler }>();
  private tagId = 0;

  constructor(
    private queues: Map<string, MQMessage<unknown>[]>,
    private runLoop: (tag: string) => void
  ) {}

  async subscribe<T>(
    queue: string,
    handler: (ctx: ConsumeContext<T>) => void | Promise<void>,
    _options?: ConsumeOptions
  ): Promise<string> {
    const tag = `mem-${++this.tagId}`;
    this.tags.set(tag, {
      queue,
      handler: handler as Handler,
    });
    this.runLoop(tag);
    return tag;
  }

  async unsubscribe(consumerTag: string): Promise<void> {
    this.tags.delete(consumerTag);
  }

  getHandler(tag: string): { queue: string; handler: Handler } | undefined {
    return this.tags.get(tag);
  }
}

/**
 * In-memory MQ client. Messages are stored per-queue and delivered to the first registered consumer.
 * Useful for local dev and unit tests.
 */
export class MemoryMQClient implements IMQClient {
  private queues = new Map<string, MQMessage<unknown>[]>();
  private connection: MemoryConnection;
  private producer: MemoryProducer;
  private consumer: MemoryConsumer;
  private running = false;

  constructor() {
    this.connection = new MemoryConnection();
    this.producer = new MemoryProducer(this.queues, () => this.connection.isConnected());
    this.consumer = new MemoryConsumer(this.queues, (tag) => this.drain(tag));
  }

  get consume(): IMQConsumer {
    return this.consumer;
  }

  async connect(): Promise<void> {
    await this.connection.connect();
    this.running = true;
  }

  async disconnect(): Promise<void> {
    this.running = false;
    await this.connection.disconnect();
  }

  isConnected(): boolean {
    return this.connection.isConnected();
  }

  async publish<T>(queue: string, message: MQMessage<T>, options?: PublishOptions): Promise<void> {
    return this.producer.publish(queue, message, options);
  }

  private drain(tag: string): void {
    const entry = this.consumer.getHandler(tag);
    if (!entry || !this.running) return;

    const list = this.queues.get(entry.queue);
    if (!list || list.length === 0) {
      setTimeout(() => this.drain(tag), 50);
      return;
    }

    const msg = list.shift()!;
    this.queues.set(entry.queue, list);

    const ctx: ConsumeContext = {
      message: msg,
      ack: () => {},
      nack: (requeue) => {
        if (requeue) list.unshift(msg);
      },
    };

    Promise.resolve(entry.handler(ctx)).then(
      () => setTimeout(() => this.drain(tag), 0),
      () => setTimeout(() => this.drain(tag), 0)
    );
  }
}
