/**
 * @MqHandler 消息处理方法装饰器
 * 标记消费者类中处理消息的方法
 */

import 'reflect-metadata';

const MQ_HANDLER_METADATA = 'aiko-boot-mq:handler'; // 字符串便于跨 ESM 模块共享

const MQ_HANDLER_METHODS_KEY = 'aiko-boot-mq:handlerMethods';

export function MqHandler(): MethodDecorator {
  return (target, propertyKey) => {
    const ctor = typeof target === 'function' ? target : (target as any).constructor;
    const base = ctor ?? target;
    Reflect.defineMetadata(MQ_HANDLER_METADATA, true, target, propertyKey);
    const existing: string[] = Reflect.getMetadata(MQ_HANDLER_METHODS_KEY, base) ?? [];
    if (!existing.includes(String(propertyKey))) {
      existing.push(String(propertyKey));
    }
    Reflect.defineMetadata(MQ_HANDLER_METHODS_KEY, existing, base);
  };
}

export function getMqHandlerMethods(target: new (...args: unknown[]) => unknown): string[] {
  const fromList = Reflect.getMetadata(MQ_HANDLER_METHODS_KEY, target);
  if (Array.isArray(fromList)) return fromList;
  const proto = target.prototype;
  return Object.getOwnPropertyNames(proto).filter((method) =>
    Reflect.getMetadata(MQ_HANDLER_METADATA, proto, method)
  );
}
