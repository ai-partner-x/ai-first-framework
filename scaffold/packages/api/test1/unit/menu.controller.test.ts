import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MenuController } from '../../src/controller/menu.controller.js';

describe('MenuController', () => {
  let controller: MenuController;
  let mockMenuService: any;

  beforeEach(() => {
    mockMenuService = {
      getFullTree: vi.fn(),
      getUserMenuTree: vi.fn(),
      getById: vi.fn(),
      createMenu: vi.fn(),
      updateMenu: vi.fn(),
      deleteMenu: vi.fn(),
    };

    controller = new MenuController();
    (controller as any).menuService = mockMenuService;
  });

  describe('getFullTree', () => {
    it('should return full menu tree', async () => {
      const mockTree = [
        { id: 1, menuName: '系统管理', children: [] },
      ];
      mockMenuService.getFullTree.mockResolvedValue(mockTree);

      const result = await controller.getFullTree();

      expect(mockMenuService.getFullTree).toHaveBeenCalled();
      expect(result).toEqual(mockTree);
    });
  });

  describe('getUserTree', () => {
    it('should return user menu tree with permissions', async () => {
      const mockTree = [
        { id: 1, menuName: '系统管理', children: [{ id: 2, menuName: '用户管理' }] },
      ];
      mockMenuService.getUserMenuTree.mockResolvedValue(mockTree);

      const result = await controller.getUserTree('user:view,user:edit');

      expect(mockMenuService.getUserMenuTree).toHaveBeenCalledWith(['user:view', 'user:edit']);
      expect(result).toEqual(mockTree);
    });

    it('should handle empty permissions', async () => {
      mockMenuService.getUserMenuTree.mockResolvedValue([]);

      const result = await controller.getUserTree('');

      expect(mockMenuService.getUserMenuTree).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should return menu by id', async () => {
      const mockMenu = { id: 1, menuName: '系统管理' };
      mockMenuService.getById.mockResolvedValue(mockMenu);

      const result = await controller.getById('1');

      expect(mockMenuService.getById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMenu);
    });
  });

  describe('create', () => {
    it('should create menu', async () => {
      const mockDto = { menuName: '新菜单', parentId: 0 };
      const mockResult = { id: 1, ...mockDto };
      mockMenuService.createMenu.mockResolvedValue(mockResult);

      const result = await controller.create(mockDto);

      expect(mockMenuService.createMenu).toHaveBeenCalledWith(mockDto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('update', () => {
    it('should update menu', async () => {
      const mockDto = { menuName: '更新菜单' };
      const mockResult = { id: 1, ...mockDto };
      mockMenuService.updateMenu.mockResolvedValue(mockResult);

      const result = await controller.update('1', mockDto);

      expect(mockMenuService.updateMenu).toHaveBeenCalledWith(1, mockDto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('delete', () => {
    it('should delete menu', async () => {
      mockMenuService.deleteMenu.mockResolvedValue(true);

      const result = await controller.delete('1');

      expect(mockMenuService.deleteMenu).toHaveBeenCalledWith(1);
      expect(result).toEqual({ message: '删除成功' });
    });
  });
});
