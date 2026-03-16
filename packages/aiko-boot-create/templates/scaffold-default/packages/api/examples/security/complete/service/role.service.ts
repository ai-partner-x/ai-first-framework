import { Service, Autowired } from '@ai-partner-x/aiko-boot';
import { Mapper, BaseMapper } from '@ai-partner-x/aiko-boot-starter-orm';
import { Role } from '../entity/role.entity.js';
import { Permission } from '../entity/permission.entity.js';
import { RolePermission } from '../entity/role-permission.entity.js';
import { PermissionService } from './permission.service.js';

@Service()
export class RoleService {
  @Autowired()
  private roleMapper!: BaseMapper<Role>;

  @Autowired()
  private rolePermissionMapper!: BaseMapper<RolePermission>;

  @Autowired()
  private permissionService!: PermissionService;

  async findById(id: number): Promise<Role | null> {
    const role = await this.roleMapper.selectById(id);
    if (!role) {
      return null;
    }

    role.permissions = await this.permissionService.getRolePermissions(id);
    return role;
  }

  async findAll(): Promise<Role[]> {
    const roles = await this.roleMapper.selectList({});
    for (const role of roles) {
      role.permissions = await this.permissionService.getRolePermissions(role.id);
    }
    return roles;
  }

  async create(roleData: Partial<Role>): Promise<Role> {
    const role = {
      ...roleData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const id = await this.roleMapper.insert(role);
    return this.roleMapper.selectById(id) as Promise<Role>;
  }

  async update(id: number, roleData: Partial<Role>): Promise<Role> {
    await this.roleMapper.updateById(id, {
      ...roleData,
      updatedAt: new Date(),
    });
    return this.roleMapper.selectById(id) as Promise<Role>;
  }

  async delete(id: number): Promise<boolean> {
    await this.rolePermissionMapper.selectList({
      where: { roleId: id }
    }).then(rolePermissions => {
      for (const rp of rolePermissions) {
        this.rolePermissionMapper.deleteById(rp.id);
      }
    });

    return this.roleMapper.deleteById(id) > 0;
  }

  async assignPermissionToRole(roleId: number, permissionId: number): Promise<void> {
    const rolePermission = {
      roleId,
      permissionId,
      createdAt: new Date(),
    };
    await this.rolePermissionMapper.insert(rolePermission);
  }

  async removePermissionFromRole(roleId: number, permissionId: number): Promise<void> {
    const rolePermissions = await this.rolePermissionMapper.selectList({
      where: { roleId, permissionId }
    });

    for (const rp of rolePermissions) {
      await this.rolePermissionMapper.deleteById(rp.id);
    }
  }
}
