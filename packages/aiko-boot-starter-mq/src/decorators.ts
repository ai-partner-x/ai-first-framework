/**
 * Message Queue Decorators - Spring Cloud Stream Compatible Style
 * 
 * 提供与 Spring Cloud Stream 风格兼容的装饰器，支持：
 * 1. TypeScript 运行时
 * 2. 转译为 Java Spring Cloud Stream 代码
 */

import 'reflect-metadata';
import { Injectable, Singleton, inject } from '@ai-partner-x/aiko-boot/di/server';

// ==================== Metadata Keys ====================

export const MQ_LISTENER_METADATA = 'aiko-boot:mq:listener';
export const MQ_SENDER_METADATA = 'aiko-boot:mq:sender';
export const MQ_BINDING_METADATA = 'aiko-boot:mq:binding';

// ==================== Types ====================

/** 消息监听器选项 - 对应 @StreamListener */
export interface MqListenerOptions {
  /** 绑定名称 */
  value?: string;
  /** 条件表达式 */
  condition?: string;
  /** 目标类型 */
  target?: Function;
}

/** 消息发送器选项 - 对应 @Output */
export interface MqSenderOptions {
  /** 绑定名称 */
  value?: string;
}

/** 消息绑定选项 - 对应 @EnableBinding */
export interface MqBindingOptions {
  /** 绑定接口 */
  value?: Function | Function[];
}

// ==================== Listener Decorators ====================

/**
 * @MqListener 装饰器 - 标记消息监听器方法
 */
export function MqListener(options: MqListenerOptions = {}) {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor): void {
    const existingListeners = Reflect.getMetadata(MQ_LISTENER_METADATA, target.constructor) || {};
    
    existingListeners[String(propertyKey)] = {
      ...options,
      value: options.value || `${target.constructor.name.toLowerCase()}.${String(propertyKey)}`,
      methodName: String(propertyKey),
    };
    
    Reflect.defineMetadata(MQ_LISTENER_METADATA, existingListeners, target.constructor);
  };
}

/**
 * @StreamListener 装饰器 - @MqListener 的别名
 */
export const StreamListener = MqListener;

// ==================== Sender Decorators ====================

/**
 * @MqSender 装饰器 - 标记消息发送器字段
 */
export function MqSender(options: MqSenderOptions = {}) {
  return function (target: Object, propertyKey: string | symbol): void {
    const existingSenders = Reflect.getMetadata(MQ_SENDER_METADATA, target.constructor) || {};
    
    existingSenders[String(propertyKey)] = {
      ...options,
      value: options.value || String(propertyKey),
      propertyName: String(propertyKey),
    };
    
    Reflect.defineMetadata(MQ_SENDER_METADATA, existingSenders, target.constructor);
  };
}

/**
 * @Output 装饰器 - @MqSender 的别名
 */
export const Output = MqSender;

// ==================== Binding Decorators ====================

/**
 * @MqBinding 装饰器 - 标记消息绑定类
 */
export function MqBinding(options: MqBindingOptions = {}) {
  return function <T extends { new (...args: any[]): {} }>(target: T) {
    Reflect.defineMetadata(MQ_BINDING_METADATA, {
      ...options,
      className: target.name,
    }, target);
    
    // Apply DI decorators
    Injectable()(target);
    Singleton()(target);
    
    return target;
  };
}

/**
 * @EnableBinding 装饰器 - @MqBinding 的别名
 */
export const EnableBinding = MqBinding;

// ==================== Metadata Helpers ====================

/**
 * 获取消息监听器元数据
 */
export function getMqListenerMetadata(target: Function): Record<string, MqListenerOptions & { methodName: string }> | undefined {
  return Reflect.getMetadata(MQ_LISTENER_METADATA, target);
}

/**
 * 获取消息发送器元数据
 */
export function getMqSenderMetadata(target: Function): Record<string, MqSenderOptions & { propertyName: string }> | undefined {
  return Reflect.getMetadata(MQ_SENDER_METADATA, target);
}

/**
 * 获取消息绑定元数据
 */
export function getMqBindingMetadata(target: Function): (MqBindingOptions & { className: string }) | undefined {
  return Reflect.getMetadata(MQ_BINDING_METADATA, target);
}