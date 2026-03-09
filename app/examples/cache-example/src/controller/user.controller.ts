/**
 * User Controller — Spring Boot 风格 REST API
 *
 * 所有读/写操作均经过 UserCacheService 中的缓存装饰器：
 * - GET    /api/users      → @Cacheable(user:list)
 * - GET    /api/users/:id  → @Cacheable(user)
 * - POST   /api/users      → @CacheEvict(user:list)
 * - PUT    /api/users/:id  → @CachePut(user)
 * - DELETE /api/users/:id  → @CacheEvict(user)
 *
 * 对应 Java Spring Boot:
 * @RestController
 * @RequestMapping("/users")
 * public class UserController { ... }
 */

import 'reflect-metadata';
import {
  RestController,
  GetMapping,
  PostMapping,
  PutMapping,
  DeleteMapping,
  PathVariable,
  RequestBody,
} from '@ai-partner-x/aiko-boot-starter-web';
import { Autowired } from '@ai-partner-x/aiko-boot';
import { User } from '../entity/user.entity.js';
import { UserCacheService } from '../service/user.cache.service.js';

@RestController({ path: '/users' })
export class UserController {
  @Autowired()
  private userCacheService!: UserCacheService;

  /** GET /api/users — 列表查询（@Cacheable user:list） */
  @GetMapping()
  async list(): Promise<User[]> {
    return this.userCacheService.getUserList();
  }

  /** GET /api/users/:id — 单条查询（@Cacheable user） */
  @GetMapping('/:id')
  async getById(@PathVariable('id') id: string): Promise<User | null> {
    return this.userCacheService.getUserById(Number(id));
  }

  /** POST /api/users — 创建用户（@CacheEvict user:list） */
  @PostMapping()
  async create(@RequestBody() body: Omit<User, 'id'>): Promise<User> {
    return this.userCacheService.createUser(body);
  }

  /** PUT /api/users/:id — 更新用户（@CachePut user） */
  @PutMapping('/:id')
  async update(
    @PathVariable('id') id: string,
    @RequestBody() body: Partial<Omit<User, 'id'>>
  ): Promise<User> {
    return this.userCacheService.updateUser(Number(id), body);
  }

  /** DELETE /api/users/:id — 删除用户（@CacheEvict user） */
  @DeleteMapping('/:id')
  async delete(@PathVariable('id') id: string): Promise<{ success: boolean }> {
    const success = await this.userCacheService.deleteUser(Number(id));
    return { success };
  }
}
