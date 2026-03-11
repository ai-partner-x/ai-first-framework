/**
 * SetOperations - Spring Boot 风格的 Set 操作接口
 *
 * 对应 Spring Data Redis 的 SetOperations<K, V>
 *
 * @example
 * ```typescript
 * const ops = redisTemplate.opsForSet<string, string>();
 * await ops.add('tags:article:1', 'redis', 'aiko-boot-starter-cache', 'nosql');
 * const tags = await ops.members('tags:article:1');
 * const hasTag = await ops.isMember('tags:article:1', 'redis');
 * ```
 */
export interface SetOperations<K, V> {
  /**
   * 向集合中添加一个或多个成员，返回成功添加的数量
   * 对应 Spring: add(K key, V... values)
   */
  add(key: K, ...values: V[]): Promise<number>;

  /**
   * 从集合中移除一个或多个成员，返回成功移除的数量
   * 对应 Spring: remove(K key, Object... values)
   */
  remove(key: K, ...values: V[]): Promise<number>;

  /**
   * 随机弹出并移除成员。不传 count 时返回单个成员或 null，传入 count 时返回数组。
   * 对应 Spring: pop(K key) / pop(K key, long count)
   */
  pop(key: K): Promise<V | null>;
  pop(key: K, count: number): Promise<V[]>;
  pop(key: K, count?: number): Promise<V | null | V[]>;

  /**
   * 将成员从一个集合移动到另一个集合，返回是否移动成功
   * 对应 Spring: move(K key, V value, K destKey)
   */
  move(key: K, value: V, destKey: K): Promise<boolean>;

  /**
   * 获取集合中所有成员
   * 对应 Spring: members(K key)
   */
  members(key: K): Promise<Set<V>>;

  /**
   * 判断成员是否在集合中。传入单个 value 返回 boolean，传入多个 value 返回 Map。
   * 对应 Spring: isMember(K key, Object o) / isMember(K key, Object... objects)
   */
  isMember(key: K, value: V): Promise<boolean>;
  isMember(key: K, ...values: V[]): Promise<boolean | Map<V, boolean>>;

  /**
   * 获取集合成员数量
   * 对应 Spring: size(K key)
   */
  size(key: K): Promise<number>;

  /**
   * 随机获取一个成员（不移除）
   * 对应 Spring: randomMember(K key)
   */
  randomMember(key: K): Promise<V | null>;

  /**
   * 随机获取多个成员（可重复，不移除）
   * 对应 Spring: randomMembers(K key, long count)
   */
  randomMembers(key: K, count: number): Promise<V[]>;

  /**
   * 随机获取多个不重复成员（不移除）
   * 对应 Spring: distinctRandomMembers(K key, long count)
   */
  distinctRandomMembers(key: K, count: number): Promise<Set<V>>;

  /**
   * 求多个集合的交集
   * 对应 Spring: intersect(K key, K otherKey) / intersect(K key, Collection<K> otherKeys)
   */
  intersect(key: K, ...otherKeys: K[]): Promise<Set<V>>;

  /**
   * 求交集并存储到目标 key，返回目标集合大小
   * 对应 Spring: intersectAndStore(K key, K otherKey, K destKey)
   */
  intersectAndStore(key: K, otherKey: K, destKey: K): Promise<number>;

  /**
   * 求多个集合的并集
   * 对应 Spring: union(K key, K otherKey) / union(K key, Collection<K> otherKeys)
   */
  union(key: K, ...otherKeys: K[]): Promise<Set<V>>;

  /**
   * 求并集并存储到目标 key，返回目标集合大小
   * 对应 Spring: unionAndStore(K key, K otherKey, K destKey)
   */
  unionAndStore(key: K, otherKey: K, destKey: K): Promise<number>;

  /**
   * 求第一个集合与其他集合的差集
   * 对应 Spring: difference(K key, K otherKey) / difference(K key, Collection<K> otherKeys)
   */
  difference(key: K, ...otherKeys: K[]): Promise<Set<V>>;

  /**
   * 求差集并存储到目标 key，返回目标集合大小
   * 对应 Spring: differenceAndStore(K key, K otherKey, K destKey)
   */
  differenceAndStore(key: K, otherKey: K, destKey: K): Promise<number>;
}
