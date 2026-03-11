/**
 * IORedisAdapter - 基于 ioredis 的 Redis 适配器
 *
 * 将 Spring Boot 风格的 RedisTemplate API 映射到 ioredis 原生命令
 */

import type Redis from 'ioredis';
import type { ValueOperations } from '../operations/value-operations.js';
import type { ListOperations } from '../operations/list-operations.js';
import type { HashOperations } from '../operations/hash-operations.js';
import type { SetOperations } from '../operations/set-operations.js';
import type { ZSetOperations, TypedTuple } from '../operations/zset-operations.js';

// ==================== Serializer ====================

/** 序列化器接口 */
export interface RedisSerializer<T> {
  serialize(value: T): string;
  deserialize(raw: string): T;
}

/** 默认 JSON 序列化器（非字符串类型） */
const jsonSerializer: RedisSerializer<unknown> = {
  serialize: (v) => JSON.stringify(v),
  deserialize: (s) => JSON.parse(s) as unknown,
};

/** 字符串透传序列化器 */
const stringSerializer: RedisSerializer<string> = {
  serialize: (v) => v,
  deserialize: (s) => s,
};

function defaultSerializer<T>(): RedisSerializer<T> {
  return jsonSerializer as RedisSerializer<T>;
}

// ==================== IORedisAdapter ====================

export interface IORedisAdapterOptions<K = string, V = unknown> {
  /** ioredis 实例 */
  client: Redis;
  /** key 序列化器，默认使用字符串透传 */
  keySerializer?: RedisSerializer<K>;
  /** value 序列化器，默认使用 JSON */
  valueSerializer?: RedisSerializer<V>;
}

/**
 * IORedisAdapter - 适配器核心，封装 ioredis 命令
 * 提供 Spring Boot RedisTemplate 风格的操作接口
 */
export class IORedisAdapter<K = string, V = unknown> {
  protected client: Redis;
  protected keySerializer: RedisSerializer<K>;
  protected valueSerializer: RedisSerializer<V>;

  constructor(options: IORedisAdapterOptions<K, V>) {
    this.client = options.client;
    this.keySerializer = (options.keySerializer ?? stringSerializer) as RedisSerializer<K>;
    this.valueSerializer = (options.valueSerializer ?? defaultSerializer<V>()) as RedisSerializer<V>;
  }

  protected sk(key: K): string {
    return this.keySerializer.serialize(key);
  }

  protected sv(value: V): string {
    return this.valueSerializer.serialize(value);
  }

  protected dv(raw: string | null): V | null {
    if (raw === null) return null;
    return this.valueSerializer.deserialize(raw);
  }

  /**
   * Deserialize a guaranteed non-null Redis string to V.
   * Use this instead of dv() when the caller already knows the raw value is not null,
   * to avoid the unnecessary `as V[]` forced casts in collection operations.
   */
  protected ds(raw: string): V {
    return this.valueSerializer.deserialize(raw);
  }

  // ==================== Global Key Operations ====================

  async hasKey(key: K): Promise<boolean> {
    return (await this.client.exists(this.sk(key))) > 0;
  }

  async delete(key: K | K[]): Promise<number> {
    const keys = Array.isArray(key) ? key.map(k => this.sk(k)) : [this.sk(key)];
    if (keys.length === 0) return 0;
    return this.client.del(...keys);
  }

  async expire(key: K, ttlSeconds: number): Promise<boolean> {
    return (await this.client.expire(this.sk(key), ttlSeconds)) === 1;
  }

  async expireAt(key: K, date: Date): Promise<boolean> {
    return (await this.client.expireat(this.sk(key), Math.floor(date.getTime() / 1000))) === 1;
  }

  async getExpire(key: K): Promise<number> {
    return this.client.ttl(this.sk(key));
  }

  async persist(key: K): Promise<boolean> {
    return (await this.client.persist(this.sk(key))) === 1;
  }

