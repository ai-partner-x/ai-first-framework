import 'reflect-metadata';
import {
  RestController, GetMapping, PostMapping, PutMapping, DeleteMapping,
  PathVariable, RequestBody, RequestParam,
} from '@ai-partner-x/aiko-boot-starter-web';
import { Autowired } from '@ai-partner-x/aiko-boot/di/server';
import { ApiPermission, ButtonPermission } from '@ai-partner-x/aiko-boot-starter-security';
import { UserService } from '../service/user.service.js';
import type { CreateUserDto, UpdateUserDto, UserPageDto } from '../dto/user.dto.js';

@RestController({ path: '/sys/user' })
export class UserController {
  @Autowired(UserService)
  private userService!: UserService;

  @GetMapping('/page')
  @ApiPermission('user', 'page', {
    description: '查看用户分页列表',
    group: '用户管理',
  })
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
  @ApiPermission('user', 'read', {
    description: '查看用户详情',
    group: '用户管理',
  })
  async getById(@PathVariable('id') id: string) {
    return this.userService.getById(Number(id));
  }

  @PostMapping()
  @ApiPermission('user', 'create', {
    description: '创建用户',
    group: '用户管理',
  })
  @ButtonPermission('user', 'create', {
    description: '创建用户按钮',
    group: '用户管理',
    buttonId: 'btn-create-user',
  })
  async create(@RequestBody() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @PutMapping('/:id')
  @ApiPermission('user', 'update', {
    description: '更新用户信息',
    group: '用户管理',
  })
  @ButtonPermission('user', 'update', {
    description: '更新用户按钮',
    group: '用户管理',
    buttonId: 'btn-update-user',
  })
  async update(@PathVariable('id') id: string, @RequestBody() dto: UpdateUserDto) {
    return this.userService.updateUser(Number(id), dto);
  }

  @DeleteMapping('/:id')
  @ApiPermission('user', 'delete', {
    description: '删除用户',
    group: '用户管理',
  })
  @ButtonPermission('user', 'delete', {
    description: '删除用户按钮',
    group: '用户管理',
    buttonId: 'btn-delete-user',
  })
  async delete(@PathVariable('id') id: string) {
    await this.userService.deleteUser(Number(id));
    return { message: '删除成功' };
  }

  @PutMapping('/:id/password')
  @ApiPermission('user', 'reset-password', {
    description: '重置用户密码',
    group: '用户管理',
  })
  @ButtonPermission('user', 'reset-password', {
    description: '重置密码按钮',
    group: '用户管理',
    buttonId: 'btn-reset-password',
  })
  async resetPassword(@PathVariable('id') id: string, @RequestBody() body: { newPassword: string }) {
    await this.userService.resetPassword(Number(id), body.newPassword);
    return { message: '密码重置成功' };
  }
}
