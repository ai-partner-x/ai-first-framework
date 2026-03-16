import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { UserService } from '../../service/user.service.js';
import { RoleService } from '../../service/role.service.js';
import { PermissionService } from '../../service/permission.service.js';
import { User, Role, Permission } from '../../entity/index.js';

describe('UserService', () => {
  let userService: UserService;
  let roleService: RoleService;
  let permissionService: PermissionService;

  beforeEach(() => {
    userService = new UserService();
    roleService = new RoleService();
    permissionService = new PermissionService();

    (userService as any).userMapper = {
      selectList: jest.fn(),
      selectById: jest.fn(),
      insert: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
    };

    (userService as any).roleMapper = {
      selectById: jest.fn(),
    };

    (userService as any).userRoleMapper = {
      selectList: jest.fn(),
      insert: jest.fn(),
      deleteById: jest.fn(),
    };

    (userService as any).permissionService = permissionService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUsername', () => {
    it('应该根据用户名找到用户', async () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        enabled: true,
        provider: 'local',
        providerId: '',
        avatar: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      ((userService as any).userMapper.selectList as jest.Mock).mockResolvedValue([mockUser]);

      const result = await userService.findByUsername('testuser');

      expect(result).toEqual(mockUser);
      expect(((userService as any).userMapper.selectList as jest.Mock)).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
    });

    it('当用户不存在时应该返回 null', async () => {
      ((userService as any).userMapper.selectList as jest.Mock).mockResolvedValue([]);

      const result = await userService.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('应该根据邮箱找到用户', async () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        enabled: true,
        provider: 'local',
        providerId: '',
        avatar: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      ((userService as any).userMapper.selectList as jest.Mock).mockResolvedValue([mockUser]);

      const result = await userService.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(((userService as any).userMapper.selectList as jest.Mock)).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('findById', () => {
    it('应该根据 ID 找到用户并包含角色和权限', async () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        enabled: true,
        provider: 'local',
        providerId: '',
        avatar: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRoles: Role[] = [
        {
          id: 1,
          name: 'ADMIN',
          description: '管理员',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockPermissions: Permission[] = [
        {
          id: 1,
          name: 'user:view',
          description: '查看用户',
          resource: 'user',
          action: 'view',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      ((userService as any).userMapper.selectById as jest.Mock).mockResolvedValue(mockUser);
      ((userService as any).getUserRoles as jest.Mock).mockResolvedValue(mockRoles);
      (permissionService.getUserPermissions as jest.Mock).mockResolvedValue(mockPermissions);

      const result = await userService.findById(1);

      expect(result).toEqual({ ...mockUser, roles: mockRoles, permissions: mockPermissions });
      expect(((userService as any).userMapper.selectById as jest.Mock)).toHaveBeenCalledWith(1);
    });

    it('当用户不存在时应该返回 null', async () => {
      ((userService as any).userMapper.selectById as jest.Mock).mockResolvedValue(null);

      const result = await userService.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('应该成功创建新用户', async () => {
      const userData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      };

      const mockCreatedUser: User = {
        id: 2,
        username: 'newuser',
        email: 'new@example.com',
        password: 'hashedpassword',
        enabled: true,
        provider: 'local',
        providerId: '',
        avatar: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      ((userService as any).userMapper.insert as jest.Mock).mockResolvedValue(2);
      ((userService as any).userMapper.selectById as jest.Mock).mockResolvedValue(mockCreatedUser);

      const result = await userService.create(userData);

      expect(result).toEqual(mockCreatedUser);
      expect(((userService as any).userMapper.insert as jest.Mock)).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('应该成功更新用户信息', async () => {
      const updateData = {
        email: 'updated@example.com',
      };

      const mockUpdatedUser: User = {
        id: 1,
        username: 'testuser',
        email: 'updated@example.com',
        password: 'hashedpassword',
        enabled: true,
        provider: 'local',
        providerId: '',
        avatar: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      ((userService as any).userMapper.updateById as jest.Mock).mockResolvedValue(1);
      ((userService as any).userMapper.selectById as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const result = await userService.update(1, updateData);

      expect(result).toEqual(mockUpdatedUser);
      expect(((userService as any).userMapper.updateById as jest.Mock)).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('应该加密新密码', async () => {
      const updateData = {
        password: 'newpassword123',
      };

      ((userService as any).userMapper.updateById as jest.Mock).mockResolvedValue(1);
      ((userService as any).userMapper.selectById as jest.Mock).mockResolvedValue({ id: 1 });

      await userService.update(1, updateData);

      const updateCall = ((userService as any).userMapper.updateById as jest.Mock).mock.calls[0];
      expect(updateCall[1].password).not.toBe('newpassword123');
      expect(updateCall[1].password).toMatch(/^\$2[aby]\$/);
    });
  });

  describe('delete', () => {
    it('应该成功删除用户', async () => {
      ((userService as any).userRoleMapper.selectList as jest.Mock).mockResolvedValue([]);
      ((userService as any).userMapper.deleteById as jest.Mock).mockResolvedValue(1);

      const result = await userService.delete(1);

      expect(result).toBe(true);
      expect(((userService as any).userMapper.deleteById as jest.Mock)).toHaveBeenCalledWith(1);
    });

    it('应该删除用户的所有角色关联', async () => {
      const mockUserRoles = [
        { id: 1, userId: 1, roleId: 1, createdAt: new Date() },
        { id: 2, userId: 1, roleId: 2, createdAt: new Date() },
      ];

      ((userService as any).userRoleMapper.selectList as jest.Mock).mockResolvedValue(mockUserRoles);
      ((userService as any).userRoleMapper.deleteById as jest.Mock).mockResolvedValue(1);
      ((userService as any).userMapper.deleteById as jest.Mock).mockResolvedValue(1);

      await userService.delete(1);

      expect(((userService as any).userRoleMapper.deleteById as jest.Mock)).toHaveBeenCalledTimes(2);
    });
  });

  describe('assignRoleToUser', () => {
    it('应该成功为用户分配角色', async () => {
      ((userService as any).userRoleMapper.insert as jest.Mock).mockResolvedValue(1);

      await userService.assignRoleToUser(1, 1);

      expect(((userService as any).userRoleMapper.insert as jest.Mock)).toHaveBeenCalledWith({
        userId: 1,
        roleId: 1,
        createdAt: expect.any(Date),
      });
    });
  });

  describe('removeRoleFromUser', () => {
    it('应该成功移除用户角色', async () => {
      const mockUserRoles = [
        { id: 1, userId: 1, roleId: 1, createdAt: new Date() },
      ];

      ((userService as any).userRoleMapper.selectList as jest.Mock).mockResolvedValue(mockUserRoles);
      ((userService as any).userRoleMapper.deleteById as jest.Mock).mockResolvedValue(1);

      await userService.removeRoleFromUser(1, 1);

      expect(((userService as any).userRoleMapper.deleteById as jest.Mock)).toHaveBeenCalledWith(1);
    });
  });
});
