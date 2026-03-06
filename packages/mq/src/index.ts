/**
 * @ai-first/mq
 * Spring Boot 风格 MQ：MqTemplate + @MqListener，配置切换实现（rabbit/memory），业务代码不变
 */

export type {
  MQMessage,
  PublishOptions,
  ConsumeOptions,
  ConsumeContext,
  MQConnectionOptions,
  RabbitMQConnectionOptions,
  IMQConnection,
  IMQProducer,
  IMQConsumer,
  IMQClient,
  MessageProperties,
  Message,
} from './types.js';

export { createMessage } from './types.js';

export { MemoryMQClient } from './adapter/memory-adapter.js';
export { createRabbitMQClient } from './adapter/rabbit-adapter.js';

export { MqTemplate } from './rabbit-template.js';

export {
  MqListener,
  getRegisteredMqListenerClasses,
  getMqListenerMetadata,
  registerMqListeners,
  type MqListenerMetadata,
} from './listener.js';

export {
  createMqFromConfig,
  type MqConfig,
  type MqConfigType,
} from './config.js';

export {
  createMq,
  getMqClient,
  getMqTemplate,
  getMqConfig,
  closeMq,
  isMqInitialized,
} from './factory.js';
