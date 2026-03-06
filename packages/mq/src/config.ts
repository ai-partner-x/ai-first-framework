/**
 * Spring Boot 风格 MQ 配置：通过 type 切换实现，业务代码不变
 * 类似 spring.rabbitmq / spring.kafka 的配置驱动
 */
import type { RabbitMQConnectionOptions } from './types.js';
import { MemoryMQClient } from './adapter/memory-adapter.js';
import { createRabbitMQClient } from './adapter/rabbit-adapter.js';
import type { IMQClient } from './types.js';
import { MqTemplate } from './rabbit-template.js';

export type MqConfigType = 'rabbit' | 'memory';

/** 统一 MQ 配置：改 type 即可切换，无需改业务代码 */
export interface MqConfig {
  type: MqConfigType;
  rabbit?: RabbitMQConnectionOptions;
  /** memory 无需额外配置 */
  memory?: Record<string, never>;
  /** 默认队列名（可选，用于 template 默认 destination） */
  defaultQueue?: string;
}

/**
 * 根据配置创建 MQ 客户端 + RabbitTemplate（Spring Boot 风格自动配置）
 */
export async function createMqFromConfig(config: MqConfig): Promise<{
  client: IMQClient;
  mqTemplate: MqTemplate;
}> {
  let client: IMQClient;

  switch (config.type) {
    case 'memory':
      client = new MemoryMQClient();
      break;
    case 'rabbit':
      if (!config.rabbit) throw new Error('MQ config: type=rabbit requires config.rabbit');
      client = createRabbitMQClient(config.rabbit);
      break;
    default:
      throw new Error(`MQ config: unknown type "${(config as MqConfig).type}"`);
  }

  await client.connect();

  const mqTemplate = new MqTemplate(client, {
    defaultQueue: config.defaultQueue,
  });

  return { client, mqTemplate };
}
