/**
 * @MqListener 消费者方法装饰器
 * 文档 四 - 完全对标 Java，方法级注解
 */

import 'reflect-metadata';

const MQ_LISTENER_KEY = 'aiko-boot-mq:listener';

export interface MqListenerMeta {
  topic: string;
  tag: string;
  group: string;
  method: string;
}

export interface MqListenerOptions {
  topic: string;
  tag?: string;
  group?: string;
}

export function MqListener(opt: MqListenerOptions): MethodDecorator {
  return (target, propertyKey) => {
    const list: MqListenerMeta[] =
      (Reflect.getMetadata(MQ_LISTENER_KEY, target.constructor) as MqListenerMeta[] | undefined) ?? [];
    list.push({
      topic: opt.topic,
      tag: opt.tag ?? '*',
      group: opt.group ?? 'default-group',
      method: String(propertyKey),
    });
    Reflect.defineMetadata(MQ_LISTENER_KEY, list, target.constructor);
  };
}

export function getListeners(target: new (...args: unknown[]) => unknown): MqListenerMeta[] {
  return (Reflect.getMetadata(MQ_LISTENER_KEY, target) as MqListenerMeta[] | undefined) ?? [];
}

