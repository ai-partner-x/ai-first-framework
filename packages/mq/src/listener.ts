/**
 * 通用 MQ 监听装饰器（Spring Boot @RabbitListener 风格 API）
 * 方法上标注队列，由运行时根据配置的 MQ 实现注册监听，切换 MQ 不需改业务代码
 */
import type { IMQClient } from './types.js';
import type { ConsumeContext, Message } from './types.js';
import { createMessage } from './types.js';

/** @MqListener 方法元数据 */
export interface MqListenerMetadata {
  queues: string[];
  concurrency?: string;
  id?: string;
  containerFactory?: string;
}

const LISTENER_METADATA = new Map<object, Map<string, MqListenerMetadata>>();
const LISTENER_REGISTRY = new Set<new (...args: any[]) => any>();

/**
 * 通用 MQ 监听器（等同 Spring @RabbitListener）
 * 用法: @MqListener({ queues: ['order.created'] })
 */
export function MqListener(options: { queues: string[]; concurrency?: string; id?: string }) {
  return function (
    target: object,
    propertyKey: string,
    _descriptor: PropertyDescriptor
  ): void {
    const ctor = target.constructor as new (...args: any[]) => any;
    let perClass = LISTENER_METADATA.get(target.constructor);
    if (!perClass) {
      perClass = new Map();
      LISTENER_METADATA.set(target.constructor, perClass);
    }
    perClass.set(propertyKey, {
      queues: options.queues,
      concurrency: options.concurrency,
      id: options.id,
    });

    LISTENER_REGISTRY.add(ctor);
  };
}

/** 取类上所有 @MqListener 方法 */
export function getMqListenerMetadata(target: new (...args: unknown[]) => unknown): Map<string, MqListenerMetadata> {
  return LISTENER_METADATA.get(target) ?? new Map();
}

/** Get classes that have at least one @MqListener method registered. */
export function getRegisteredMqListenerClasses(): Array<new (...args: any[]) => any> {
  return Array.from(LISTENER_REGISTRY);
}

/** 根据当前 MQ 客户端注册所有 @MqListener */
export async function registerMqListeners(
  client: IMQClient,
  beans: Array<{ constructor: new (...args: unknown[]) => unknown; instance: object }>
): Promise<string[]> {
  const tags: string[] = [];
  const consumer = client.consume;
  if (!consumer) return tags;

  for (const { constructor, instance } of beans) {
    const metaMap = getMqListenerMetadata(constructor);
    for (const [methodName, meta] of metaMap) {
      const handler = (instance as Record<string, (msg: Message<unknown> | ConsumeContext<unknown>) => void | Promise<void>>)[methodName];
      if (typeof handler !== 'function') continue;

      for (const queue of meta.queues) {
        const tag = await consumer.subscribe(
          queue,
          async (ctx: ConsumeContext<unknown>) => {
            const msg = createMessage(ctx.message.body, {
              headers: ctx.message.headers,
              timestamp: ctx.message.timestamp,
            });
            const fn = handler.bind(instance);
            try {
              if (fn.length >= 2) {
                await (fn as (msg: Message<unknown>, ctx: ConsumeContext<unknown>) => void | Promise<void>)(msg, ctx);
              } else {
                await (fn as (msg: Message<unknown>) => void | Promise<void>)(msg);
                ctx.ack();
              }
            } catch (err) {
              ctx.nack(true);
            }
          },
          { prefetch: 1, autoAck: false }
        );
        tags.push(tag);
      }
    }
  }
  return tags;
}
