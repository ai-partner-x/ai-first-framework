import { RestController, GetMapping, PostMapping, PutMapping, DeleteMapping, RequestBody, PathVariable } from '@ai-partner-x/aiko-boot-starter-web';
import { PreAuthorize } from '@ai-partner-x/aiko-boot-starter-security';
import { RoleService } from '../service/role.service.js';
import { CreateRoleDto } from '../dto/create-role.dto.js';
import { Role } from '../entity/role.entity.js';

@RestController({ path: '/roles' })
export class RoleController {
  @Autowired()
  private roleService!: RoleService;

  @GetMapping()
  @PreAuthorize("hasRole('ADMIN')")
  async list(): Promise<Role[]> {
    return this.roleService.findAll();
  }

  @GetMapping('/{id}')
  @PreAuthorize("hasRole('ADMIN')")
  async getById(@PathVariable('id') id: number): Promise<Role> {
    return this.roleService.findById(id);
  }

  @PostMapping()
  @PreAuthorize("hasRole('ADMIN')")
  async create(@RequestBody() dto: CreateRoleDto): Promise<Role> {
    return this.roleService.create(dto);
  }

  @PutMapping('/{id}')
  @PreAuthorize("hasRole('ADMIN')")
  async update(@PathVariable('id') id: number, @RequestBody() dto: Partial<Role>): Promise<Role> {
    return this.roleService.update(id, dto);
  }

  @DeleteMapping('/{id}')
  @PreAuthorize("hasRole('ADMIN')")
  async delete(@PathVariable('id') id: number): Promise<boolean> {
    return this.roleService.delete(id);
  }

  @PostMapping('/{id}/permissions')
  @PreAuthorize("hasRole('ADMIN')")
  async assignPermission(@PathVariable('id') roleId: number, @RequestBody() body: { permissionId: number }): Promise<void> {
    return this.roleService.assignPermissionToRole(roleId, body.permissionId);
  }

  @DeleteMapping('/{id}/permissions/{permissionId}')
  @PreAuthorize("hasRole('ADMIN')")
  async removePermission(@PathVariable('id') roleId: number, @PathVariable('permissionId') permissionId: number): Promise<void> {
    return this.roleService.removePermissionFromRole(roleId, permissionId);
  }
}
