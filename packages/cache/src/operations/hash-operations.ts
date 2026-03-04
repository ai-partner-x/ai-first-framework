/**
 * HashOperations - Spring Boot 风格的 Hash 操作接口
 *
 * 对应 Spring Data Redis 的 HashOperations<K, HK, HV>
 *
 * @example
 * ```typescript
 * const ops = redisTemplate.opsForHash<string, string>();
 * await ops.put('user:1', 'name', '张三');
 * await ops.putAll('user:1', new Map([['name', '张三'], ['email', 'zs@example.com']]));
 * const name = await ops.get('user:1', 'name');
 * const all = await ops.entries('user:1');
 * ```
 */
export interface HashOperations<K, HK, HV> {
  /**
   * 获取 Hash 中指定字段的值
   * 对应 Spring: get(H key, Object hashKey)
   */
  get(key: K, hashKey: HK): Promise<HV | null>;

  /**
   * 批量获取 Hash 中指定字段的值
   * 对应 Spring: multiGet(H key, Collection<HK> hashKeys)
   */
  multiGet(key: K, hashKeys: HK[]): Promise<(HV | null)[]>;

  /**
   * 获取 Hash 中所有字段和值
   * 对应 Spring: entries(H key)
   */
  entries(key: K): Promise<Map<HK, HV>>;

  /**
   * 获取 Hash 中所有字段名
   * 对应 Spring: keys(H key)
   */
  keys(key: K): Promise<HK[]>;

  /**
   * 获取 Hash 中所有值
   * 对应 Spring: values(H key)
   */
  values(key: K): Promise<HV[]>;

  /**
   * 设置 Hash 中指定字段的值
   * 对应 Spring: put(H key, HK hashKey, HV value)
   */
  put(key: K, hashKey: HK, value: HV): Promise<void>;

  /**
   * 批量设置 Hash 中字段的值
   * 对应 Spring: putAll(H key, Map<? extends HK, ? extends HV> m)
   */
  putAll(key: K, map: Map<HK, HV>): Promise<void>;

  /**
   * 若字段不存在则设置值，返回是否设置成功
   * 对应 Spring: putIfAbsent(H key, HK hashKey, HV value)
   */
  putIfAbsent(key: K, hashKey: HK, value: HV): Promise<boolean>;

  /**
   * 删除 Hash 中指定字段，返回删除的数量
   * 对应 Spring: delete(H key, Object... hashKeys)
   */
  delete(key: K, ...hashKeys: HK[]): Promise<number>;

  /**
   * 判断 Hash 中指定字段是否存在
   * 对应 Spring: hasKey(H key, Object hashKey)
   */
  hasKey(key: K, hashKey: HK): Promise<boolean>;

  /**
   * 获取 Hash 字段数量
   * 对应 Spring: size(H key)
   */
  size(key: K): Promise<number>;

  /**
   * Hash 字段数值自增，返回自增后的值
   * 对应 Spring: increment(H key, HK hashKey, long delta)
   */
  increment(key: K, hashKey: HK, delta: number): Promise<number>;

  /**
   * Hash 字段数值自增（浮点），返回自增后的值
   * 对应 Spring: increment(H key, HK hashKey, double delta)
   */
  incrementFloat(key: K, hashKey: HK, delta: number): Promise<number>;
}