  async keys(pattern: string): Promise<K[]> {
    const rawKeys = await this.client.keys(pattern);
    return rawKeys.map(k => this.keySerializer.deserialize(k));
  }

  async rename(key: K, newKey: K): Promise<void> {
    await this.client.rename(this.sk(key), this.sk(newKey));
  }

  async type(key: K): Promise<string> {
    return this.client.type(this.sk(key));
  }

  // ==================== Value Operations (opsForValue) ====================

  opsForValue(): ValueOperations<K, V> {
    const adapter = this;
    return {
      async set(key: K, value: V, ttlSeconds?: number): Promise<void> {
        if (ttlSeconds !== undefined) {
          await adapter.client.set(adapter.sk(key), adapter.sv(value), 'EX', ttlSeconds);
        } else {
          await adapter.client.set(adapter.sk(key), adapter.sv(value));
        }
      },

      async setIfAbsent(key: K, value: V, ttlSeconds?: number): Promise<boolean> {
        if (ttlSeconds !== undefined) {
          const result = await adapter.client.set(adapter.sk(key), adapter.sv(value), 'EX', ttlSeconds, 'NX');
          return result === 'OK';
        }
        return (await adapter.client.setnx(adapter.sk(key), adapter.sv(value))) === 1;
      },

      async setIfPresent(key: K, value: V): Promise<boolean> {
        const result = await adapter.client.set(adapter.sk(key), adapter.sv(value), 'XX');
        return result === 'OK';
      },

      async multiSet(map: Map<K, V>): Promise<void> {
        if (map.size === 0) return;
        const args: string[] = [];
        for (const [k, v] of map) {
          args.push(adapter.sk(k), adapter.sv(v));
        }
        await adapter.client.mset(...args);
      },

      async multiSetIfAbsent(map: Map<K, V>): Promise<boolean> {
        if (map.size === 0) return true;
        const args: string[] = [];
        for (const [k, v] of map) {
          args.push(adapter.sk(k), adapter.sv(v));
        }
        return (await adapter.client.msetnx(...args)) === 1;
      },

      async get(key: K): Promise<V | null> {
        return adapter.dv(await adapter.client.get(adapter.sk(key)));
      },

      async getAndSet(key: K, value: V): Promise<V | null> {
        return adapter.dv(await adapter.client.getset(adapter.sk(key), adapter.sv(value)));
      },

      async getAndDelete(key: K): Promise<V | null> {
        const raw = await adapter.client.get(adapter.sk(key));
        if (raw !== null) {
          await adapter.client.del(adapter.sk(key));
        }
        return adapter.dv(raw);
      },

      async multiGet(keys: K[]): Promise<(V | null)[]> {
        if (keys.length === 0) return [];
        const raws = await adapter.client.mget(...keys.map(k => adapter.sk(k)));
        return raws.map(r => adapter.dv(r));
      },

      async append(key: K, value: string): Promise<number> {
        return adapter.client.append(adapter.sk(key), value);
      },

      async size(key: K): Promise<number> {
        return adapter.client.strlen(adapter.sk(key));
      },

      async increment(key: K, delta?: number): Promise<number> {
        if (delta !== undefined) {
          return adapter.client.incrby(adapter.sk(key), delta);
        }
        return adapter.client.incr(adapter.sk(key));
      },

      async decrement(key: K, delta?: number): Promise<number> {
        if (delta !== undefined) {
          return adapter.client.decrby(adapter.sk(key), delta);
        }
        return adapter.client.decr(adapter.sk(key));
      },
    };
  }

  // ==================== List Operations (opsForList) ====================

