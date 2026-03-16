import { Service, Autowired } from '@ai-partner-x/aiko-boot';
import { Mapper, BaseMapper } from '@ai-partner-x/aiko-boot-starter-orm';
import { User } from '../entity/user.entity.js';
import { Role } from '../entity/role.entity.js';
import { UserRole } from '../entity/user-role.entity.js';
import { PermissionService } from './permission.service.js';
import bcrypt from 'bcrypt';

@Service()
export class UserService {
  @Autowired()
  private userMapper!: BaseMapper<User>;

  @Autowired()
  private roleMapper!: BaseMapper<Role>;

  @Autowired()
  private userRoleMapper!: BaseMapper<UserRole>;

  @Autowired()
  private permissionService!: PermissionService;

  async findByUsername(username: string): Promise<User | null> {
    const users = await this.userMapper.selectList({
      where: { username }
    });
    return users[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const users = await this.userMapper.selectList({
      where: { email }
    });
    return users[0] || null;
  }

  async findById(id: number): Promise<User | null> {
    const user = await this.userMapper.selectById(id);
    if (!user) {
      return null;
    }

    user.roles = await this.getUserRoles(id);
    user.permissions = await this.permissionService.getUserPermissions(id);

    return user;
  }

  async findAll(): Promise<User[]> {
    const users = await this.userMapper.selectList({});
    for (const user of users) {
      user.roles = await this.getUserRoles(user.id);
      user.permissions = await this.permissionService.getUserPermissions(user.id);
    }
    return users;
  }

  async create(userData: Partial<User>): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password || '', 10);
    const user = {
      ...userData,
      password: hashedPassword,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const id = await this.userMapper.insert(user);
    return this.userMapper.selectById(id) as Promise<User>;
  }

  async update(id: number, userData: Partial<User>): Promise<User> {
    const updateData = {
      ...userData,
      updatedAt: new Date(),
    };
    
    if (userData.password) {
      updateData.password = await bcrypt.hash(userData.password, 10);
    }

    await this.userMapper.updateById(id, updateData);
    return this.userMapper.selectById(id) as Promise<User>;
  }

  async delete(id: number): Promise<boolean> {
    await this.userRoleMapper.selectList({
      where: { userId: id }
    }).then(userRoles => {
      for (const userRole of userRoles) {
        this.userRoleMapper.deleteById(userRole.id);
      }
    });

    return this.userMapper.deleteById(id) > 0;
  }

  async getUserRoles(userId: number): Promise<Role[]> {
    const userRoles = await this.userRoleMapper.selectList({
      where: { userId }
    });

    const roles: Role[] = [];
    for (const userRole of userRoles) {
      const role = await this.roleMapper.selectById(userRole.roleId);
      if (role) {
        role.permissions = await this.permissionService.getRolePermissions(role.id);
        roles.push(role);
      }
    }

    return roles;
  }

  async assignRoleToUser(userId: number, roleId: number): Promise<void> {
    const userRole = {
      userId,
      roleId,
      createdAt: new Date(),
    };
    await this.userRoleMapper.insert(userRole);
  }

  async removeRoleFromUser(userId: number, roleId: number): Promise<void> {
    const userRoles = await this.userRoleMapper.selectList({
      where: { userId, roleId }
    });

    for (const userRole of userRoles) {
      await this.userRoleMapper.deleteById(userRole.id);
    }
  }
}
