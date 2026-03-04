/**
 * ZSetOperations - Spring Boot 风格的有序集合操作接口
 *
 * 对应 Spring Data Redis 的 ZSetOperations<K, V>
 *
 * @example
 * ```typescript
 * const ops = redisTemplate.opsForZSet<string, string>();
 * await ops.add('leaderboard', 'player1', 100);
 * await ops.add('leaderboard', 'player2', 200);
 * const top3 = await ops.reverseRange('leaderboard', 0, 2);
 * const score = await ops.score('leaderboard', 'player1');
 * ```
 */

/** 带分数的有序集合成员 */
export interface TypedTuple<V> {
  value: V;
  score: number;
}

export interface ZSetOperations<K, V> {
  /**
   * 添加元素（带分数），返回是否新增（已存在则更新分数返回 false）
   * 对应 Spring: add(K key, V value, double score)
   */
  add(key: K, value: V, score: number): Promise<boolean>;

  /**
   * 批量添加元素，返回新增元素的数量
   * 对应 Spring: add(K key, Set<TypedTuple<V>> tuples)
   */
  addAll(key: K, tuples: TypedTuple<V>[]): Promise<number>;

  /**
   * 移除一个或多个元素，返回移除的数量
   * 对应 Spring: remove(K key, Object... values)
   */
  remove(key: K, ...values: V[]): Promise<number>;

  /**
   * 移除分数在 [min, max] 范围内的元素，返回移除的数量
   * 对应 Spring: removeRangeByScore(K key, double min, double max)
   */
  removeRangeByScore(key: K, min: number, max: number): Promise<number>;

  /**
   * 移除排名在 [start, end] 范围内的元素，返回移除的数量
   * 对应 Spring: removeRange(K key, long start, long end)
   */
  removeRange(key: K, start: number, end: number): Promise<number>;

  /**
   * 获取排名在 [start, end] 范围内的元素（升序）
   * 对应 Spring: range(K key, long start, long end)
   */
  range(key: K, start: number, end: number): Promise<V[]>;

  /**
   * 获取排名在 [start, end] 范围内的元素及其分数（升序）
   * 对应 Spring: rangeWithScores(K key, long start, long end)
   */
  rangeWithScores(key: K, start: number, end: number): Promise<TypedTuple<V>[]>;

  /**
   * 获取分数在 [min, max] 范围内的元素（升序）
   * 对应 Spring: rangeByScore(K key, double min, double max)
   */
  rangeByScore(key: K, min: number, max: number): Promise<V[]>;

  /**
   * 获取分数在 [min, max] 范围内的元素及其分数（升序）
   * 对应 Spring: rangeByScoreWithScores(K key, double min, double max)
   */
  rangeByScoreWithScores(key: K, min: number, max: number): Promise<TypedTuple<V>[]>;

  /**
   * 获取排名在 [start, end] 范围内的元素（降序）
   * 对应 Spring: reverseRange(K key, long start, long end)
   */
  reverseRange(key: K, start: number, end: number): Promise<V[]>;

  /**
   * 获取排名在 [start, end] 范围内的元素及其分数（降序）
   * 对应 Spring: reverseRangeWithScores(K key, long start, long end)
   */
  reverseRangeWithScores(key: K, start: number, end: number): Promise<TypedTuple<V>[]>;

  /**
   * 获取分数在 [min, max] 范围内的元素（降序）
   * 对应 Spring: reverseRangeByScore(K key, double min, double max)
   */
  reverseRangeByScore(key: K, min: number, max: number): Promise<V[]>;

  /**
   * 获取分数在 [min, max] 范围内的元素及其分数（降序）
   * 对应 Spring: reverseRangeByScoreWithScores(K key, double min, double max)
   */
  reverseRangeByScoreWithScores(key: K, min: number, max: number): Promise<TypedTuple<V>[]>;

  /**
   * 获取元素的分数，不存在返回 null
   * 对应 Spring: score(K key, Object o)
   */
  score(key: K, value: V): Promise<number | null>;

  /**
   * 获取元素的升序排名（0-based），不存在返回 null
   * 对应 Spring: rank(K key, Object o)
   */
  rank(key: K, value: V): Promise<number | null>;

  /**
   * 获取元素的降序排名（0-based），不存在返回 null
   * 对应 Spring: reverseRank(K key, Object o)
   */
  reverseRank(key: K, value: V): Promise<number | null>;

  /**
   * 获取分数在 [min, max] 范围内的元素数量
   * 对应 Spring: count(K key, double min, double max)
   */
  count(key: K, min: number, max: number): Promise<number>;

  /**
   * 获取有序集合的成员数量
   * 对应 Spring: size(K key) / zCard(K key)
   */
  size(key: K): Promise<number>;

  /**
   * 对指定元素的分数增加 delta，返回增加后的分数
   * 对应 Spring: incrementScore(K key, V value, double delta)
   */
  incrementScore(key: K, value: V, delta: number): Promise<number>;

  /**
   * 求多个有序集合的交集并存储，返回目标集合大小
   * 对应 Spring: intersectAndStore(K key, K otherKey, K destKey)
   */
  intersectAndStore(key: K, otherKey: K, destKey: K): Promise<number>;

  /**
   * 求多个有序集合的并集并存储，返回目标集合大小
   * 对应 Spring: unionAndStore(K key, K otherKey, K destKey)
   */
  unionAndStore(key: K, otherKey: K, destKey: K): Promise<number>;
}
