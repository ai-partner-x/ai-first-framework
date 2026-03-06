import type { IMQClient } from './types.js';
import type { MqConfig } from './config.js';
import { createMqFromConfig } from './config.js';
import { MqTemplate } from './rabbit-template.js';

let globalClient: IMQClient | null = null;
let globalTemplate: MqTemplate | null = null;
let globalConfig: MqConfig | null = null;

/**
 * Create (and cache) a global MQ client + template.
 * Similar to ORM's createKyselyDatabase/getKyselyDatabase pattern.
 */
export async function createMq(config: MqConfig): Promise<{ client: IMQClient; mqTemplate: MqTemplate }> {
  const { client, mqTemplate } = await createMqFromConfig(config);
  globalClient = client;
  globalTemplate = mqTemplate;
  globalConfig = config;
  return { client, mqTemplate };
}

export function isMqInitialized(): boolean {
  return globalClient != null && globalTemplate != null;
}

export function getMqClient(): IMQClient {
  if (!globalClient) {
    throw new Error('[AI-First MQ] MQ not initialized. Call createMq() first.');
  }
  return globalClient;
}

export function getMqTemplate(): MqTemplate {
  if (!globalTemplate) {
    throw new Error('[AI-First MQ] MQ not initialized. Call createMq() first.');
  }
  return globalTemplate;
}

export function getMqConfig(): MqConfig {
  if (!globalConfig) {
    throw new Error('[AI-First MQ] MQ not initialized. Call createMq() first.');
  }
  return globalConfig;
}

export async function closeMq(): Promise<void> {
  if (globalClient) {
    await globalClient.disconnect();
  }
  globalClient = null;
  globalTemplate = null;
  globalConfig = null;
}

