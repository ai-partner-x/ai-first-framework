import 'reflect-metadata';
import {
  RestController, GetMapping, PostMapping, PutMapping, DeleteMapping,
  PathVariable, RequestBody, RequestParam,
} from '@ai-partner-x/aiko-boot-starter-web';
import { Autowired } from '@ai-partner-x/aiko-boot/di/server';
import { UserService } from '../service/user.service.js';
import type { CreateUserDto, UpdateUserDto, UserPageDto } from '../dto/user.dto.js';

@RestController({ path: '/sys/user' })
export class UserController {
  @Autowired()
  private userService!: UserService;

  @GetMapping('/page')
  async page(
    @RequestParam('pageNo') pageNo: string,
    @RequestParam('pageSize') pageSize: string,
    @RequestParam('username') username: string,
    @RequestParam('status') status: string,
  ) {
    const params: UserPageDto = {
      pageNo: pageNo ? parseInt(pageNo) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 10,
      username: username || undefined,
      status: status !== undefined && status !== '' ? parseInt(status) : undefined,
    };
    return this.userService.pageUsers(params);
  }

  @GetMapping('/:id')
  async getById(@PathVariable('id') id: string) {
    return this.userService.getById(Number(id));
  }

  @PostMapping()
  async create(@RequestBody() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @PutMapping('/:id')
  async update(@PathVariable('id') id: string, @RequestBody() dto: UpdateUserDto) {
    return this.userService.updateUser(Number(id), dto);
  }

  @DeleteMapping('/:id')
  async delete(@PathVariable('id') id: string) {
    await this.userService.deleteUser(Number(id));
    return { message: '删除成功' };
  }

  @PutMapping('/:id/password')
  async resetPassword(@PathVariable('id') id: string, @RequestBody() body: { newPassword: string }) {
    await this.userService.resetPassword(Number(id), body.newPassword);
    return { message: '密码重置成功' };
  }
}
