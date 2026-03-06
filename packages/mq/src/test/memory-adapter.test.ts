import { describe, expect, it, vi } from 'vitest';
import { MemoryMQClient } from '../adapter/memory-adapter.js';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

describe('MemoryMQClient', () => {
  it('throws publish when not connected', async () => {
    const client = new MemoryMQClient();
    await expect(client.publish('q1', { body: { a: 1 } })).rejects.toThrow('[MQ Memory] Not connected');
  });

  it('delivers messages FIFO to subscriber', async () => {
    const client = new MemoryMQClient();
    await client.connect();

    const received: any[] = [];
    await client.consume.subscribe('q1', async (ctx) => {
      received.push(ctx.message.body);
    });

    await client.publish('q1', { body: 1 });
    await client.publish('q1', { body: 2 });

    await sleep(120);
    expect(received).toEqual([1, 2]);
  });

  it('requeues on nack(true)', async () => {
    const client = new MemoryMQClient();
    await client.connect();

    const fn = vi.fn();
    let first = true;
    await client.consume.subscribe('q1', async (ctx) => {
      fn(ctx.message.body);
      if (first) {
        first = false;
        ctx.nack(true);
        throw new Error('fail');
      }
    });

    await client.publish('q1', { body: 'x' });

    await sleep(200);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('unsubscribe stops further delivery', async () => {
    const client = new MemoryMQClient();
    await client.connect();

    const fn = vi.fn();
    const tag = await client.consume.subscribe('q1', async (ctx) => {
      fn(ctx.message.body);
    });

    await client.publish('q1', { body: 'a' });
    await sleep(80);

    await client.consume.unsubscribe(tag);
    await client.publish('q1', { body: 'b' });
    await sleep(120);

    expect(fn.mock.calls.map((c) => c[0])).toEqual(['a']);
  });
});

