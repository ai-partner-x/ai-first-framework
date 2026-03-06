/**
 * @ai-first/mq/di
 * DI integration for @ai-first/mq (Spring Boot auto-config style).
 *
 * - Create MQ from config
 * - Register MQ beans into @ai-first/di Container
 * - Auto-register @MqListener handlers
 */

import 'reflect-metadata';
import { Container } from '@ai-first/di';
import { Injectable, Singleton, inject } from '@ai-first/di/server';
import type { IMQClient } from './types.js';
import { MqTemplate } from './rabbit-template.js';
import { createMqFromConfig, type MqConfig } from './config.js';
import { getRegisteredMqListenerClasses, registerMqListeners } from './listener.js';

/** Token for injecting MQ client by interface-like key */
export const MQ_CLIENT_TOKEN = 'IMQClient' as const;
/** Token for injecting MqTemplate */
export const MQ_TEMPLATE_TOKEN = MqTemplate;

export interface InitMqOptions {
  /**
   * Listener classes to resolve from DI and register.
   * The class methods should be decorated with @MqListener.
   */
  listeners?: Array<new (...args: any[]) => any>;
}

/**
 * @MqProducer class decorator (DI-only entry).
 * Designed for apps that use @ai-first/di.
 */
export function MqProducer() {
  return function <T extends { new (...args: any[]): any }>(target: T): T {
    const paramTypes = Reflect.getMetadata('design:paramtypes', target) || [];
    paramTypes.forEach((type: any, index: number) => {
      inject(type)(target, undefined as any, index);
    });

    Injectable()(target);
    Singleton()(target);
    return target;
  };
}

/**
 * Initialize MQ and register it into DI container.
 * Switching MQ implementation only changes config, not business code.
 */
export async function initMqAndRegister(
  config: MqConfig,
  options: InitMqOptions = {}
): Promise<{
  client: IMQClient;
  mqTemplate: MqTemplate;
  consumerTags: string[];
  shutdown: () => Promise<void>;
}> {
  const { client, mqTemplate } = await createMqFromConfig(config);

  // Register into DI as singletons
  Container.registerInstance(MQ_CLIENT_TOKEN, client);
  Container.registerInstance(MQ_TEMPLATE_TOKEN, mqTemplate);

  // Resolve listeners from DI and register
  const listenerCtors = options.listeners ?? getRegisteredMqListenerClasses();
  const beans = listenerCtors.map((ctor) => ({
    constructor: ctor,
    instance: Container.resolve(ctor),
  }));

  const consumerTags = await registerMqListeners(client, beans);

  return {
    client,
    mqTemplate,
    consumerTags,
    shutdown: async () => {
      await client.disconnect();
    },
  };
}

