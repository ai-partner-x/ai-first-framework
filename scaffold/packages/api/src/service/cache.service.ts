import 'reflect-metadata';
import { Service } from '@ai-partner-x/aiko-boot';
import type { CacheManager } from '@ai-partner-x/aiko-boot-starter-cache';
import { getCacheManager, isCacheManagerInitialized } from '@ai-partner-x/aiko-boot-starter-cache';
import type { CacheGetDto, CachePutDto, CacheEvictDto, CacheClearDto } from '../dto/cache.dto.js';

@Service()
export class CacheService {
  private getCacheManagerInstance(): CacheManager {
    if (!isCacheManagerInitialized()) {
      throw new Error('Cache is not initialized. Enable cache in app.config.ts and ensure Redis is running.');
    }
    return getCacheManager();
  }

  /**
   * 获取缓存值
   * @param name 缓存命名空间
   * @param key 缓存键
   * @returns 缓存值（JSON 字符串），未命中返回 null
   */
  async get(dto: CacheGetDto): Promise<string | null> {
    const cache = this.getCacheManagerInstance().getCache(dto.name);
    const value = await cache.get(dto.key);
    return value;
  }

  /**
   * 设置缓存值
   * @param name 缓存命名空间
   * @param key 缓存键
   * @param value 缓存值（任意类型，会自动序列化为 JSON 字符串存储）
   * @param ttlSeconds 可选过期时间（秒）
   */
  async put(dto: CachePutDto): Promise<void> {
    if (dto.value === undefined) {
      throw new Error('Cache value is required and must be JSON-serializable.');
    }

    let value: string;
    try {
      value = JSON.stringify(dto.value);
    } catch (err) {
      throw new Error('Cache value is not JSON-serializable.');
    }
    const cache = this.getCacheManagerInstance().getCache(dto.name);
    await cache.put(dto.key, value, dto.ttlSeconds);
  }

  /**
   * 删除缓存条目
   * @param name 缓存命名空间
   * @param key 缓存键
   * @param allEntries 是否清除所有条目
   */
  async evict(dto: CacheEvictDto): Promise<void> {
    const cache = this.getCacheManagerInstance().getCache(dto.name);
    if (dto.allEntries) {
      await cache.clear();
    } else {
      await cache.evict(dto.key);
    }
  }

  /**
   * 清空缓存命名空间
   * @param name 缓存命名空间
   */
  async clear(dto: CacheClearDto): Promise<void> {
    const cache = this.getCacheManagerInstance().getCache(dto.name);
    await cache.clear();
  }

  /**
   * 检查缓存是否已初始化
   */
  isInitialized(): boolean {
    return isCacheManagerInitialized();
  }
}
