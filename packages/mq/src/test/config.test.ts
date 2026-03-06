import { describe, expect, it } from 'vitest';
import { createMqFromConfig } from '../config.js';
import { MemoryMQClient } from '../adapter/memory-adapter.js';

describe('createMqFromConfig', () => {
  it('creates memory client and connects', async () => {
    const { client, mqTemplate } = await createMqFromConfig({
      type: 'memory',
      defaultQueue: 'q1',
    });

    expect(client).toBeInstanceOf(MemoryMQClient);
    expect(client.isConnected()).toBe(true);
    expect(mqTemplate).toBeTruthy();
  });

  it('throws if type=rabbit without rabbit config', async () => {
    await expect(createMqFromConfig({ type: 'rabbit' } as any)).rejects.toThrow(
      'MQ config: type=rabbit requires config.rabbit'
    );
  });

  it('throws on unknown type', async () => {
    await expect(createMqFromConfig({ type: 'xxx' } as any)).rejects.toThrow('MQ config: unknown type "xxx"');
  });
});

