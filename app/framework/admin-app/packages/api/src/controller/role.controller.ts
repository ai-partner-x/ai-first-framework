import 'reflect-metadata';
import {
  RestController, GetMapping, PostMapping, PutMapping, DeleteMapping,
  PathVariable, RequestBody,
} from '@ai-partner-x/aiko-boot-starter-web';
import { Autowired } from '@ai-partner-x/aiko-boot/di/server';
import { RoleService } from '../service/role.service.js';
import type { CreateRoleDto, UpdateRoleDto } from '../dto/role.dto.js';

@RestController({ path: '/sys/role' })
export class RoleController {
  @Autowired()
  private roleService!: RoleService;

  @GetMapping('/list')
  async list() {
    return this.roleService.listRoles();
  }

  @GetMapping('/:id')
  async getById(@PathVariable('id') id: string) {
    return this.roleService.getById(Number(id));
  }

  @PostMapping()
  async create(@RequestBody() dto: CreateRoleDto) {
    return this.roleService.createRole(dto);
  }

  @PutMapping('/:id')
  async update(@PathVariable('id') id: string, @RequestBody() dto: UpdateRoleDto) {
    return this.roleService.updateRole(Number(id), dto);
  }

  @DeleteMapping('/:id')
  async delete(@PathVariable('id') id: string) {
    await this.roleService.deleteRole(Number(id));
    return { message: '删除成功' };
  }

  @GetMapping('/:id/menus')
  async getRoleMenus(@PathVariable('id') id: string) {
    return this.roleService.getRoleMenuIds(Number(id));
  }

  @PutMapping('/:id/menus')
  async assignMenus(@PathVariable('id') id: string, @RequestBody() body: { menuIds: number[] }) {
    return this.roleService.updateRole(Number(id), { menuIds: body.menuIds });
  }
}