  opsForList(): ListOperations<K, V> {
    const adapter = this;

    // Use function overloads so TypeScript can verify each overload without unsafe casts
    async function leftPop(key: K): Promise<V | null>;
    async function leftPop(key: K, count: number): Promise<V[]>;
    async function leftPop(key: K, count?: number): Promise<V | null | V[]> {
      if (count !== undefined) {
        const raws = await adapter.client.lpop(adapter.sk(key), count);
        return (raws ?? []).map((r: string) => adapter.ds(r));
      }
      return adapter.dv(await adapter.client.lpop(adapter.sk(key)));
    }

    async function rightPop(key: K): Promise<V | null>;
    async function rightPop(key: K, count: number): Promise<V[]>;
    async function rightPop(key: K, count?: number): Promise<V | null | V[]> {
      if (count !== undefined) {
        const raws = await adapter.client.rpop(adapter.sk(key), count);
        return (raws ?? []).map((r: string) => adapter.ds(r));
      }
      return adapter.dv(await adapter.client.rpop(adapter.sk(key)));
    }

    return {
      async leftPush(key: K, value: V): Promise<number> {
        return adapter.client.lpush(adapter.sk(key), adapter.sv(value));
      },

      async leftPushAll(key: K, ...values: V[]): Promise<number> {
        return adapter.client.lpush(adapter.sk(key), ...values.map(v => adapter.sv(v)));
      },

      async leftPushIfPresent(key: K, value: V): Promise<number> {
        return adapter.client.lpushx(adapter.sk(key), adapter.sv(value));
      },

      async rightPush(key: K, value: V): Promise<number> {
        return adapter.client.rpush(adapter.sk(key), adapter.sv(value));
      },

      async rightPushAll(key: K, ...values: V[]): Promise<number> {
        return adapter.client.rpush(adapter.sk(key), ...values.map(v => adapter.sv(v)));
      },

      async rightPushIfPresent(key: K, value: V): Promise<number> {
        return adapter.client.rpushx(adapter.sk(key), adapter.sv(value));
      },

      leftPop,

      rightPop,

      async rightPopAndLeftPush(sourceKey: K, destinationKey: K): Promise<V | null> {
        return adapter.dv(await adapter.client.rpoplpush(adapter.sk(sourceKey), adapter.sk(destinationKey)));
      },

      async range(key: K, start: number, end: number): Promise<V[]> {
        const raws = await adapter.client.lrange(adapter.sk(key), start, end);
        return raws.map((r: string) => adapter.ds(r));
      },

      async size(key: K): Promise<number> {
        return adapter.client.llen(adapter.sk(key));
      },

      async index(key: K, index: number): Promise<V | null> {
        return adapter.dv(await adapter.client.lindex(adapter.sk(key), index));
      },

      async set(key: K, index: number, value: V): Promise<void> {
        await adapter.client.lset(adapter.sk(key), index, adapter.sv(value));
      },

      async remove(key: K, count: number, value: V): Promise<number> {
        return adapter.client.lrem(adapter.sk(key), count, adapter.sv(value));
      },

      async trim(key: K, start: number, end: number): Promise<void> {
        await adapter.client.ltrim(adapter.sk(key), start, end);
      },
    };
  }

  // ==================== Hash Operations (opsForHash) ====================

