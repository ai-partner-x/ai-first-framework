import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PermissionService } from '../../service/permission.service.js';
import { Permission, Role, User } from '../../entity/index.js';

describe('PermissionService', () => {
  let permissionService: PermissionService;

  beforeEach(() => {
    permissionService = new PermissionService();

    (permissionService as any).permissionMapper = {
      selectById: jest.fn(),
      selectList: jest.fn(),
      insert: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
    };

    (permissionService as any).roleMapper = {
      selectById: jest.fn(),
    };

    (permissionService as any).userMapper = {
      selectById: jest.fn(),
    };

    (permissionService as any).rolePermissionMapper = {
      selectList: jest.fn(),
    };

    (permissionService as any).userRoleMapper = {
      selectList: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserPermissions', () => {
    it('应该获取用户的所有权限', async () => {
      const mockUserRoles = [
        { id: 1, userId: 1, roleId: 1, createdAt: new Date() },
      ];

      const mockRolePermissions = [
        { id: 1, roleId: 1, permissionId: 1, createdAt: new Date() },
        { id: 2, roleId: 1, permissionId: 2, createdAt: new Date() },
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
        {
          id: 2,
          name: 'user:create',
          description: '创建用户',
          resource: 'user',
          action: 'create',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      ((permissionService as any).userMapper.selectById as jest.Mock).mockResolvedValue({ id: 1 });
      ((permissionService as any).userRoleMapper.selectList as jest.Mock).mockResolvedValue(mockUserRoles);
      ((permissionService as any).rolePermissionMapper.selectList as jest.Mock).mockResolvedValue(mockRolePermissions);
      ((permissionService as any).permissionMapper.selectById as jest.Mock)
        .mockResolvedValueOnce(mockPermissions[0])
        .mockResolvedValueOnce(mockPermissions[1]);

      const result = await permissionService.getUserPermissions(1);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('user:view');
      expect(result[1].name).toBe('user:create');
    });

    it('当用户不存在时应该返回空数组', async () => {
      ((permissionService as any).userMapper.selectById as jest.Mock).mockResolvedValue(null);

      const result = await permissionService.getUserPermissions(999);

      expect(result).toEqual([]);
    });

    it('应该去重权限', async () => {
      const mockUserRoles = [
        { id: 1, userId: 1, roleId: 1, createdAt: new Date() },
        { id: 2, userId: 1, roleId: 2, createdAt: new Date() },
      ];

      const mockRolePermissions1 = [
        { id: 1, roleId: 1, permissionId: 1, createdAt: new Date() },
      ];

      const mockRolePermissions2 = [
        { id: 2, roleId: 2, permissionId: 1, createdAt: new Date() },
      ];

      const mockPermission: Permission = {
        id: 1,
        name: 'user:view',
        description: '查看用户',
        resource: 'user',
        action: 'view',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      ((permissionService as any).userMapper.selectById as jest.Mock).mockResolvedValue({ id: 1 });
      ((permissionService as any).userRoleMapper.selectList as jest.Mock).mockResolvedValue(mockUserRoles);
      ((permissionService as any).rolePermissionMapper.selectList as jest.Mock)
        .mockResolvedValueOnce(mockRolePermissions1)
        .mockResolvedValueOnce(mockRolePermissions2);
      ((permissionService as any).permissionMapper.selectById as jest.Mock).mockResolvedValue(mockPermission);

      const result = await permissionService.getUserPermissions(1);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('user:view');
    });
  });

  describe('hasPermission', () => {
    it('应该检查用户是否拥有指定权限', async () => {
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

      (permissionService.getUserPermissions as jest.Mock).mockResolvedValue(mockPermissions);

      const result = await permissionService.hasPermission(1, 'user:view');

      expect(result).toBe(true);
    });

    it('当用户没有指定权限时应该返回 false', async () => {
      (permissionService.getUserPermissions as jest.Mock).mockResolvedValue([]);

      const result = await permissionService.hasPermission(1, 'user:delete');

      expect(result).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('应该检查用户是否拥有任一指定权限', async () => {
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

      (permissionService.getUserPermissions as jest.Mock).mockResolvedValue(mockPermissions);

      const result = await permissionService.hasAnyPermission(1, ['user:delete', 'user:view']);

      expect(result).toBe(true);
    });

    it('当用户没有任何指定权限时应该返回 false', async () => {
      (permissionService.getUserPermissions as jest.Mock).mockResolvedValue([]);

      const result = await permissionService.hasAnyPermission(1, ['user:delete', 'user:update']);

      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('应该检查用户是否拥有所有指定权限', async () => {
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
        {
          id: 2,
          name: 'user:create',
          description: '创建用户',
          resource: 'user',
          action: 'create',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (permissionService.getUserPermissions as jest.Mock).mockResolvedValue(mockPermissions);

      const result = await permissionService.hasAllPermissions(1, ['user:view', 'user:create']);

      expect(result).toBe(true);
    });

    it('当用户缺少任一权限时应该返回 false', async () => {
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

      (permissionService.getUserPermissions as jest.Mock).mockResolvedValue(mockPermissions);

      const result = await permissionService.hasAllPermissions(1, ['user:view', 'user:delete']);

      expect(result).toBe(false);
    });
  });

  describe('findById', () => {
    it('应该根据 ID 找到权限', async () => {
      const mockPermission: Permission = {
        id: 1,
        name: 'user:view',
        description: '查看用户',
        resource: 'user',
        action: 'view',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      ((permissionService as any).permissionMapper.selectById as jest.Mock).mockResolvedValue(mockPermission);

      const result = await permissionService.findById(1);

      expect(result).toEqual(mockPermission);
    });

    it('当权限不存在时应该返回 null', async () => {
      ((permissionService as any).permissionMapper.selectById as jest.Mock).mockResolvedValue(null);

      const result = await permissionService.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('应该获取所有权限', async () => {
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
        {
          id: 2,
          name: 'user:create',
          description: '创建用户',
          resource: 'user',
          action: 'create',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      ((permissionService as any).permissionMapper.selectList as jest.Mock).mockResolvedValue(mockPermissions);

      const result = await permissionService.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('user:view');
      expect(result[1].name).toBe('user:create');
    });
  });

  describe('create', () => {
    it('应该成功创建新权限', async () => {
      const permissionData = {
        name: 'user:delete',
        description: '删除用户',
        resource: 'user',
        action: 'delete',
      };

      const mockCreatedPermission: Permission = {
        id: 3,
        name: 'user:delete',
        description: '删除用户',
        resource: 'user',
        action: 'delete',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      ((permissionService as any).permissionMapper.insert as jest.Mock).mockResolvedValue(3);
      ((permissionService as any).permissionMapper.selectById as jest.Mock).mockResolvedValue(mockCreatedPermission);

      const result = await permissionService.create(permissionData);

      expect(result).toEqual(mockCreatedPermission);
      expect(((permissionService as any).permissionMapper.insert as jest.Mock)).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('应该成功更新权限', async () => {
      const updateData = {
        description: '更新后的描述',
      };

      const mockUpdatedPermission: Permission = {
        id: 1,
        name: 'user:view',
        description: '更新后的描述',
        resource: 'user',
        action: 'view',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      ((permissionService as any).permissionMapper.updateById as jest.Mock).mockResolvedValue(1);
      ((permissionService as any).permissionMapper.selectById as jest.Mock).mockResolvedValue(mockUpdatedPermission);

      const result = await permissionService.update(1, updateData);

      expect(result).toEqual(mockUpdatedPermission);
      expect(((permissionService as any).permissionMapper.updateById as jest.Mock)).toHaveBeenCalledWith(1, expect.any(Object));
    });
  });

  describe('delete', () => {
    it('应该成功删除权限', async () => {
      ((permissionService as any).permissionMapper.deleteById as jest.Mock).mockResolvedValue(1);

      const result = await permissionService.delete(1);

      expect(result).toBe(true);
      expect(((permissionService as any).permissionMapper.deleteById as jest.Mock)).toHaveBeenCalledWith(1);
    });

    it('当权限不存在时应该返回 false', async () => {
      ((permissionService as any).permissionMapper.deleteById as jest.Mock).mockResolvedValue(0);

      const result = await permissionService.delete(999);

      expect(result).toBe(false);
    });
  });
});
