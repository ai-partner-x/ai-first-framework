import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoleService } from '../../src/service/role.service.js';

describe('RoleService', () => {
  let roleService: RoleService;
  let mockRoleMapper: any;
  let mockRoleMenuMapper: any;

  beforeEach(() => {
    mockRoleMapper = {
      selectList: vi.fn(),
      selectById: vi.fn(),
      insert: vi.fn(),
      updateById: vi.fn(),
      deleteById: vi.fn(),
    };

    mockRoleMenuMapper = {
      selectList: vi.fn(),
      delete: vi.fn(),
      insert: vi.fn(),
    };

    roleService = new RoleService();
    (roleService as any).roleMapper = mockRoleMapper;
    (roleService as any).roleMenuMapper = mockRoleMenuMapper;
  });

  describe('listRoles', () => {
    it('should return all roles', async () => {
      const mockRoles = [
        { id: 1, roleCode: 'admin', roleName: 'Admin' },
        { id: 2, roleCode: 'user', roleName: 'User' },
      ];

      mockRoleMapper.selectList.mockResolvedValue(mockRoles);

      const result = await roleService.listRoles();

      expect(result).toHaveLength(2);
      expect(result[0].roleCode).toBe('admin');
    });
  });

  describe('getById', () => {
    it('should return role with menu ids', async () => {
      const mockRole = {
        id: 1,
        roleCode: 'admin',
        roleName: 'Admin',
      };

      mockRoleMapper.selectById.mockResolvedValue(mockRole);
      mockRoleMenuMapper.selectList.mockResolvedValue([
        { roleId: 1, menuId: 1 },
        { roleId: 1, menuId: 2 },
      ]);

      const result = await roleService.getById(1);

      expect(result.roleCode).toBe('admin');
      expect(result.menuIds).toEqual([1, 2]);
    });

    it('should throw error when role not found', async () => {
      mockRoleMapper.selectById.mockResolvedValue(null);

      await expect(roleService.getById(999)).rejects.toThrow('角色不存在');
    });
  });

  describe('createRole', () => {
    it('should create role successfully', async () => {
      mockRoleMapper.selectList
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { id: 1, roleCode: 'newrole', roleName: 'New Role' },
        ]);
      mockRoleMapper.insert.mockResolvedValue(1);

      const result = await roleService.createRole({
        roleCode: 'newrole',
        roleName: 'New Role',
      });

      expect(result.roleCode).toBe('newrole');
      expect(mockRoleMapper.insert).toHaveBeenCalled();
    });

    it('should throw error when role code exists', async () => {
      mockRoleMapper.selectList.mockResolvedValue([
        { id: 1, roleCode: 'existing' },
      ]);

      await expect(
        roleService.createRole({
          roleCode: 'existing',
          roleName: 'Existing Role',
        }),
      ).rejects.toThrow('角色编码已存在');
    });

    it('should assign menus when menuIds provided', async () => {
      mockRoleMapper.selectList
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { id: 1, roleCode: 'newrole', roleName: 'New Role' },
        ]);
      mockRoleMapper.insert.mockResolvedValue(1);
      mockRoleMenuMapper.delete.mockResolvedValue(1);
      mockRoleMenuMapper.insert.mockResolvedValue(1);

      await roleService.createRole({
        roleCode: 'newrole',
        roleName: 'New Role',
        menuIds: [1, 2],
      });

      expect(mockRoleMenuMapper.delete).toHaveBeenCalled();
      expect(mockRoleMenuMapper.insert).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateRole', () => {
    it('should update role successfully', async () => {
      const mockRole = {
        id: 1,
        roleCode: 'admin',
        roleName: 'Admin',
        status: 1,
      };

      mockRoleMapper.selectById.mockResolvedValue(mockRole);
      mockRoleMapper.updateById.mockResolvedValue(1);
      mockRoleMenuMapper.selectList.mockResolvedValue([]);

      const result = await roleService.updateRole(1, {
        roleName: 'Updated Admin',
      });

      expect(result.roleName).toBe('Updated Admin');
    });

    it('should throw error when role not found', async () => {
      mockRoleMapper.selectById.mockResolvedValue(null);

      await expect(
        roleService.updateRole(999, { roleName: 'Test' }),
      ).rejects.toThrow('角色不存在');
    });

    it('should update menu ids when menuIds provided', async () => {
      const mockRole = {
        id: 1,
        roleCode: 'admin',
        roleName: 'Admin',
        status: 1,
      };

      mockRoleMapper.selectById.mockResolvedValue(mockRole);
      mockRoleMapper.updateById.mockResolvedValue(1);
      mockRoleMenuMapper.delete.mockResolvedValue(1);
      mockRoleMenuMapper.insert.mockResolvedValue(1);

      await roleService.updateRole(1, { menuIds: [1, 2] });

      expect(mockRoleMenuMapper.delete).toHaveBeenCalled();
      expect(mockRoleMenuMapper.insert).toHaveBeenCalledTimes(2);
    });
  });

  describe('deleteRole', () => {
    it('should delete role successfully', async () => {
      const mockRole = {
        id: 1,
        roleCode: 'admin',
        roleName: 'Admin',
      };

      mockRoleMapper.selectById.mockResolvedValue(mockRole);
      mockRoleMenuMapper.delete.mockResolvedValue(1);
      mockRoleMapper.deleteById.mockResolvedValue(1);

      const result = await roleService.deleteRole(1);

      expect(result).toBeTruthy();
      expect(mockRoleMenuMapper.delete).toHaveBeenCalledWith({ roleId: 1 });
    });

    it('should throw error when role not found', async () => {
      mockRoleMapper.selectById.mockResolvedValue(null);

      await expect(roleService.deleteRole(999)).rejects.toThrow('角色不存在');
    });
  });

  describe('getRoleMenuIds', () => {
    it('should return menu ids for role', async () => {
      mockRoleMenuMapper.selectList.mockResolvedValue([
        { roleId: 1, menuId: 1 },
        { roleId: 1, menuId: 2 },
        { roleId: 1, menuId: 3 },
      ]);

      const result = await roleService.getRoleMenuIds(1);

      expect(result).toEqual([1, 2, 3]);
    });

    it('should return empty array when no menus', async () => {
      mockRoleMenuMapper.selectList.mockResolvedValue([]);

      const result = await roleService.getRoleMenuIds(1);

      expect(result).toEqual([]);
    });
  });
});