  opsForHash<HK extends string = string, HV = unknown>(): HashOperations<K, HK, HV> {
    const adapter = this;
    const hvSerializer: RedisSerializer<HV> = defaultSerializer<HV>();

    return {
      async get(key: K, hashKey: HK): Promise<HV | null> {
        const raw = await adapter.client.hget(adapter.sk(key), hashKey);
        if (raw === null) return null;
        return hvSerializer.deserialize(raw);
      },

      async multiGet(key: K, hashKeys: HK[]): Promise<(HV | null)[]> {
        if (hashKeys.length === 0) return [];
        const raws = await adapter.client.hmget(adapter.sk(key), ...hashKeys);
        return raws.map(r => (r === null ? null : hvSerializer.deserialize(r)));
      },

      async entries(key: K): Promise<Map<HK, HV>> {
        const raw = await adapter.client.hgetall(adapter.sk(key));
        const result = new Map<HK, HV>();
        for (const [hk, hv] of Object.entries(raw)) {
          result.set(hk as HK, hvSerializer.deserialize(hv));
        }
        return result;
      },

      async keys(key: K): Promise<HK[]> {
        return (await adapter.client.hkeys(adapter.sk(key))) as HK[];
      },

      async values(key: K): Promise<HV[]> {
        const raws = await adapter.client.hvals(adapter.sk(key));
        return raws.map(r => hvSerializer.deserialize(r));
      },

      async put(key: K, hashKey: HK, value: HV): Promise<void> {
        await adapter.client.hset(adapter.sk(key), hashKey, hvSerializer.serialize(value));
      },

      async putAll(key: K, map: Map<HK, HV>): Promise<void> {
        if (map.size === 0) return;
        const args: string[] = [];
        for (const [hk, hv] of map) {
          args.push(hk, hvSerializer.serialize(hv));
        }
        await adapter.client.hmset(adapter.sk(key), ...args);
      },

      async putIfAbsent(key: K, hashKey: HK, value: HV): Promise<boolean> {
        return (await adapter.client.hsetnx(adapter.sk(key), hashKey, hvSerializer.serialize(value))) === 1;
      },

      async delete(key: K, ...hashKeys: HK[]): Promise<number> {
        return adapter.client.hdel(adapter.sk(key), ...hashKeys);
      },

      async hasKey(key: K, hashKey: HK): Promise<boolean> {
        return (await adapter.client.hexists(adapter.sk(key), hashKey)) === 1;
      },

      async size(key: K): Promise<number> {
        return adapter.client.hlen(adapter.sk(key));
      },

      async increment(key: K, hashKey: HK, delta: number): Promise<number> {
        return adapter.client.hincrby(adapter.sk(key), hashKey, delta);
      },

      async incrementFloat(key: K, hashKey: HK, delta: number): Promise<number> {
        return parseFloat(await adapter.client.hincrbyfloat(adapter.sk(key), hashKey, delta));
      },
    };
  }

  // ==================== Set Operations (opsForSet) ====================

