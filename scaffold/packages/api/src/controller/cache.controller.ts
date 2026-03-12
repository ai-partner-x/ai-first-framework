import 'reflect-metadata';
import { RestController, PostMapping, DeleteMapping, GetMapping, RequestBody, RequestParam } from '@ai-partner-x/aiko-boot-starter-web';
import { Autowired } from '@ai-partner-x/aiko-boot';
import { CacheService } from '../service/cache.service.js';
import type { CacheGetDto, CachePutDto, CacheEvictDto, CacheClearDto } from '../dto/cache.dto.js';

/**
 * Cache 控制器
 *
 * 提供缓存的 CRUD 操作接口
 * 注意：需要在 app.config.ts 中启用 cache 并配置 Redis 连接
 */
@RestController({ path: '/cache' })
export class CacheController {
  @Autowired()
  private cacheService!: CacheService;

  /**
   * 获取缓存值
   * @example
   * curl "http://localhost:3001/api/cache/get?name=user&key=1"
   */
  @GetMapping('/get')
  async get(
    @RequestParam('name') name: string,
    @RequestParam('key') key: string,
  ): Promise<{ value: string | null }> {
    const value = await this.cacheService.get({ name, key });
    return { value };
  }

  /**
   * 设置缓存值
   * @example
   * curl -X POST http://localhost:3001/api/cache/put \
   *   -H "Content-Type: application/json" \
   *   -d '{"name":"user","key":"1","value":{"id":1,"name":"张三"},"ttlSeconds":300}'
   */
  @PostMapping('/put')
  async put(@RequestBody() dto: CachePutDto): Promise<{ ok: boolean }> {
    await this.cacheService.put(dto);
    return { ok: true };
  }

  /**
   * 删除缓存条目
   * @example
   * curl -X DELETE "http://localhost:3001/api/cache/evict?name=user&key=1"
   */
  @DeleteMapping('/evict')
  async evict(
    @RequestParam('name') name: string,
    @RequestParam('key') key: string,
    @RequestParam('allEntries') allEntries?: string,
  ): Promise<{ ok: boolean }> {
    const normalizedAllEntries =
      typeof allEntries === 'string' ? allEntries === 'true' : undefined;
    await this.cacheService.evict({ name, key, allEntries: normalizedAllEntries });
    return { ok: true };
  }

  /**
   * 清空缓存命名空间
   * @example
   * curl -X DELETE "http://localhost:3001/api/cache/clear?name=user"
   */
  @DeleteMapping('/clear')
  async clear(@RequestParam('name') name: string): Promise<{ ok: boolean }> {
    await this.cacheService.clear({ name });
    return { ok: true };
  }

  /**
   * 检查缓存状态
   * @example
   * curl "http://localhost:3001/api/cache/status"
   */
  @GetMapping('/status')
  async status(): Promise<{ initialized: boolean }> {
    return { initialized: this.cacheService.isInitialized() };
  }
}
