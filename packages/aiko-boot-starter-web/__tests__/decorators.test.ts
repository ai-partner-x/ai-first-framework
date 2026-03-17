/**
 * Decorators 单元测试
 * 测试 formatDate 和 applyJsonFormat 函数
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { formatDate, applyJsonFormat } from '../src/decorators';

describe('formatDate', () => {
  test('应该正确格式化日期（默认时区）', () => {
    const date = new Date('2024-01-15T10:30:45.123Z');
    const result = formatDate(date, 'yyyy-MM-dd HH:mm:ss.SSS', 'UTC');
    expect(result).toBe('2024-01-15 10:30:45.123');
  });

  test('应该正确格式化日期（指定时区）', () => {
    const date = new Date('2024-01-15T10:30:45.123Z');
    const result = formatDate(date, 'yyyy-MM-dd HH:mm:ss', 'Asia/Shanghai');
    expect(result).toBe('2024-01-15 18:30:45');
  });

  test('应该正确处理 DST 切换时点（春季切换）', () => {
    // 2024年3月10日 02:00 美国东部时间切换到 03:00 (DST 开始)
    const dateBeforeDST = new Date('2024-03-10T01:59:59-05:00');
    const resultBefore = formatDate(dateBeforeDST, 'yyyy-MM-dd HH:mm:ss.SSS', 'America/New_York');
    expect(resultBefore).toBe('2024-03-10 01:59:59.000');

    const dateAfterDST = new Date('2024-03-10T03:00:01-04:00');
    const resultAfter = formatDate(dateAfterDST, 'yyyy-MM-dd HH:mm:ss.SSS', 'America/New_York');
    expect(resultAfter).toBe('2024-03-10 03:00:01.000');
  });

  test('应该正确处理 DST 切换时点（秋季切换）', () => {
    // 2024年11月3日 02:00 美国东部时间切换回 01:00 (DST 结束)
    const dateBeforeDST = new Date('2024-11-03T01:59:59-04:00');
    const resultBefore = formatDate(dateBeforeDST, 'yyyy-MM-dd HH:mm:ss.SSS', 'America/New_York');
    expect(resultBefore).toBe('2024-11-03 01:59:59.000');

    const dateAfterDST = new Date('2024-11-03T01:00:01-05:00');
    const resultAfter = formatDate(dateAfterDST, 'yyyy-MM-dd HH:mm:ss.SSS', 'America/New_York');
    expect(resultAfter).toBe('2024-11-03 01:00:01.000');
  });

  test('应该正确处理毫秒格式化', () => {
    const date = new Date('2024-01-15T10:30:45.123Z');
    expect(formatDate(date, 'SSS', 'UTC')).toBe('123');
    expect(formatDate(date, 'S', 'UTC')).toBe('123');
  });

  test('应该正确处理单数字月份和日期', () => {
    const date = new Date('2024-01-05T08:09:05.003Z');
    expect(formatDate(date, 'M/d/H/m/s', 'UTC')).toBe('1/5/8/9/5');
  });

  test('应该正确处理年份缩写', () => {
    const date = new Date('2024-01-15T10:30:45.000Z');
    expect(formatDate(date, 'yy', 'UTC')).toBe('24');
    expect(formatDate(date, 'yyyy', 'UTC')).toBe('2024');
  });

  test('应该正确处理 24 小时制小时', () => {
    const date = new Date('2024-01-15T23:30:45.000Z');
    expect(formatDate(date, 'HH', 'UTC')).toBe('23');
    expect(formatDate(date, 'H', 'UTC')).toBe('23');
  });

  test('应该正确处理 12 小时制小时', () => {
    const date = new Date('2024-01-15T01:30:45.000Z');
    expect(formatDate(date, 'HH', 'UTC')).toBe('01');
    expect(formatDate(date, 'H', 'UTC')).toBe('1');
  });

  test('应该正确处理混合格式', () => {
    const date = new Date('2024-01-15T10:30:45.123Z');
    expect(formatDate(date, 'yyyy/MM/dd HH:mm:ss', 'UTC')).toBe('2024/01/15 10:30:45');
  });

  test('应该正确处理无效时区（回退到本地时区）', () => {
    const date = new Date('2024-01-15T10:30:45.000Z');
    expect(() => {
      formatDate(date, 'yyyy-MM-dd HH:mm:ss', 'Invalid/Timezone');
    }).not.toThrow();
  });

  test('应该正确处理 UTC 时区', () => {
    const date = new Date('2024-01-15T10:30:45.123Z');
    expect(formatDate(date, 'yyyy-MM-dd HH:mm:ss', 'UTC')).toBe('2024-01-15 10:30:45');
  });
});

describe('applyJsonFormat', () => {
  test('应该正确处理循环引用', () => {
    const obj: any = { name: 'test' };
    obj.self = obj;
    obj.child = { parent: obj };

    const result = applyJsonFormat(obj);

    expect(result).toEqual({
      name: 'test',
      self: result,
      child: {
        parent: result,
      },
    });
  });

  test('应该正确处理共享引用', () => {
    const shared = { value: 42 };
    const obj = {
      ref1: shared,
      ref2: shared,
    };

    const result = applyJsonFormat(obj);

    expect(result.ref1).toBe(result.ref2);
    expect(result.ref1.value).toBe(shared.value);
  });

  test('应该正确处理数组中的循环引用', () => {
    const arr: any[] = [1, 2, 3];
    arr.push(arr);

    const result = applyJsonFormat(arr);

    expect(result).toEqual([1, 2, 3, result]);
  });

  test('应该正确处理嵌套对象的循环引用', () => {
    const obj: any = { level1: { level2: { level3: 'value' } } };
    obj.level1.level2.self = obj.level1;

    const result = applyJsonFormat(obj);

    expect(result).toEqual({
      level1: {
        level2: {
          level3: 'value',
          self: result.level1,
        },
      },
    });
  });

  test('应该正确处理 Map 类型', () => {
    const map = new Map([
      ['key1', 'value1'],
      ['key2', 'value2'],
    ]);

    const result = applyJsonFormat(map);
    expect(result).toBe(map);
  });

  test('应该正确处理 Set 类型', () => {
    const set = new Set([1, 2, 3]);
    const result = applyJsonFormat(set);
    expect(result).toBe(set);
  });

  test('应该正确处理 Buffer 类型', () => {
    const buffer = Buffer.from('hello');
    const result = applyJsonFormat(buffer);
    expect(result).toBe(buffer);
  });

  test('应该正确处理 Uint8Array 类型', () => {
    const uint8Array = new Uint8Array([1, 2, 3, 4, 5]);
    const result = applyJsonFormat(uint8Array);
    expect(result).toBe(uint8Array);
  });

  test('应该正确处理 RegExp 类型', () => {
    const regex = /test/i;
    const result = applyJsonFormat(regex);
    expect(result).toBe(regex);
  });

  test('应该正确处理 URL 类型', () => {
    const url = new URL('https://example.com');
    const result = applyJsonFormat(url);
    expect(result).toBe(url);
  });

  test('应该正确处理 Error 类型', () => {
    const error = new Error('test error');
    const result = applyJsonFormat(error);
    expect(result).toBe(error);
  });

  test('应该正确处理 Date 类型', () => {
    const date = new Date('2024-01-15T10:30:45.000Z');
    const result = applyJsonFormat(date);
    expect(result).toBe(date);
  });

  test('应该正确处理普通对象', () => {
    const obj = {
      name: 'test',
      age: 30,
      active: true,
      scores: [1, 2, 3],
      nested: { key: 'value' },
    };

    const result = applyJsonFormat(obj);
    expect(result).toEqual(obj);
  });

  test('应该正确处理数组', () => {
    const arr = [1, 'two', true, { key: 'value' }, [4, 5]];
    const result = applyJsonFormat(arr);
    expect(result).toEqual(arr);
  });

  test('应该正确处理 null 和 undefined', () => {
    expect(applyJsonFormat(null)).toBeNull();
    expect(applyJsonFormat(undefined)).toBeUndefined();
  });

  test('应该正确处理字符串、数字、布尔值', () => {
    expect(applyJsonFormat('test')).toBe('test');
    expect(applyJsonFormat(42)).toBe(42);
    expect(applyJsonFormat(true)).toBe(true);
  });

  test('应该正确处理 toJSON 方法', () => {
    const obj = {
      name: 'test',
      value: 42,
      toJSON: function () {
        return { custom: 'format', value: this.value * 2 };
      },
    };

    const result = applyJsonFormat(obj);
    expect(result).toEqual({ custom: 'format', value: 84 });
  });

  test('应该正确处理循环引用中的 toJSON', () => {
    const obj: any = {
      name: 'test',
      value: 42,
      ref: { nested: 'value' },
    };
    obj.toJSON = function () {
      return { custom: 'format', value: this.value * 2 };
    };
    obj.ref.parent = obj;

    const result = applyJsonFormat(obj);
    expect(result).toEqual({ custom: 'format', value: 84 });
    expect(result.ref).toBeUndefined();
  });

  test('toJSON 返回包含原始对象引用的新对象时不应死循环', () => {
    // toJSON returns { self: this } — a NEW object that still references the original instance.
    // This must not cause infinite recursion / stack overflow.
    const obj: any = { name: 'test', value: 42 };
    obj.toJSON = function (this: any) {
      return { self: this, label: 'wrapped' };
    };

    expect(() => applyJsonFormat(obj)).not.toThrow();
    const result: any = applyJsonFormat(obj);
    expect(result).toBeDefined();
    expect(result.label).toBe('wrapped');
    // The self reference should resolve to some object (the placeholder / final result),
    // not trigger infinite recursion.
    expect(result.self).toBeDefined();
  });

  test('toJSON 返回 this 本身时应正常回退到标准对象处理', () => {
    // toJSON returns `this` — the cycle guard must fall through to standard handling.
    const obj: any = { name: 'fallback', value: 99 };
    obj.toJSON = function (this: any) {
      return this;
    };

    expect(() => applyJsonFormat(obj)).not.toThrow();
    const result: any = applyJsonFormat(obj);
    expect(result.name).toBe('fallback');
    expect(result.value).toBe(99);
  });

  test('toJSON 返回的新对象内部有深层对原始对象的引用时不应死循环', () => {
    // Deeper variant: toJSON returns a NEW object whose nested property references the original.
    // e.g. toJSON() => { wrapper: { inner: this } }
    const obj: any = { id: 7, label: 'deep' };
    obj.toJSON = function (this: any) {
      return { wrapper: { inner: this }, extra: 'ok' };
    };

    expect(() => applyJsonFormat(obj)).not.toThrow();
    const result: any = applyJsonFormat(obj);
    expect(result.extra).toBe('ok');
    expect(result.wrapper).toBeDefined();
    // inner resolves to the placeholder/result — must be defined, not loop.
    expect(result.wrapper.inner).toBeDefined();
  });

  test('多个对象的 toJSON 互相引用时不应死循环', () => {
    // A.toJSON references B, B.toJSON references A — mutual toJSON cycle.
    const a: any = { name: 'A' };
    const b: any = { name: 'B' };
    a.toJSON = function () { return { fromA: true, ref: b }; };
    b.toJSON = function () { return { fromB: true, ref: a }; };

    expect(() => applyJsonFormat(a)).not.toThrow();
    const result: any = applyJsonFormat(a);
    expect(result.fromA).toBe(true);
    expect(result.ref.fromB).toBe(true);
    // result.ref.ref should resolve back to the already-memoized result of a — not loop.
    expect(result.ref.ref).toBeDefined();
  });

  test('应该正确处理嵌套对象中的循环引用', () => {
    const obj: any = {
      level1: {
        level2: {
          level3: 'value',
        },
      },
    };
    obj.level1.level2.self = obj.level1;

    const result = applyJsonFormat(obj);
    expect(result.level1.level2.self).toBe(result.level1);
  });

  test('应该正确处理复杂循环引用场景', () => {
    const user: any = {
      id: 1,
      name: 'Alice',
      posts: [],
    };

    const post1: any = {
      id: 101,
      title: 'First Post',
      author: user,
      comments: [],
    };

    const post2: any = {
      id: 102,
      title: 'Second Post',
      author: user,
      comments: [],
    };

    user.posts.push(post1, post2);

    const result = applyJsonFormat(user);

    expect(result.id).toBe(1);
    expect(result.name).toBe('Alice');
    expect(result.posts.length).toBe(2);
    expect(result.posts[0].author).toBe(result);
    expect(result.posts[1].author).toBe(result);
    expect(result.posts[0]).not.toBe(result.posts[1]);
  });

  test('应该正确处理多层嵌套循环引用', () => {
    const level1: any = { name: 'level1' };
    const level2: any = { name: 'level2', parent: level1 };
    const level3: any = { name: 'level3', parent: level2 };

    level1.child = level2;
    level2.child = level3;
    level3.child = level1;

    const result = applyJsonFormat(level1);

    expect(result.name).toBe('level1');
    expect(result.child.name).toBe('level2');
    expect(result.child.child.name).toBe('level3');
    expect(result.child.child.child).toBe(result);
  });
});
