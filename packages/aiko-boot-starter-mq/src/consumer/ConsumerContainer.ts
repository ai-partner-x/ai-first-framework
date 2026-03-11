/**
 * ConsumerContainer - 消费者容器
 * 文档 六 - 自动注册 @MqListener，使用 getListeners
 */

import { getListeners, type MqListenerMeta } from '../decorators/MqListener.js';
import { MqSerializer } from '../core/MqSerializer.js';
import { MqErrorHandler } from '../core/MqErrorHandler.js';
import type { MqAdapter } from '../adapters/MqAdapter.js';
import { logger } from '../logger.js';

export class ConsumerContainer {
  private static listenerClasses: (new (...args: unknown[]) => unknown)[] = [];
  private static errorHandler = new MqErrorHandler();

  static registerListener(listener: new (...args: unknown[]) => unknown): void {
    this.listenerClasses.push(listener);
  }

  static clearListenersForTesting(): void {
    this.listenerClasses = [];
  }

  static async registerAll(adapter: MqAdapter): Promise<void> {
    for (const ListenerClass of this.listenerClasses) {
      let metas = getListeners(ListenerClass);
      if (metas.length === 0 && (ListenerClass as any).MQ_LISTENERS) {
        metas = (ListenerClass as any).MQ_LISTENERS as MqListenerMeta[];
      }

      for (const meta of metas) {
        const instance = new (ListenerClass as new () => unknown)() as Record<
          string,
          (body: unknown) => Promise<unknown>
        >;
        const methodFn = instance[meta.method];
        if (typeof methodFn !== 'function') {
          logger.warn(`Method ${meta.method} not found in ${ListenerClass.name}`);
          continue;
        }

        await adapter.consume(
          meta.topic,
          async (body: unknown) => {
            try {
              const arg =
                typeof body === 'string' ? MqSerializer.fromJson(body) : body;
              await methodFn.call(instance, arg);
            } catch (e) {
              this.errorHandler.handle(
                meta.topic,
                meta.tag,
                body,
                e instanceof Error ? e : new Error(String(e))
              );
              throw e;
            }
          },
          { retry: 3, dlq: `${meta.topic}.dlq`, tag: meta.tag, group: meta.group }
        );

        logger.info(`Registered listener: ${ListenerClass.name}.${meta.method} → ${meta.topic}`);
      }
    }
  }
}
