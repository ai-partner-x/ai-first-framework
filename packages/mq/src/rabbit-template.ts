/**
 * 通用 MQ 发送模板（Spring Boot RabbitTemplate 风格 API）
 * 业务只依赖本类发消息，底层由配置决定的 IMQClient 实现（Rabbit/Memory/Kafka）
 */
import type { IMQProducer } from './types.js';
import type { Message, MessageProperties } from './types.js';
import { createMessage } from './types.js';

/** 通用 MQ 模板：convertAndSend / send，不关心底层是 Rabbit 还是 Memory */
export class MqTemplate {
  /** 默认 exchange（Rabbit 里默认 '' 表示 default exchange，routingKey=queue 名） */
  private defaultExchange = '';
  /** 默认 queue，convertAndSend(routingKey) 时若未指定 exchange 则发到该 queue（或 routingKey 即 queue） */
  private defaultQueueOrRoutingKey = '';

  constructor(
    private readonly producer: IMQProducer,
    options?: { defaultExchange?: string; defaultQueue?: string }
  ) {
    if (options?.defaultExchange !== undefined) this.defaultExchange = options.defaultExchange;
    if (options?.defaultQueue !== undefined) this.defaultQueueOrRoutingKey = options.defaultQueue;
  }

  /**
   * 等同 Spring: template.convertAndSend(routingKeyOrQueue, object)
   * 使用默认 exchange 时，routingKey 即 queue 名
   */
  convertAndSend<T>(routingKeyOrQueue: string, object: T): Promise<void> {
    return this.convertAndSendToDestination(this.defaultExchange, routingKeyOrQueue, object);
  }

  /**
   * 等同 Spring: template.convertAndSend(exchange, routingKey, object)
   */
  convertAndSendToDestination<T>(exchange: string, routingKey: string, object: T): Promise<void> {
    const msg = createMessage(object, { contentType: 'application/json' });
    const destination = exchange ? `${exchange}/${routingKey}` : routingKey;
    return this.send(destination, msg);
  }

  /**
   * 等同 Spring: template.send(routingKeyOrQueue, message)
   */
  async send<T>(routingKeyOrQueue: string, message: Message<T>): Promise<void> {
    const body = message.getBody();
    const props = message.getMessageProperties();
    const mqMessage = {
      body,
      headers: props.headers,
      timestamp: props.timestamp,
      metadata: {
        contentType: props.contentType,
        correlationId: props.correlationId,
        replyTo: props.replyTo,
        messageId: props.messageId,
      },
    };
    await this.producer.publish(routingKeyOrQueue, mqMessage, {
      contentType: props.contentType,
      correlationId: props.correlationId,
      replyTo: props.replyTo,
      persistent: props.deliveryMode === 2,
      priority: props.priority,
    });
  }

  /** 设置默认 destination（queue 或 routing key） */
  setDefaultQueue(queue: string): void {
    this.defaultQueueOrRoutingKey = queue;
  }

  setDefaultExchange(exchange: string): void {
    this.defaultExchange = exchange;
  }
}
