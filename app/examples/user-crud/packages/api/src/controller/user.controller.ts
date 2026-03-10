/**
 * User Controller - Spring Boot 风格
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
  RequestParam,
} from '@ai-partner-x/aiko-boot-starter-web';
import { Autowired } from '@ai-partner-x/aiko-boot';
import { User } from '../entity/user.entity.js';
import { UserService, UserSearchParams } from '../service/user.service.js';
import { UserCacheService } from '../service/user.cache.service.js';
import { 
  CreateUserDto, 
  UpdateUserDto,
  BatchUpdateAgeDto,
  UpdateEmailDto,
  BatchDeleteDto,
  SuccessResponse,
  UpdateResponse,
  DeleteResponse,
  UserSearchResultDto,
} from '../dto/user.dto.js';

@RestController({ path: '/users' })
export class UserController {
  @Autowired()
  private userService!: UserService;

  /**
   * UserCacheService 为基础 CRUD 操作提供缓存层：
   * - getUserById / getAllUsers 使用 @Cacheable（读通缓存）
   * - createUser 使用 @CacheEvict（清空列表缓存）
   * - updateUser 使用 @CachePut（写通缓存）
   * - deleteUser 使用 @CacheEvict（清除条目缓存）
   *
   * 未启用 Redis 时，自动降级为直接调用 UserService，功能不受影响。
   */
  @Autowired()
  private userCacheService!: UserCacheService;

  @GetMapping()
  async list(): Promise<User[]> {
    return this.userCacheService.getAllUsers();
  }

  /**
   * 高级搜索 - 使用 QueryWrapper
   * 
   * @example
   * GET /api/users/search?username=test&minAge=20&maxAge=30&page=1&pageSize=10
   */
  @GetMapping('/search')
  async search(
    @RequestParam('username') username?: string,
    @RequestParam('email') email?: string,
    @RequestParam('minAge') minAge?: string,
    @RequestParam('maxAge') maxAge?: string,
    @RequestParam('page') page?: string,
    @RequestParam('pageSize') pageSize?: string,
    @RequestParam('orderBy') orderBy?: string,
    @RequestParam('orderDir') orderDir?: string,
  ): Promise<UserSearchResultDto> {
    const params: UserSearchParams = {
      username,
      email,
      minAge: minAge ? Number(minAge) : undefined,
      maxAge: maxAge ? Number(maxAge) : undefined,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 10,
      orderBy: orderBy as UserSearchParams['orderBy'],
      orderDir: orderDir as UserSearchParams['orderDir'],
    };
    
    const result = await this.userService.searchUsers(params);
    const response: UserSearchResultDto = {
      data: result.data,
      total: result.total,
      page: params.page!,
      pageSize: params.pageSize!,
    };
    return response;
  }

  /**
   * 活跃用户查询 - QueryWrapper 示例
   */
  @GetMapping('/active')
  async getActiveUsers(): Promise<User[]> {
    return this.userService.getActiveUsers();
  }

  /**
   * 关键字搜索 - OR 条件 QueryWrapper 示例
   */
  @GetMapping('/keyword/:keyword')
  async searchByKeyword(@PathVariable('keyword') keyword: string): Promise<User[]> {
    return this.userService.searchByKeyword(keyword);
  }

  @GetMapping('/:id')
  async getById(@PathVariable('id') id: string): Promise<User | null> {
    return this.userCacheService.getUserById(Number(id));
  }

  @PostMapping()
  async create(@RequestBody() dto: CreateUserDto): Promise<User> {
    return this.userCacheService.createUser(dto);
  }

  @PutMapping('/:id')
  async update(
    @PathVariable('id') id: string,
    @RequestBody() dto: UpdateUserDto
  ): Promise<User> {
    return this.userCacheService.updateUser(Number(id), dto);
  }

  @DeleteMapping('/:id')
  async delete(@PathVariable('id') id: string): Promise<SuccessResponse> {
    const result = await this.userCacheService.deleteUser(Number(id));
    const response: SuccessResponse = { success: result };
    return response;
  }

  // ==================== UpdateWrapper 示例端点 ====================

  /**
   * 批量更新年龄 - UpdateWrapper 示例
   * 
   * @example
   * PUT /api/users/batch/age
   * Body: { "username": "test", "age": 30 }
   */
  @PutMapping('/batch/age')
  async batchUpdateAge(
    @RequestBody() body: BatchUpdateAgeDto,
  ): Promise<UpdateResponse> {
    const updated = await this.userService.batchUpdateAge(body.username, body.age);
    const response: UpdateResponse = { success: true, updated };
    return response;
  }

  /**
   * 更新用户邮箱 - UpdateWrapper 示例
   * 
   * @example
   * PUT /api/users/1/email
   * Body: { "email": "new@test.com" }
   */
  @PutMapping('/:id/email')
  async updateEmail(
    @PathVariable('id') id: string,
    @RequestBody() body: UpdateEmailDto,
  ): Promise<UpdateResponse> {
    const updated = await this.userService.updateEmailById(Number(id), body.email);
    const response: UpdateResponse = { success: true, updated };
    return response;
  }

  /**
   * 批量删除 - QueryWrapper 示例
   * 
   * @example
   * DELETE /api/users/batch
   * Body: { "minAge": 18, "maxAge": 25 }
   */
  @DeleteMapping('/batch')
  async batchDelete(
    @RequestBody() body: BatchDeleteDto,
  ): Promise<DeleteResponse> {
    const deleted = await this.userService.batchDeleteByAgeRange(body.minAge, body.maxAge);
    const response: DeleteResponse = { success: true, deleted };
    return response;
  }
}
