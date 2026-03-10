/**
 * MQ 集成测试
 * 文档格式：MqMessage(topic/tag/body)、@MqListener 方法级
 */

import 'reflect-metadata';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  MqListener,
  getListeners,
  ConsumerContainer,
  MqTemplate,
  MqAutoConfiguration,
  InMemoryMqAdapter,
  loadMqProperties,
  MqMessage,
} from '../index.js';

// ============ 装饰器元数据测试（文档格式） ============

describe('MQ Decorators', () => {
  it('getListeners returns method-level listener meta', () => {
    class TestListener {
      @MqListener({ topic: 'test.queue', tag: 'add', group: 'g1' })
      handle(_data: unknown) {}
    }
    const metas = getListeners(TestListener);
    expect(metas).toHaveLength(1);
    expect(metas[0]).toMatchObject({
      topic: 'test.queue',
      tag: 'add',
      group: 'g1',
      method: 'handle',
    });
  });

  it('getListeners returns multiple methods', () => {
    class MultiListener {
      @MqListener({ topic: 'q1' })
      onA(_: unknown) {}
      @MqListener({ topic: 'q2', tag: 't2' })
      onB(_: unknown) {}
    }
    const metas = getListeners(MultiListener);
    expect(metas).toHaveLength(2);
    expect(metas[0].topic).toBe('q1');
    expect(metas[1].topic).toBe('q2');
  });
});

// ============ 发布/消费集成测试 ============

interface TestEvent {
  id: string;
  value: number;
}

const received: TestEvent[] = [];

class TestEventListener {
  @MqListener({ topic: 'test.events', tag: 'evt' })
  async onEvent(event: TestEvent): Promise<void> {
    received.push(event);
  }
}

describe('MQ Publish/Consume', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    received.length = 0;
    process.env = { ...originalEnv, MQ_TYPE: 'memory' };
    ConsumerContainer.clearListenersForTesting();
    MqAutoConfiguration.resetForTesting();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('publishes and consumes via InMemoryMqAdapter', async () => {
    const props = loadMqProperties();
    expect(props.type).toBe('memory');

    const adapter = new InMemoryMqAdapter(props);
    await adapter.connect();

    ConsumerContainer.registerListener(TestEventListener);
    await ConsumerContainer.registerAll(adapter);

    const payload: TestEvent = { id: 'evt-1', value: 42 };
    await adapter.send('test.events', payload);

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(payload);

    await adapter.close();
  });

  it('MqTemplate send(topic, body)', async () => {
    process.env.MQ_TYPE = 'memory';
    ConsumerContainer.registerListener(TestEventListener);

    await MqAutoConfiguration.init();

    const template = new MqTemplate();
    const payload: TestEvent = { id: 'evt-2', value: 100 };
    await template.send('test.events', payload);

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(payload);

    const adapter = MqAutoConfiguration.getAdapter();
    await adapter.close();
  });

  it('MqTemplate send(topic, tag, body)', async () => {
    process.env.MQ_TYPE = 'memory';
    ConsumerContainer.registerListener(TestEventListener);

    await MqAutoConfiguration.init();

    const template = new MqTemplate();
    await template.send('test.events', 'evt', { id: 'evt-3', value: 200 });

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ id: 'evt-3', value: 200 });

    const adapter = MqAutoConfiguration.getAdapter();
    await adapter.close();
  });

  it('MqTemplate send(MqMessage)', async () => {
    process.env.MQ_TYPE = 'memory';
    ConsumerContainer.registerListener(TestEventListener);

    await MqAutoConfiguration.init();

    const template = new MqTemplate();
    const msg: MqMessage<TestEvent> = {
      topic: 'test.events',
      tag: 'x',
      body: { id: 'evt-4', value: 300 },
    };
    await template.send(msg);

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(msg.body);

    const adapter = MqAutoConfiguration.getAdapter();
    await adapter.close();
  });
});

// ============ 错误场景测试 ============

class FailingEventListener {
  @MqListener({ topic: 'test.failing' })
  async onFail(_event: TestEvent): Promise<void> {
    throw new Error('intentional failure');
  }
}

describe('MQ Error Scenarios', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, MQ_TYPE: 'memory' };
    ConsumerContainer.clearListenersForTesting();
    MqAutoConfiguration.resetForTesting();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('handler throws - message moves to DLQ after max retries', async () => {
    const props = loadMqProperties();
    const adapter = new InMemoryMqAdapter(props);
    await adapter.connect();

    ConsumerContainer.registerListener(FailingEventListener);
    await ConsumerContainer.registerAll(adapter);

    await adapter.send('test.failing', { id: 'fail-1', value: 1 });

    const dlq = adapter.getDlqMessages('test.failing.dlq');
    expect(dlq).toHaveLength(1);
    expect(dlq[0].payload).toEqual({ id: 'fail-1', value: 1 });
    expect(dlq[0].retryCount).toBe(3);

    await adapter.close();
  });

  it('getAdapter before init throws', () => {
    expect(() => MqAutoConfiguration.getAdapter()).toThrow(
      'MQ not initialized. Call MqAutoConfiguration.init() first.'
    );
  });

  it('production with default credentials logs warning', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    process.env.MQ_USERNAME = '';
    process.env.MQ_PASSWORD = '';

    loadMqProperties();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Using default credentials')
    );

    process.env.NODE_ENV = prev;
    delete process.env.MQ_USERNAME;
    delete process.env.MQ_PASSWORD;

    warnSpy.mockRestore();
  });

  it('RabbitMqAdapter send without connect throws', async () => {
    const { RabbitMqAdapter } = await import('../adapters/RabbitMqAdapter.js');
    const props = loadMqProperties();
    props.type = 'rabbitmq';
    const adapter = new RabbitMqAdapter(props);
    await expect(adapter.send('q', {})).rejects.toThrow('Channel not initialized');
  });
});