  opsForSet(): SetOperations<K, V> {
    const adapter = this;

    // Use function overloads so TypeScript can verify each overload without unsafe casts
    async function pop(key: K): Promise<V | null>;
    async function pop(key: K, count: number): Promise<V[]>;
    async function pop(key: K, count?: number): Promise<V | null | V[]> {
      if (count !== undefined) {
        const raws = await adapter.client.spop(adapter.sk(key), count);
        return (raws ?? []).map((r: string) => adapter.ds(r));
      }
      return adapter.dv(await adapter.client.spop(adapter.sk(key)));
    }

    async function isMember(key: K, value: V): Promise<boolean>;
    async function isMember(key: K, ...values: [V, ...V[]]): Promise<boolean | Map<V, boolean>>;
    async function isMember(key: K, ...values: V[]): Promise<boolean | Map<V, boolean>> {
      if (values.length === 1) {
        return (await adapter.client.sismember(adapter.sk(key), adapter.sv(values[0]))) === 1;
      }
      const results = await adapter.client.smismember(adapter.sk(key), ...values.map(v => adapter.sv(v)));
      const map = new Map<V, boolean>();
      values.forEach((v, i) => map.set(v, results[i] === 1));
      return map;
    }

    return {
      async add(key: K, ...values: V[]): Promise<number> {
        return adapter.client.sadd(adapter.sk(key), ...values.map(v => adapter.sv(v)));
      },

      async remove(key: K, ...values: V[]): Promise<number> {
        return adapter.client.srem(adapter.sk(key), ...values.map(v => adapter.sv(v)));
      },

      pop,

      async move(key: K, value: V, destKey: K): Promise<boolean> {
        return (await adapter.client.smove(adapter.sk(key), adapter.sk(destKey), adapter.sv(value))) === 1;
      },

      async members(key: K): Promise<Set<V>> {
        const raws = await adapter.client.smembers(adapter.sk(key));
        return new Set(raws.map(r => adapter.ds(r)));
      },

      isMember,

      async size(key: K): Promise<number> {
        return adapter.client.scard(adapter.sk(key));
      },

      async randomMember(key: K): Promise<V | null> {
        return adapter.dv(await adapter.client.srandmember(adapter.sk(key)));
      },

      async randomMembers(key: K, count: number): Promise<V[]> {
        if (!Number.isInteger(count) || count <= 0) throw new Error('count must be a positive integer');
        // Negative count allows duplicates in Redis SRANDMEMBER
        const raws = await adapter.client.srandmember(adapter.sk(key), -count);
        return (raws ?? []).map((r: string) => adapter.ds(r));
      },

      async distinctRandomMembers(key: K, count: number): Promise<Set<V>> {
        if (!Number.isInteger(count) || count <= 0) throw new Error('count must be a positive integer');
        // Positive count returns distinct members in Redis SRANDMEMBER
        const raws = await adapter.client.srandmember(adapter.sk(key), count);
        return new Set((raws ?? []).map((r: string) => adapter.ds(r)));
      },

      async intersect(key: K, ...otherKeys: K[]): Promise<Set<V>> {
        const raws = await adapter.client.sinter(adapter.sk(key), ...otherKeys.map(k => adapter.sk(k)));
        return new Set(raws.map(r => adapter.ds(r)));
      },

      async intersectAndStore(key: K, otherKey: K, destKey: K): Promise<number> {
        return adapter.client.sinterstore(adapter.sk(destKey), adapter.sk(key), adapter.sk(otherKey));
      },

      async union(key: K, ...otherKeys: K[]): Promise<Set<V>> {
        const raws = await adapter.client.sunion(adapter.sk(key), ...otherKeys.map(k => adapter.sk(k)));
        return new Set(raws.map(r => adapter.ds(r)));
      },

      async unionAndStore(key: K, otherKey: K, destKey: K): Promise<number> {
        return adapter.client.sunionstore(adapter.sk(destKey), adapter.sk(key), adapter.sk(otherKey));
      },

      async difference(key: K, ...otherKeys: K[]): Promise<Set<V>> {
        const raws = await adapter.client.sdiff(adapter.sk(key), ...otherKeys.map(k => adapter.sk(k)));
        return new Set(raws.map(r => adapter.ds(r)));
      },

      async differenceAndStore(key: K, otherKey: K, destKey: K): Promise<number> {
        return adapter.client.sdiffstore(adapter.sk(destKey), adapter.sk(key), adapter.sk(otherKey));
      },
    };
  }

  // ==================== ZSet Operations (opsForZSet) ====================

