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
} from '@ai-first/nextjs';
import { Autowired } from '@ai-first/di/server';
import { User } from '../entity/user.entity.js';
import { UserService } from '../service/user.service.js';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto.js';

@RestController({ path: '/users' })
export class UserController {
  @Autowired()
  private userService!: UserService;

  @GetMapping()
  async list(): Promise<User[]> {
    return this.userService.getAllUsers();
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
  async delete(@PathVariable('id') id: string): Promise<{ success: boolean }> {
    const result = await this.userService.deleteUser(Number(id));
    return { success: result };
  }
}
