/**
 * ValueOperations - Spring Boot 风格的 String/Value 操作接口
 *
 * 对应 Spring Data Redis 的 ValueOperations<K, V>
 *
 * @example
 * ```typescript
 * const ops = redisTemplate.opsForValue();
 * await ops.set('user:1', JSON.stringify(user));
 * await ops.set('session:token', value, 1800); // 1800 秒过期
 * const val = await ops.get('user:1');
 * ```
 */
export interface ValueOperations<K, V> {
  /**
   * 设置值（不过期）
   * 对应 Spring: set(K key, V value)
   */
  set(key: K, value: V): Promise<void>;

  /**
   * 设置值（带过期时间，单位：秒）
   * 对应 Spring: set(K key, V value, long timeout, TimeUnit unit)
   */
  set(key: K, value: V, ttlSeconds: number): Promise<void>;

  /**
   * 若 key 不存在则设置值，返回是否设置成功
   * 对应 Spring: setIfAbsent(K key, V value)
   */
  setIfAbsent(key: K, value: V): Promise<boolean>;

  /**
   * 若 key 不存在则设置值（带过期时间），返回是否设置成功
   * 对应 Spring: setIfAbsent(K key, V value, long timeout, TimeUnit unit)
   */
  setIfAbsent(key: K, value: V, ttlSeconds: number): Promise<boolean>;

  /**
   * 若 key 存在则设置值，返回是否设置成功
   * 对应 Spring: setIfPresent(K key, V value)
   */
  setIfPresent(key: K, value: V): Promise<boolean>;

  /**
   * 批量设置值
   * 对应 Spring: multiSet(Map<? extends K, ? extends V> map)
   */
  multiSet(map: Map<K, V>): Promise<void>;

  /**
   * 当所有 key 均不存在时批量设置，返回是否全部设置成功
   * 对应 Spring: multiSetIfAbsent(Map<? extends K, ? extends V> map)
   */
  multiSetIfAbsent(map: Map<K, V>): Promise<boolean>;

  /**
   * 获取值
   * 对应 Spring: get(Object key)
   */
  get(key: K): Promise<V | null>;

  /**
   * 设置新值并返回旧值
   * 对应 Spring: getAndSet(K key, V value)
   */
  getAndSet(key: K, value: V): Promise<V | null>;

  /**
   * 获取并删除 key，返回旧值
   * 对应 Spring: getAndDelete(K key)
   */
  getAndDelete(key: K): Promise<V | null>;

  /**
   * 批量获取值
   * 对应 Spring: multiGet(Collection<K> keys)
   */
  multiGet(keys: K[]): Promise<(V | null)[]>;

  /**
   * 追加字符串到末尾，返回追加后的字符串长度
   * 对应 Spring: append(K key, String value)
   */
  append(key: K, value: string): Promise<number>;

  /**
   * 获取字符串长度
   * 对应 Spring: size(K key)
   */
  size(key: K): Promise<number>;

  /**
   * 自增 1，返回自增后的值
   * 对应 Spring: increment(K key)
   */
  increment(key: K): Promise<number>;

  /**
   * 自增指定步长，返回自增后的值
   * 对应 Spring: increment(K key, long delta)
   */
  increment(key: K, delta: number): Promise<number>;

  /**
   * 自减 1，返回自减后的值
   * 对应 Spring: decrement(K key)
   */
  decrement(key: K): Promise<number>;

  /**
   * 自减指定步长，返回自减后的值
   * 对应 Spring: decrement(K key, long delta)
   */
  decrement(key: K, delta: number): Promise<number>;
}
