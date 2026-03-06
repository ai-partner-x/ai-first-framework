import { describe, expect, it, vi } from 'vitest';
import { createMessage } from './types.js';

describe('createMessage', () => {
  it('creates message with defaults', () => {
    const before = Math.floor(Date.now() / 1000);
    const msg = createMessage({ a: 1 });
    const after = Math.floor(Date.now() / 1000);

    expect(msg.getBody()).toEqual({ a: 1 });
    const props = msg.getMessageProperties();
    expect(props.contentType).toBe('application/json');
    expect(props.timestamp).toBeTypeOf('number');
    // timestamp is seconds
    expect(props.timestamp!).toBeGreaterThanOrEqual(before);
    expect(props.timestamp!).toBeLessThanOrEqual(after);
  });

  it('merges provided properties and keeps same object reference', () => {
    const msg = createMessage('x', {
      contentType: 'text/plain',
      headers: { k: 'v' },
      correlationId: 'c1',
      replyTo: 'r1',
      messageId: 'm1',
      priority: 7,
      timestamp: 123,
    });

    const props1 = msg.getMessageProperties();
    const props2 = msg.getMessageProperties();
    expect(props1).toBe(props2);
    expect(props1).toMatchObject({
      contentType: 'text/plain',
      headers: { k: 'v' },
      correlationId: 'c1',
      replyTo: 'r1',
      messageId: 'm1',
      priority: 7,
      timestamp: 123,
    });
  });
});

