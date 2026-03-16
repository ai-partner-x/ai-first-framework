import 'reflect-metadata';
import {
  RestController, GetMapping, PostMapping, PutMapping, DeleteMapping,
  PathVariable, RequestBody,
} from '@ai-partner-x/aiko-boot-starter-web';
import { Autowired } from '@ai-partner-x/aiko-boot/di/server';
import { ApiPermission, ButtonPermission } from '@ai-partner-x/aiko-boot-starter-security';
import { RoleService } from '../service/role.service.js';
import type { CreateRoleDto, UpdateRoleDto } from '../dto/role.dto.js';

@RestController({ path: '/sys/role' })
export class RoleController {
  @Autowired(RoleService)
  private roleService!: RoleService;

  @GetMapping('/list')
  @ApiPermission('role', 'list', {
    description: '查看角色列表',
    group: '角色管理',
  })
  async list() {
    return this.roleService.listRoles();
  }

  @GetMapping('/:id')
  @ApiPermission('role', 'read', {
    description: '查看角色详情',
    group: '角色管理',
  })
  async getById(@PathVariable('id') id: string) {
    return this.roleService.getById(Number(id));
  }

  @PostMapping()
  @ApiPermission('role', 'create', {
    description: '创建角色',
    group: '角色管理',
  })
  @ButtonPermission('role', 'create', {
    description: '创建角色按钮',
    group: '角色管理',
    buttonId: 'btn-create-role',
  })
  async create(@RequestBody() dto: CreateRoleDto) {
    console.log("dto1", dto);
    return this.roleService.createRole(dto);
  }

  @PutMapping('/:id')
  @ApiPermission('role', 'update', {
    description: '更新角色',
    group: '角色管理',
  })
  @ButtonPermission('role', 'update', {
    description: '更新角色按钮',
    group: '角色管理',
    buttonId: 'btn-update-role',
  })
  async update(@PathVariable('id') id: string, @RequestBody() dto: UpdateRoleDto) {
    return this.roleService.updateRole(Number(id), dto);
  }

  @DeleteMapping('/:id')
  @ApiPermission('role', 'delete', {
    description: '删除角色',
    group: '角色管理',
  })
  @ButtonPermission('role', 'delete', {
    description: '删除角色按钮',
    group: '角色管理',
    buttonId: 'btn-delete-role',
  })
  async delete(@PathVariable('id') id: string) {
    await this.roleService.deleteRole(Number(id));
    return { message: '删除成功' };
  }

  @GetMapping('/:id/menus')
  @ApiPermission('role', 'read-menus', {
    description: '查看角色菜单',
    group: '角色管理',
  })
  async getRoleMenus(@PathVariable('id') id: string) {
    return this.roleService.getRoleMenuIds(Number(id));
  }

  @PutMapping('/:id/menus')
  @ApiPermission('role', 'assign-menus', {
    description: '分配角色菜单',
    group: '角色管理',
  })
  @ButtonPermission('role', 'assign-menus', {
    description: '分配菜单按钮',
    group: '角色管理',
    buttonId: 'btn-assign-menus',
  })
  async assignMenus(@PathVariable('id') id: string, @RequestBody() body: { menuIds: number[] }) {
    return this.roleService.updateRole(Number(id), { menuIds: body.menuIds });
  }
}
