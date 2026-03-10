/**
 * RedisTemplate - Spring Boot 风格的 Redis 操作模板
 *
 * 对应 Spring Data Redis 的 RedisTemplate<K, V>，提供标准的 Redis 操作 API。
 * 通过泛型参数支持类型安全的 key 和 value 操作。
 *
 * @example
 * ```typescript
 * // 创建 Redis 连接
 * const client = createRedisConnection({ host: 'localhost', port: 6379 });
 *
 * // 创建模板（通用类型）
 * const redisTemplate = new RedisTemplate<string, unknown>({ client });
 *
 * // 创建字符串专用模板
 * const stringRedisTemplate = new StringRedisTemplate({ client });
 *
 * // 操作 String 类型
 * const ops = redisTemplate.opsForValue();
 * await ops.set('key', { name: '张三' });
 * const val = await ops.get('key'); // { name: '张三' }
 *
 * // 操作 Hash 类型
 * const hashOps = redisTemplate.opsForHash<string, string>();
 * await hashOps.put('user:1', 'name', '张三');
 * const name = await hashOps.get('user:1', 'name'); // '张三'
 * ```
 */

import type Redis from 'ioredis';
import { IORedisAdapter, type IORedisAdapterOptions, type RedisSerializer } from './adapters/ioredis-adapter.js';
import type { ValueOperations } from './operations/value-operations.js';
import type { ListOperations } from './operations/list-operations.js';
import type { HashOperations } from './operations/hash-operations.js';
import type { SetOperations } from './operations/set-operations.js';
import type { ZSetOperations } from './operations/zset-operations.js';

export interface RedisTemplateOptions<K, V> extends IORedisAdapterOptions<K, V> {}

/**
 * RedisTemplate<K, V> - Spring Boot 风格的 Redis 操作模板
 *
 * 对应 Spring Data Redis 的 org.springframework.data.redis.core.RedisTemplate
 */
export class RedisTemplate<K = string, V = unknown> {
  protected adapter: IORedisAdapter<K, V>;

  constructor(options: RedisTemplateOptions<K, V>) {
    this.adapter = new IORedisAdapter<K, V>(options);
  }

  // ==================== 全局 Key 操作 ====================

  /**
   * 判断 key 是否存在
   * 对应 Spring: hasKey(K key)
   */
  async hasKey(key: K): Promise<boolean> {
    return this.adapter.hasKey(key);
  }

  /**
   * 删除 key（支持单个或批量）
   * 对应 Spring: delete(K key) / delete(Collection<K> keys)
   */
  async delete(key: K | K[]): Promise<number> {
    return this.adapter.delete(key);
  }

  /**
   * 设置 key 的过期时间（秒）
   * 对应 Spring: expire(K key, long timeout, TimeUnit unit)
   */
  async expire(key: K, ttlSeconds: number): Promise<boolean> {
    return this.adapter.expire(key, ttlSeconds);
  }

  /**
   * 设置 key 在指定时间点过期
   * 对应 Spring: expireAt(K key, Date date)
   */
  async expireAt(key: K, date: Date): Promise<boolean> {
    return this.adapter.expireAt(key, date);
  }

  /**
   * 获取 key 剩余过期时间（秒），-1 表示永久，-2 表示 key 不存在
   * 对应 Spring: getExpire(K key, TimeUnit timeUnit)
   */
  async getExpire(key: K): Promise<number> {
    return this.adapter.getExpire(key);
  }

  /**
   * 移除 key 的过期时间，使其永久存在
   * 对应 Spring: persist(K key)
   */
  async persist(key: K): Promise<boolean> {
    return this.adapter.persist(key);
  }

  /**
   * 根据 pattern 获取所有匹配的 key
   * 对应 Spring: keys(K pattern)
   */
  async keys(pattern: string): Promise<K[]> {
    return this.adapter.keys(pattern);
  }

  /**
   * 重命名 key
   * 对应 Spring: rename(K oldKey, K newKey)
   */
  async rename(key: K, newKey: K): Promise<void> {
    return this.adapter.rename(key, newKey);
  }

  /**
   * 获取 key 对应的数据类型
   * 对应 Spring: type(K key)
   */
  async type(key: K): Promise<string> {
    return this.adapter.type(key);
  }

  // ==================== 操作工厂方法 ====================

  /**
   * 获取 String/Value 操作对象
   * 对应 Spring: opsForValue()
   */
  opsForValue(): ValueOperations<K, V> {
    return this.adapter.opsForValue();
  }

  /**
   * 获取 List 操作对象
   * 对应 Spring: opsForList()
   */
  opsForList(): ListOperations<K, V> {
    return this.adapter.opsForList();
  }

  /**
   * 获取 Hash 操作对象
   * 对应 Spring: opsForHash()
   */
  opsForHash<HK extends string = string, HV = unknown>(): HashOperations<K, HK, HV> {
    return this.adapter.opsForHash<HK, HV>();
  }

  /**
   * 获取 Set 操作对象
   * 对应 Spring: opsForSet()
   */
  opsForSet(): SetOperations<K, V> {
    return this.adapter.opsForSet();
  }

  /**
   * 获取 ZSet（有序集合）操作对象
   * 对应 Spring: opsForZSet()
   */
  opsForZSet(): ZSetOperations<K, V> {
    return this.adapter.opsForZSet();
  }

  /**
   * 获取底层 ioredis 客户端（用于执行原生命令）
   */
  getNativeClient(): Redis {
    return this.adapter['client'] as Redis;
  }
}

// ==================== StringRedisTemplate ====================

/**
 * StringRedisTemplate - 字符串专用 Redis 模板
 *
 * 对应 Spring Data Redis 的 StringRedisTemplate（使用字符串序列化器）
 * key 和 value 都是字符串，不做 JSON 序列化
 *
 * @example
 * ```typescript
 * const stringTemplate = new StringRedisTemplate({ client });
 * await stringTemplate.opsForValue().set('name', '张三');
 * const name = await stringTemplate.opsForValue().get('name'); // '张三'
 * ```
 */
export class StringRedisTemplate extends RedisTemplate<string, string> {
  constructor(options: { client: Redis }) {
    const stringSerializer: RedisSerializer<string> = {
      serialize: (v) => v,
      deserialize: (s) => s,
    };
    super({
      client: options.client,
      keySerializer: stringSerializer,
      valueSerializer: stringSerializer,
    });
  }
}
