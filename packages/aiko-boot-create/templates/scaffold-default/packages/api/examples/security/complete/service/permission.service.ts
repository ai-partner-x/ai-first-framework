import { Service, Autowired } from '@ai-partner-x/aiko-boot';
import { Mapper, BaseMapper } from '@ai-partner-x/aiko-boot-starter-orm';
import { Permission } from '../entity/permission.entity.js';
import { Role } from '../entity/role.entity.js';
import { User } from '../entity/user.entity.js';
import { RolePermission } from '../entity/role-permission.entity.js';
import { UserRole } from '../entity/user-role.entity.js';

@Service()
export class PermissionService {
  @Autowired()
  private permissionMapper!: BaseMapper<Permission>;

  @Autowired()
  private roleMapper!: BaseMapper<Role>;

  @Autowired()
  private userMapper!: BaseMapper<User>;

  @Autowired()
  private rolePermissionMapper!: BaseMapper<RolePermission>;

  @Autowired()
  private userRoleMapper!: BaseMapper<UserRole>;

  async getUserPermissions(userId: number): Promise<Permission[]> {
    const user = await this.userMapper.selectById(userId);
    if (!user) {
      return [];
    }

    const userRoles = await this.userRoleMapper.selectList({
      where: { userId }
    });

    const permissions: Permission[] = [];
    for (const userRole of userRoles) {
      const rolePermissions = await this.rolePermissionMapper.selectList({
        where: { roleId: userRole.roleId }
      });

      for (const rp of rolePermissions) {
        const permission = await this.permissionMapper.selectById(rp.permissionId);
        if (permission && !permissions.find(p => p.id === permission.id)) {
          permissions.push(permission);
        }
      }
    }

    return permissions;
  }

  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const rolePermissions = await this.rolePermissionMapper.selectList({
      where: { roleId }
    });

    const permissions: Permission[] = [];
    for (const rp of rolePermissions) {
      const permission = await this.permissionMapper.selectById(rp.permissionId);
      if (permission) {
        permissions.push(permission);
      }
    }

    return permissions;
  }

  async hasPermission(userId: number, permissionName: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.some(p => p.name === permissionName);
  }

  async hasAnyPermission(userId: number, permissionNames: string[]): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissionNames.some(name => permissions.some(p => p.name === name));
  }

  async hasAllPermissions(userId: number, permissionNames: string[]): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissionNames.every(name => permissions.some(p => p.name === name));
  }

  async findById(id: number): Promise<Permission | null> {
    return this.permissionMapper.selectById(id);
  }

  async findAll(): Promise<Permission[]> {
    return this.permissionMapper.selectList({});
  }

  async create(permissionData: Partial<Permission>): Promise<Permission> {
    const permission = {
      ...permissionData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const id = await this.permissionMapper.insert(permission);
    return this.permissionMapper.selectById(id) as Promise<Permission>;
  }

  async update(id: number, permissionData: Partial<Permission>): Promise<Permission> {
    await this.permissionMapper.updateById(id, {
      ...permissionData,
      updatedAt: new Date(),
    });
    return this.permissionMapper.selectById(id) as Promise<Permission>;
  }

  async delete(id: number): Promise<boolean> {
    return this.permissionMapper.deleteById(id) > 0;
  }
}
