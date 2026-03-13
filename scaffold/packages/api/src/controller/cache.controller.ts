import 'reflect-metadata';
import { RestController, PostMapping, DeleteMapping, GetMapping, RequestBody, RequestParam } from '@ai-partner-x/aiko-boot-starter-web';
import { Autowired } from '@ai-partner-x/aiko-boot';
import { CacheService } from '../service/cache.service.js';
import type { CachePutDto } from '../dto/cache.dto.js';

/**
 * Cache 控制器
 *
 * 提供缓存的 CRUD 操作接口，仅在非生产环境下可用。
 * 注意：需要在 app.config.ts 中启用 cache 并配置 Redis 连接
 * 
 * 当 NODE_ENV=production 时，所有端点会直接抛出错误拒绝访问，
 * 防止数据泄露、缓存投毒或拒绝服务。
 */
@RestController({ path: '/cache' })
export class CacheController {
  @Autowired()
  private cacheService!: CacheService;

  private assertNonProduction(): void {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cache management endpoints are disabled in production.');
    }
  }

  /**
   * 获取缓存值
   * 
   * @example
   * curl "http://localhost:3001/api/cache/get?name=user&key=1"
   */
  @GetMapping('/get')
  async get(
    @RequestParam('name') name: string,
    @RequestParam('key') key: string,
  ): Promise<string | null> {
    this.assertNonProduction();
    return this.cacheService.get({ name, key });
  }

  /**
   * 设置缓存值
   * 
   * @example
   * curl -X POST http://localhost:3001/api/cache/put \
   *   -H "Content-Type: application/json" \
   *   -d '{"name":"user","key":"1","value":{"id":1,"name":"张三"},"ttlSeconds":300}'
   */
  @PostMapping('/put')
  async put(@RequestBody() dto: CachePutDto): Promise<{ ok: boolean }> {
    this.assertNonProduction();
    await this.cacheService.put(dto);
    return { ok: true };
  }

  /**
   * 删除缓存条目
   * 
   * @example
   * # 删除单个 key
   * curl -X DELETE "http://localhost:3001/api/cache/evict?name=user&key=1"
   * 
   * # 删除命名空间下所有条目（无需传 key）
   * curl -X DELETE "http://localhost:3001/api/cache/evict?name=user&allEntries=true"
   */
  @DeleteMapping('/evict')
  async evict(
    @RequestParam('name') name: string,
    @RequestParam('key') key?: string,
    @RequestParam('allEntries') allEntries?: string,
  ): Promise<{ ok: boolean }> {
    this.assertNonProduction();
    const isAllEntries = allEntries === 'true';
    if (!isAllEntries && !key) {
      throw new Error('Query parameter "key" is required when "allEntries" is not true.');
    }

    return { ok: true };
  }

  /**
   * 清空缓存命名空间
   * 
   * @example
   * curl -X DELETE "http://localhost:3001/api/cache/clear?name=user"
   */
  @DeleteMapping('/clear')
  async clear(@RequestParam('name') name: string): Promise<{ ok: boolean }> {
    this.assertNonProduction();
    await this.cacheService.clear({ name });
    return { ok: true };
  }

  /**
   * 检查缓存状态
   * 
   * @example
   * curl "http://localhost:3001/api/cache/status"
   */
  @GetMapping('/status')
  async status(): Promise<{ initialized: boolean }> {
    this.assertNonProduction();
    return { initialized: this.cacheService.isInitialized() };
  }
}
