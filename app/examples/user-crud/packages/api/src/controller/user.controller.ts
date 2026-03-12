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
}
