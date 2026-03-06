import { describe, expect, it, vi } from 'vitest';
import {
  MqListener,
  getMqListenerMetadata,
  getRegisteredMqListenerClasses,
  registerMqListeners,
} from '../listener.js';
import { MemoryMQClient } from '../adapter/memory-adapter.js';
import type { Message, ConsumeContext } from '../types.js';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

describe('@MqListener metadata', () => {
  it('stores metadata per class method', () => {
    class A {
      @MqListener({ queues: ['q1'], id: 'id1' })
      onMsg(_m: Message) {}
    }

    const meta = getMqListenerMetadata(A);
    expect(meta.get('onMsg')).toMatchObject({ queues: ['q1'], id: 'id1' });
    expect(getRegisteredMqListenerClasses()).toContain(A);
  });
});

describe('registerMqListeners', () => {
  it('auto-acks (calls ack) for single-arg handlers and requeues on thrown error', async () => {
    const client = new MemoryMQClient();
    await client.connect();

    const calls: any[] = [];
    let first = true;

    class L {
      @MqListener({ queues: ['q1'] })
      async onMsg(msg: Message<{ n: number }>) {
        calls.push(msg.getBody().n);
        if (first) {
          first = false;
          throw new Error('boom');
        }
      }
    }

    await registerMqListeners(client, [{ constructor: L, instance: new L() }]);

    await client.publish('q1', { body: { n: 1 } });
    await sleep(220);

    // first run throws -> wrapper nack(true) requeue; second run succeeds
    expect(calls).toEqual([1, 1]);
  });

  it('passes (msg, ctx) to two-arg handlers without auto-acking', async () => {
    const client = new MemoryMQClient();
    await client.connect();

    const received: number[] = [];

    class L {
      @MqListener({ queues: ['q1'] })
      async onMsg(msg: Message<{ n: number }>, ctx: ConsumeContext<{ n: number }>) {
        received.push(msg.getBody().n);
        // explicit ack should be allowed
        await ctx.ack();
      }
    }

    await registerMqListeners(client, [{ constructor: L, instance: new L() }]);
    await client.publish('q1', { body: { n: 2 } });

    await sleep(120);
    expect(received).toEqual([2]);
  });
});

