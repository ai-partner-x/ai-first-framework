/**
 * @ai-partner-x/aiko-boot-starter-mq
 * 文档格式：MqSender、MqMessage(topic/tag/key/body)、@MqListener 方法级
 */

// Core (文档 3.1-3.5)
export { MqException } from './core/MqException.js';
export { MqErrorHandler } from './core/MqErrorHandler.js';
export { MqSerializer } from './core/MqSerializer.js';
export type { MqMessage } from './core/MqMessage.js';
export type { MqSender } from './core/MqSender.js';

// Config
export type { MqProperties } from './config/MqProperties.js';
export { loadMqProperties } from './config/MqProperties.js';
export { MqAutoConfiguration } from './config/MqAutoConfiguration.js';

// Decorators (文档 四)
export { MqListener, getListeners } from './decorators/MqListener.js';
export type { MqListenerMeta, MqListenerOptions } from './decorators/MqListener.js';

// Producer
export { MqTemplate } from './producer/MqTemplate.js';

// Consumer
export type { MessageListener } from './consumer/MessageListener.js';
export { ConsumerContainer } from './consumer/ConsumerContainer.js';

// Adapters
export type { MqAdapter, WireMessage, MqConsumeOptions } from './adapters/MqAdapter.js';
export { RabbitMqAdapter } from './adapters/RabbitMqAdapter.js';
export { KafkaMqAdapter } from './adapters/KafkaMqAdapter.js';
export { RocketMqAdapter } from './adapters/RocketMqAdapter.js';
export { InMemoryMqAdapter } from './adapters/InMemoryMqAdapter.js';

// Logger
export { logger } from './logger.js';
