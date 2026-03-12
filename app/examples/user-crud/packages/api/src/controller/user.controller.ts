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
  RequestPart,
  ModelAttribute,
  RequestAttribute,
  type MultipartFile,
} from '@ai-partner-x/aiko-boot-starter-web';
import { Autowired } from '@ai-partner-x/aiko-boot';
import { User } from '../entity/user.entity.js';
import { UserService, UserSearchParams } from '../service/user.service.js';
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
  UserFilterDto,
  UserResponseDto,
} from '../dto/user.dto.js';
import { StorageService, type UploadOptions } from '@ai-partner-x/aiko-boot-starter-storage';

@RestController({ path: '/users' })
export class UserController {
  @Autowired()
  private userService!: UserService;

  @Autowired()
  private storageService!: StorageService;

  @GetMapping()
  async list(): Promise<User[]> {
    return this.userService.getAllUsers();
  }

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

  @GetMapping('/active')
  async getActiveUsers(): Promise<User[]> {
    return this.userService.getActiveUsers();
  }

  @GetMapping('/keyword/:keyword')
  async searchByKeyword(@PathVariable('keyword') keyword: string): Promise<User[]> {
    return this.userService.searchByKeyword(keyword);
  }

  @GetMapping('/:id')
  async getById(@PathVariable('id') id: string): Promise<User | null> {
    return this.userService.getUserById(Number(id));
  }

  @PostMapping()
  async create(@RequestBody() dto: CreateUserDto): Promise<User> {
    return this.userService.createUser(dto);
  }

  @PutMapping('/:id')
  async update(
    @PathVariable('id') id: string,
    @RequestBody() dto: UpdateUserDto
  ): Promise<User> {
    return this.userService.updateUser(Number(id), dto);
  }

  @DeleteMapping('/:id')
  async delete(@PathVariable('id') id: string): Promise<SuccessResponse> {
    const result = await this.userService.deleteUser(Number(id));
    const response: SuccessResponse = { success: result };
    return response;
  }

  @PutMapping('/batch/age')
  async batchUpdateAge(
    @RequestBody() body: BatchUpdateAgeDto,
  ): Promise<UpdateResponse> {
    const updated = await this.userService.batchUpdateAge(body.username, body.age);
    const response: UpdateResponse = { success: true, updated };
    return response;
  }

  @PutMapping('/:id/email')
  async updateEmail(
    @PathVariable('id') id: string,
    @RequestBody() body: UpdateEmailDto,
  ): Promise<UpdateResponse> {
    const updated = await this.userService.updateEmailById(Number(id), body.email);
    const response: UpdateResponse = { success: true, updated };
    return response;
  }

  @DeleteMapping('/batch')
  async batchDelete(
    @RequestBody() body: BatchDeleteDto,
  ): Promise<DeleteResponse> {
    const deleted = await this.userService.batchDeleteByAgeRange(body.minAge, body.maxAge);
    const response: DeleteResponse = { success: true, deleted };
    return response;
  }

  // ==================== @ModelAttribute 示例端点 ====================

  /**
   * 使用 @ModelAttribute 绑定过滤参数 - 自动合并 URL query string 和 form body
   *
   * 等同于 Spring Boot: @GetMapping + @ModelAttribute SearchDto
   * 调用方无需逐一声明 @RequestParam，整个查询对象自动从请求参数绑定。
   *
   * @example
   * GET /api/users/filter?username=alice&minAge=18&maxAge=30&page=1&pageSize=5
   */
  @GetMapping('/filter')
  async filter(
    @ModelAttribute() query: UserFilterDto,
  ): Promise<UserSearchResultDto> {
    const params: UserSearchParams = {
      username: query.username,
      email: query.email,
      minAge: query.minAge ? Number(query.minAge) : undefined,
      maxAge: query.maxAge ? Number(query.maxAge) : undefined,
      page: query.page ? Number(query.page) : 1,
      pageSize: query.pageSize ? Number(query.pageSize) : 10,
      orderBy: query.orderBy as UserSearchParams['orderBy'],
      orderDir: query.orderDir as UserSearchParams['orderDir'],
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

  // ==================== @RequestAttribute 示例端点 ====================

  /**
   * 使用 @RequestAttribute 读取中间件注入的当前用户信息
   *
   * 等同于 Spring Boot: @RequestAttribute("currentUser")
   * Express 中间件通过 `(req as any).currentUser = { id, username }` 将属性挂载到请求对象。
   * @RequestAttribute 装饰器自动从 req 对象中读取对应属性。
   *
   * @example
   * // 中间件设置: app.use((req, res, next) => { (req as any).currentUser = { id: 1, username: 'admin' }; next(); })
   * GET /api/users/profile
   */
  @GetMapping('/profile')
  async profile(
    @RequestAttribute('currentUser') currentUser: { id: number; username: string } | undefined,
  ): Promise<User | null> {
    if (!currentUser) {
      throw new Error('未登录或缺少 currentUser 请求属性');
    }
    return this.userService.getUserById(currentUser.id);
  }

  // ==================== @RequestPart 文件上传示例端点 ====================

  /**
   * 使用 @RequestPart 上传用户头像 - multipart/form-data 文件上传
   * 集成 StorageService 实现文件持久化存储
   *
   * 等同于 Spring Boot: @PostMapping + @RequestPart("avatar") MultipartFile
   * 框架自动为含 @RequestPart 参数的路由注入 multer 中间件，无需手动配置。
   *
   * @example
   * POST /api/users/1/avatar  (Content-Type: multipart/form-data)
   * Form field name: "avatar"
   */
  @PostMapping('/:id/avatar')
  async uploadAvatar(
    @PathVariable('id') id: string,
    @RequestPart('avatar') avatar: MultipartFile | undefined,
  ): Promise<{ url: string; key: string; filename: string; size: number }> {
    if (!avatar || avatar.isEmpty()) {
      throw new Error('上传的文件为空');
    }

    const buffer = avatar.getBytes();
    const options: UploadOptions = {
      folder: 'avatars',
      maxSize: 5 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    };

    const result = await this.storageService.upload(buffer, avatar.getOriginalFilename(), options);

    // 触发异步审计日志（@Async fire-and-forget，不阻塞响应）
    this.userService.recordAuditLog('UPLOAD_AVATAR', Number(id));

    return {
      url: result.url,
      key: result.key,
      filename: avatar.getOriginalFilename(),
      size: avatar.getSize(),
    };
  }

  // ==================== @JsonFormat 示例端点 ====================

  /**
   * 使用 @JsonFormat 格式化日期 - 返回带格式化日期的 DTO
   *
   * 等同于 Spring Boot: Jackson @JsonFormat
   * 框架自动在响应序列化时格式化标注了 @JsonFormat 的 Date 字段：
   * - createdAt: "2024-01-15 08:30:00" (上海时区字符串)
   * - updatedAt: 1709971200000 (Unix 毫秒时间戳数字)
   *
   * @example
   * GET /api/users/1/response
   * Response:
   * {
   *   "id": 1,
   *   "username": "test",
   *   "email": "test@example.com",
   *   "createdAt": "2024-01-15 08:30:00",
   *   "updatedAt": 1709971200000
   * }
   */
  @GetMapping('/:id/response')
  async getUserResponse(@PathVariable('id') id: string): Promise<UserResponseDto | null> {
    const user = await this.userService.getUserById(Number(id));
    if (!user) {
      return null;
    }
    const response: UserResponseDto = {
      id: user.id,
      username: user.username,
      email: user.email,
      age: user.age,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    return response;
  }
}
