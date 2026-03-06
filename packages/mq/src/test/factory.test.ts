import { describe, expect, it } from 'vitest';
import { closeMq, createMq, getMqClient, getMqTemplate, isMqInitialized } from '../factory.js';

describe('mq global factory', () => {
  it('throws getters before initialization', () => {
    expect(isMqInitialized()).toBe(false);
    expect(() => getMqClient()).toThrow('[AI-First MQ] MQ not initialized. Call createMq() first.');
    expect(() => getMqTemplate()).toThrow('[AI-First MQ] MQ not initialized. Call createMq() first.');
  });

  it('creates and caches mq instances and can close', async () => {
    const { client, mqTemplate } = await createMq({ type: 'memory' });
    expect(isMqInitialized()).toBe(true);
    expect(getMqClient()).toBe(client);
    expect(getMqTemplate()).toBe(mqTemplate);
    await closeMq();
    expect(isMqInitialized()).toBe(false);
  });
});