  opsForZSet(): ZSetOperations<K, V> {
    const adapter = this;
    return {
      async add(key: K, value: V, score: number): Promise<boolean> {
        return (await adapter.client.zadd(adapter.sk(key), score, adapter.sv(value))) === 1;
      },

      async addAll(key: K, tuples: TypedTuple<V>[]): Promise<number> {
        if (tuples.length === 0) return 0;
        // Build alternating score-member pairs (score1, member1, score2, member2, ...) for ioredis zadd
        const scoreMembers: (string | number)[] = [];
        for (const { value, score } of tuples) {
          scoreMembers.push(score, adapter.sv(value));
        }
        return adapter.client.zadd(adapter.sk(key), ...scoreMembers);
      },

      async remove(key: K, ...values: V[]): Promise<number> {
        return adapter.client.zrem(adapter.sk(key), ...values.map(v => adapter.sv(v)));
      },

      async removeRangeByScore(key: K, min: number, max: number): Promise<number> {
        return adapter.client.zremrangebyscore(adapter.sk(key), min, max);
      },

      async removeRange(key: K, start: number, end: number): Promise<number> {
        return adapter.client.zremrangebyrank(adapter.sk(key), start, end);
      },

      async range(key: K, start: number, end: number): Promise<V[]> {
        const raws = await adapter.client.zrange(adapter.sk(key), start, end);
        return raws.map(r => adapter.ds(r));
      },

      async rangeWithScores(key: K, start: number, end: number): Promise<TypedTuple<V>[]> {
        const raws = await adapter.client.zrange(adapter.sk(key), start, end, 'WITHSCORES');
        const result: TypedTuple<V>[] = [];
        for (let i = 0; i < raws.length; i += 2) {
          result.push({ value: adapter.ds(raws[i]), score: parseFloat(raws[i + 1]) });
        }
        return result;
      },

      async rangeByScore(key: K, min: number, max: number): Promise<V[]> {
        const raws = await adapter.client.zrangebyscore(adapter.sk(key), min, max);
        return raws.map(r => adapter.ds(r));
      },

      async rangeByScoreWithScores(key: K, min: number, max: number): Promise<TypedTuple<V>[]> {
        const raws = await adapter.client.zrangebyscore(adapter.sk(key), min, max, 'WITHSCORES');
        const result: TypedTuple<V>[] = [];
        for (let i = 0; i < raws.length; i += 2) {
          result.push({ value: adapter.ds(raws[i]), score: parseFloat(raws[i + 1]) });
        }
        return result;
      },

      async reverseRange(key: K, start: number, end: number): Promise<V[]> {
        const raws = await adapter.client.zrevrange(adapter.sk(key), start, end);
        return raws.map(r => adapter.ds(r));
      },

      async reverseRangeWithScores(key: K, start: number, end: number): Promise<TypedTuple<V>[]> {
        const raws = await adapter.client.zrevrange(adapter.sk(key), start, end, 'WITHSCORES');
        const result: TypedTuple<V>[] = [];
        for (let i = 0; i < raws.length; i += 2) {
          result.push({ value: adapter.ds(raws[i]), score: parseFloat(raws[i + 1]) });
        }
        return result;
      },

      async reverseRangeByScore(key: K, min: number, max: number): Promise<V[]> {
        const raws = await adapter.client.zrevrangebyscore(adapter.sk(key), max, min);
        return raws.map(r => adapter.ds(r));
      },

      async reverseRangeByScoreWithScores(key: K, min: number, max: number): Promise<TypedTuple<V>[]> {
        const raws = await adapter.client.zrevrangebyscore(adapter.sk(key), max, min, 'WITHSCORES');
        const result: TypedTuple<V>[] = [];
        for (let i = 0; i < raws.length; i += 2) {
          result.push({ value: adapter.ds(raws[i]), score: parseFloat(raws[i + 1]) });
        }
        return result;
      },

      async score(key: K, value: V): Promise<number | null> {
        const raw = await adapter.client.zscore(adapter.sk(key), adapter.sv(value));
        return raw === null ? null : parseFloat(raw);
      },

      async rank(key: K, value: V): Promise<number | null> {
        return adapter.client.zrank(adapter.sk(key), adapter.sv(value));
      },

      async reverseRank(key: K, value: V): Promise<number | null> {
        return adapter.client.zrevrank(adapter.sk(key), adapter.sv(value));
      },

      async count(key: K, min: number, max: number): Promise<number> {
        return adapter.client.zcount(adapter.sk(key), min, max);
      },

      async size(key: K): Promise<number> {
        return adapter.client.zcard(adapter.sk(key));
      },

      async incrementScore(key: K, value: V, delta: number): Promise<number> {
        return parseFloat(await adapter.client.zincrby(adapter.sk(key), delta, adapter.sv(value)));
      },

      async intersectAndStore(key: K, otherKey: K, destKey: K): Promise<number> {
        return adapter.client.zinterstore(adapter.sk(destKey), 2, adapter.sk(key), adapter.sk(otherKey));
      },

      async unionAndStore(key: K, otherKey: K, destKey: K): Promise<number> {
        return adapter.client.zunionstore(adapter.sk(destKey), 2, adapter.sk(key), adapter.sk(otherKey));
      },
    };
  }
}
