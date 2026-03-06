/**
 * @ai-first/mq - Message Queue types and interfaces
 */

/** 单条消息的通用结构 */
export interface MQMessage<T = unknown> {
  id?: string;
  body: T;
  headers?: Record<string, string>;
  timestamp?: number;
  /** 用于重试、死信等 */
  metadata?: Record<string, unknown>;
}

/** 发布选项（如持久化、优先级等） */
export interface PublishOptions {
  persistent?: boolean;
  priority?: number;
  delay?: number;
  contentType?: string;
  correlationId?: string;
  replyTo?: string;
}

/** 消费选项（如 ack 模式、预取数量等） */
export interface ConsumeOptions {
  /** 预取数量，默认 1 */
  prefetch?: number;
  /** 是否自动 ack，默认 false（建议手动 ack） */
  autoAck?: boolean;
  /** 消费者标签，便于取消订阅 */
  consumerTag?: string;
}

/** 消费上下文：用于 ack / nack / 重试 */
export interface ConsumeContext<T = unknown> {
  message: MQMessage<T>;
  ack(): void | Promise<void>;
  nack(requeue?: boolean): void | Promise<void>;
  /** 可选：延后重试（部分 MQ 支持） */
  retry?(delayMs?: number): void | Promise<void>;
}

/** 连接配置的通用部分 */
export interface MQConnectionOptions {
  /** 连接名，用于日志和 DI */
  name?: string;
  /** 连接超时（毫秒） */
  connectTimeout?: number;
  /** 重连策略 */
  reconnect?: {
    enabled?: boolean;
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
  };
}

/** RabbitMQ 连接配置 */
export interface RabbitMQConnectionOptions extends MQConnectionOptions {
  url: string;
  /** 预声明队列/交换机（连接建立后执行） */
  assert?: {
    queues?: Array<{ name: string; options?: Record<string, unknown> }>;
    exchanges?: Array<{ name: string; type: string; options?: Record<string, unknown> }>;
    bindings?: Array<{ queue: string; exchange: string; routingKey?: string }>;
  };
}

/** 连接器抽象：负责连接、断开、健康检查 */
export interface IMQConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

/** 生产者抽象：发消息 */
export interface IMQProducer {
  publish<T>(topicOrQueue: string, message: MQMessage<T>, options?: PublishOptions): Promise<void>;
  publishBatch?<T>(topicOrQueue: string, messages: MQMessage<T>[], options?: PublishOptions): Promise<void>;
}

/** 消费者抽象：订阅并处理消息 */
export interface IMQConsumer {
  subscribe<T>(
    topicOrQueue: string,
    handler: (ctx: ConsumeContext<T>) => void | Promise<void>,
    options?: ConsumeOptions
  ): Promise<string>;
  unsubscribe(consumerTag: string): Promise<void>;
}

/** MQ 客户端：聚合连接 + 生产 + 消费（可选拆成只生产/只消费） */
export interface IMQClient extends IMQConnection, IMQProducer {
  consume?: IMQConsumer;
}

// --------------- Spring Boot 对齐类型（与 org.springframework.amqp / messaging 语义一致） ---------------

/** 等同 Spring MessageProperties：头、时间戳、关联 ID、回复队列等 */
export interface MessageProperties {
  contentType?: string;
  contentEncoding?: string;
  headers?: Record<string, string>;
  timestamp?: number;
  messageId?: string;
  correlationId?: string;
  replyTo?: string;
  deliveryMode?: number; // 1 non-persistent, 2 persistent
  priority?: number;
}

/** 等同 Spring Message<T>：body + messageProperties，便于转 Java */
export interface Message<T = unknown> {
  getBody(): T;
  getMessageProperties(): MessageProperties;
}

/** 创建 Message 的工厂（Spring 里是 MessageBuilder） */
export function createMessage<T>(body: T, properties?: Partial<MessageProperties>): Message<T> {
  const messageProperties: MessageProperties = {
    contentType: 'application/json',
    timestamp: Math.floor(Date.now() / 1000),
    ...properties,
  };
  return {
    getBody: () => body,
    getMessageProperties: () => messageProperties,
  };
}
