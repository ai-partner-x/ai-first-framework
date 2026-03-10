/**
 * MQ 自动配置
 * 集成 aiko-boot 框架的 AutoConfiguration 机制
 * 
 * - 使用 createApp() 时由框架自动发现并加载
 * - 非 createApp 场景（如 Next.js）可手动调用 init()
 */

import 'reflect-metadata';
import type { MqProperties } from './MqProperties.js';
import { loadMqProperties } from './MqProperties.js';
import type { MqAdapter } from '../adapters/MqAdapter.js';
import { RabbitMqAdapter } from '../adapters/RabbitMqAdapter.js';
import { InMemoryMqAdapter } from '../adapters/InMemoryMqAdapter.js';
import { KafkaMqAdapter } from '../adapters/KafkaMqAdapter.js';
import { RocketMqAdapter } from '../adapters/RocketMqAdapter.js';
import { ConsumerContainer } from '../consumer/ConsumerContainer.js';
import { getListeners } from '../decorators/MqListener.js';
import { logger } from '../logger.js';
import {
  AutoConfiguration,
  Bean,
  ConditionalOnProperty,
  OnApplicationReady,
  OnApplicationShutdown,
  getApplicationContext,
} from '@ai-partner-x/aiko-boot/boot';
import { MqTemplate } from '../producer/MqTemplate.js';

@AutoConfiguration({ order: 150 })
@ConditionalOnProperty('mq.enabled', { matchIfMissing: true })
export class MqAutoConfiguration {
  private static adapter: MqAdapter | null = null;
  private static properties: MqProperties | null = null;
  private static initialized = false;

  @Bean()
  mqTemplate(): MqTemplate {
    return new MqTemplate();
  }

  @OnApplicationReady({ order: 100 })
  async autoInit(): Promise<void> {
    await MqAutoConfiguration.doInit();
  }

  /**
   * 应用关闭时断开 MQ 连接
   */
  @OnApplicationShutdown({ order: 100 })
  async shutdown(): Promise<void> {
    if (MqAutoConfiguration.adapter) {
      await MqAutoConfiguration.adapter.close();
      MqAutoConfiguration.adapter = null;
      MqAutoConfiguration.initialized = false;
      logger.info('MQ connection closed');
    }
  }

  /**
   * 执行初始化逻辑（供 autoInit 和手动 init 共用）
   */
  private static async doInit(): Promise<void> {
    if (this.initialized) return;
    this.properties = loadMqProperties();

    switch (this.properties.type) {
      case 'rabbitmq':
        this.adapter = new RabbitMqAdapter(this.properties);
        break;
      case 'memory':
        this.adapter = new InMemoryMqAdapter(this.properties);
        break;
      case 'kafka':
        this.adapter = new KafkaMqAdapter(this.properties);
        break;
      case 'rocketmq':
        this.adapter = new RocketMqAdapter(this.properties);
        break;
      case 'redis':
        throw new Error('Redis MQ adapter not implemented');
      default:
        throw new Error(`Unsupported MQ type: ${this.properties.type}`);
    }

    await this.adapter.connect();

    // 从框架扫描的组件中自动发现 @MqListener 方法（文档：getListeners）
    const ctx = getApplicationContext();
    if (ctx?.components) {
      for (const classes of ctx.components.values()) {
        for (const Klass of classes) {
          const metas = getListeners(Klass as new (...args: unknown[]) => unknown);
          const explicitMetas = (Klass as any).MQ_LISTENERS as Array<{ topic: string }> | undefined;
          const hasListeners = metas.length > 0 || (explicitMetas && explicitMetas.length > 0);
          if (hasListeners) {
            ConsumerContainer.registerListener(Klass as new (...args: unknown[]) => unknown);
            logger.info(`Auto-discovered MQ listener: ${Klass.name} (${metas.length || explicitMetas?.length || 0} handler(s))`);
          }
        }
      }
    }

    await ConsumerContainer.registerAll(this.adapter);
    this.initialized = true;
    logger.info('MQ starter initialized successfully');
  }

  /**
   * 手动初始化（用于 Next.js、独立脚本等非 createApp 场景）
   */
  static async init(): Promise<void> {
    await this.doInit();
  }

  static getAdapter(): MqAdapter {
    if (!this.initialized || !this.adapter) {
      throw new Error('MQ not initialized. Call MqAutoConfiguration.init() first.');
    }
    return this.adapter;
  }

  /** 重置状态（仅用于测试） */
  static resetForTesting(): void {
    this.adapter = null;
    this.properties = null;
    this.initialized = false;
  }
}
