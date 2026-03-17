import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoleController } from '../../src/controller/role.controller.js';

describe('RoleController', () => {
  let controller: RoleController;
  let mockRoleService: any;

  beforeEach(() => {
    mockRoleService = {
      listRoles: vi.fn(),
      getById: vi.fn(),
      createRole: vi.fn(),
      updateRole: vi.fn(),
      deleteRole: vi.fn(),
      getRoleMenuIds: vi.fn(),
    };

    controller = new RoleController();
    (controller as any).roleService = mockRoleService;
  });

  describe('list', () => {
    it('should return all roles', async () => {
      const mockRoles = [
        { id: 1, roleCode: 'admin', roleName: '管理员' },
        { id: 2, roleCode: 'user', roleName: '普通用户' },
      ];
      mockRoleService.listRoles.mockResolvedValue(mockRoles);

      const result = await controller.list();

      expect(mockRoleService.listRoles).toHaveBeenCalled();
      expect(result).toEqual(mockRoles);
    });
  });

  describe('getById', () => {
    it('should return role by id', async () => {
      const mockRole = { id: 1, roleCode: 'admin', roleName: '管理员' };
      mockRoleService.getById.mockResolvedValue(mockRole);

      const result = await controller.getById('1');

      expect(mockRoleService.getById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockRole);
    });
  });

  describe('create', () => {
    it('should create role', async () => {
      const mockDto = { roleCode: 'test', roleName: '测试角色' };
      const mockResult = { id: 1, ...mockDto };
      mockRoleService.createRole.mockResolvedValue(mockResult);

      const result = await controller.create(mockDto);

      expect(mockRoleService.createRole).toHaveBeenCalledWith(mockDto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('update', () => {
    it('should update role', async () => {
      const mockDto = { roleName: '新角色名' };
      const mockResult = { id: 1, ...mockDto };
      mockRoleService.updateRole.mockResolvedValue(mockResult);

      const result = await controller.update('1', mockDto);

      expect(mockRoleService.updateRole).toHaveBeenCalledWith(1, mockDto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('delete', () => {
    it('should delete role', async () => {
      mockRoleService.deleteRole.mockResolvedValue(true);

      const result = await controller.delete('1');

      expect(mockRoleService.deleteRole).toHaveBeenCalledWith(1);
      expect(result).toEqual({ message: '删除成功' });
    });
  });

  describe('getRoleMenus', () => {
    it('should return role menus', async () => {
      const mockMenus = [1, 2, 3];
      mockRoleService.getRoleMenuIds.mockResolvedValue(mockMenus);

      const result = await controller.getRoleMenus('1');

      expect(mockRoleService.getRoleMenuIds).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMenus);
    });
  });

  describe('assignMenus', () => {
    it('should assign menus to role', async () => {
      const mockResult = { id: 1, menuIds: [1, 2, 3] };
      mockRoleService.updateRole.mockResolvedValue(mockResult);

      const result = await controller.assignMenus('1', { menuIds: [1, 2, 3] });

      expect(mockRoleService.updateRole).toHaveBeenCalledWith(1, { menuIds: [1, 2, 3] });
      expect(result).toEqual(mockResult);
    });
  });
});
