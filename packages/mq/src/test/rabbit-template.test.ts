import { describe, expect, it, vi } from 'vitest';
import { MqTemplate } from '../rabbit-template.js';
import { createMessage } from '../types.js';
import type { IMQProducer } from '../types.js';

describe('MqTemplate', () => {
  it('convertAndSendToDestination builds destination and publishes mapped message', async () => {
    const publish = vi.fn<Parameters<IMQProducer['publish']>, ReturnType<IMQProducer['publish']>>().mockResolvedValue();
    const producer: IMQProducer = { publish };
    const template = new MqTemplate(producer);

    await template.convertAndSendToDestination('ex', 'rk', { ok: true });

    expect(publish).toHaveBeenCalledTimes(1);
    const [destination, mqMessage, options] = publish.mock.calls[0]!;
    expect(destination).toBe('ex/rk');
    expect(mqMessage.body).toEqual({ ok: true });
    expect(options?.contentType).toBe('application/json');
  });

  it('send maps MessageProperties into MQ message + publish options', async () => {
    const publish = vi.fn<Parameters<IMQProducer['publish']>, ReturnType<IMQProducer['publish']>>().mockResolvedValue();
    const producer: IMQProducer = { publish };
    const template = new MqTemplate(producer);

    const msg = createMessage(
      { a: 1 },
      {
        contentType: 'application/json',
        headers: { h1: 'v1' },
        timestamp: 111,
        correlationId: 'cid',
        replyTo: 'reply.q',
        messageId: 'mid',
        deliveryMode: 2,
        priority: 3,
      }
    );

    await template.send('q1', msg);

    const [destination, mqMessage, options] = publish.mock.calls[0]!;
    expect(destination).toBe('q1');
    expect(mqMessage).toMatchObject({
      body: { a: 1 },
      headers: { h1: 'v1' },
      timestamp: 111,
      metadata: {
        contentType: 'application/json',
        correlationId: 'cid',
        replyTo: 'reply.q',
        messageId: 'mid',
      },
    });
    expect(options).toMatchObject({
      contentType: 'application/json',
      correlationId: 'cid',
      replyTo: 'reply.q',
      persistent: true,
      priority: 3,
    });
  });
});

