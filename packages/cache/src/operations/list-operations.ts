/**
 * ListOperations - Spring Boot 风格的 List 操作接口
 *
 * 对应 Spring Data Redis 的 ListOperations<K, V>
 *
 * @example
 * ```typescript
 * const ops = redisTemplate.opsForList();
 * await ops.rightPush('queue:tasks', task);
 * const task = await ops.leftPop('queue:tasks');
 * const items = await ops.range('queue:tasks', 0, -1);
 * ```
 */
export interface ListOperations<K, V> {
  /**
   * 从左侧插入，返回列表长度
   * 对应 Spring: leftPush(K key, V value)
   */
  leftPush(key: K, value: V): Promise<number>;

  /**
   * 从左侧批量插入，返回列表长度
   * 对应 Spring: leftPushAll(K key, V... values)
   */
  leftPushAll(key: K, ...values: V[]): Promise<number>;

  /**
   * 若 key 存在则从左侧插入，返回列表长度（key 不存在时返回 0）
   * 对应 Spring: leftPushIfPresent(K key, V value)
   */
  leftPushIfPresent(key: K, value: V): Promise<number>;

  /**
   * 从右侧插入，返回列表长度
   * 对应 Spring: rightPush(K key, V value)
   */
  rightPush(key: K, value: V): Promise<number>;

  /**
   * 从右侧批量插入，返回列表长度
   * 对应 Spring: rightPushAll(K key, V... values)
   */
  rightPushAll(key: K, ...values: V[]): Promise<number>;

  /**
   * 若 key 存在则从右侧插入，返回列表长度（key 不存在时返回 0）
   * 对应 Spring: rightPushIfPresent(K key, V value)
   */
  rightPushIfPresent(key: K, value: V): Promise<number>;

  /**
   * 从左侧弹出。不传 count 时返回单个元素或 null，传入 count 时返回数组。
   * 对应 Spring: leftPop(K key) / leftPop(K key, long count)
   */
  leftPop(key: K): Promise<V | null>;
  leftPop(key: K, count: number): Promise<V[]>;
  leftPop(key: K, count?: number): Promise<V | null | V[]>;

  /**
   * 从右侧弹出。不传 count 时返回单个元素或 null，传入 count 时返回数组。
   * 对应 Spring: rightPop(K key) / rightPop(K key, long count)
   */
  rightPop(key: K): Promise<V | null>;
  rightPop(key: K, count: number): Promise<V[]>;
  rightPop(key: K, count?: number): Promise<V | null | V[]>;

  /**
   * 从一个列表右端弹出并推入另一个列表左端，返回弹出的元素
   * 对应 Spring: rightPopAndLeftPush(K sourceKey, K destinationKey)
   */
  rightPopAndLeftPush(sourceKey: K, destinationKey: K): Promise<V | null>;

  /**
   * 获取范围内的元素（0 到 -1 表示全部）
   * 对应 Spring: range(K key, long start, long end)
   */
  range(key: K, start: number, end: number): Promise<V[]>;

  /**
   * 获取列表长度
   * 对应 Spring: size(K key)
   */
  size(key: K): Promise<number>;

  /**
   * 获取指定索引的元素
   * 对应 Spring: index(K key, long index)
   */
  index(key: K, index: number): Promise<V | null>;

  /**
   * 设置指定索引的元素
   * 对应 Spring: set(K key, long index, V value)
   */
  set(key: K, index: number, value: V): Promise<void>;

  /**
   * 删除列表中指定数量与值匹配的元素，返回删除的数量
   * count > 0：从头部向尾部搜索，count < 0：从尾部向头部搜索，count = 0：删除所有匹配
   * 对应 Spring: remove(K key, long count, Object value)
   */
  remove(key: K, count: number, value: V): Promise<number>;

  /**
   * 裁剪列表，只保留 [start, end] 范围内的元素
   * 对应 Spring: trim(K key, long start, long end)
   */
  trim(key: K, start: number, end: number): Promise<void>;
}
