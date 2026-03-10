/**
 * @Payload 消息体参数装饰器
 * 将消息体注入到处理方法对应参数
 */

import 'reflect-metadata';

const MQ_PAYLOAD_METADATA = Symbol('mq:payload');

export function Payload(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    if (propertyKey === undefined) return;
    Reflect.defineMetadata(MQ_PAYLOAD_METADATA, parameterIndex, target, propertyKey);
  };
}

export function getPayloadIndex(target: object, method: string): number | undefined {
  const value = Reflect.getMetadata(MQ_PAYLOAD_METADATA, target, method);
  return value === undefined ? undefined : (value as number);
}
