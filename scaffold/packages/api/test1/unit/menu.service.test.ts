import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MenuService } from '../../src/service/menu.service.js';

describe('MenuService', () => {
  let menuService: MenuService;
  let mockMenuMapper: any;

  beforeEach(() => {
    mockMenuMapper = {
      selectList: vi.fn(),
      selectById: vi.fn(),
      insert: vi.fn(),
      updateById: vi.fn(),
      deleteById: vi.fn(),
    };

    menuService = new MenuService();
    (menuService as any).menuMapper = mockMenuMapper;
  });

  describe('getFullTree', () => {
    it('should return full menu tree', async () => {
      const mockMenus = [
        { id: 1, parentId: 0, menuName: 'System', menuType: 1, sortOrder: 1 },
        { id: 2, parentId: 1, menuName: 'User', menuType: 2, sortOrder: 1 },
        { id: 3, parentId: 1, menuName: 'Role', menuType: 2, sortOrder: 2 },
        { id: 4, parentId: 0, menuName: 'Config', menuType: 1, sortOrder: 2 },
      ];

      mockMenuMapper.selectList.mockResolvedValue(mockMenus);

      const result = await menuService.getFullTree();

      expect(result).toHaveLength(2);
      expect(result[0].menuName).toBe('System');
      expect(result[0].children).toHaveLength(2);
      expect(result[1].menuName).toBe('Config');
    });

    it('should return empty array when no menus', async () => {
      mockMenuMapper.selectList.mockResolvedValue([]);

      const result = await menuService.getFullTree();

      expect(result).toHaveLength(0);
    });

    it('should sort children by sortOrder', async () => {
      const mockMenus = [
        { id: 1, parentId: 0, menuName: 'System', menuType: 1, sortOrder: 1 },
        { id: 3, parentId: 1, menuName: 'Z-Menu', menuType: 2, sortOrder: 3 },
        { id: 2, parentId: 1, menuName: 'A-Menu', menuType: 2, sortOrder: 1 },
      ];

      mockMenuMapper.selectList.mockResolvedValue(mockMenus);

      const result = await menuService.getFullTree();

      expect(result[0].children[0].menuName).toBe('A-Menu');
      expect(result[0].children[1].menuName).toBe('Z-Menu');
    });
  });

  describe('getUserMenuTree', () => {
    it('should return menu tree filtered by permissions for buttons', async () => {
      const mockMenus = [
        { id: 1, parentId: 0, menuName: 'System', menuType: 1, sortOrder: 1, status: 1 },
        { id: 2, parentId: 1, menuName: 'User', menuType: 2, sortOrder: 1, status: 1 },
        { id: 3, parentId: 1, menuName: 'Role', menuType: 3, sortOrder: 2, status: 1, permission: 'role:view' },
        { id: 4, parentId: 1, menuName: 'Hidden', menuType: 3, sortOrder: 3, status: 1, permission: 'secret:access' },
      ];

      mockMenuMapper.selectList.mockResolvedValue(mockMenus);

      const result = await menuService.getUserMenuTree(['role:view']);

      expect(result).toHaveLength(1);
      expect(result[0].children).toHaveLength(2);
      expect(result[0].children.map((c: any) => c.menuName)).toContain('Role');
      expect(result[0].children.map((c: any) => c.menuName)).not.toContain('Hidden');
    });

    it('should include all menu types except buttons without permission', async () => {
      const mockMenus = [
        { id: 1, parentId: 0, menuName: 'System', menuType: 1, sortOrder: 1, status: 1 },
        { id: 2, parentId: 0, menuName: 'Link', menuType: 4, sortOrder: 2, status: 1 },
      ];

      mockMenuMapper.selectList.mockResolvedValue(mockMenus);

      const result = await menuService.getUserMenuTree([]);

      expect(result).toHaveLength(2);
    });
  });

  describe('getById', () => {
    it('should return menu by id', async () => {
      const mockMenu = {
        id: 1,
        menuName: 'System',
        parentId: 0,
      };

      mockMenuMapper.selectById.mockResolvedValue(mockMenu);

      const result = await menuService.getById(1);

      expect(result.menuName).toBe('System');
    });

    it('should throw error when menu not found', async () => {
      mockMenuMapper.selectById.mockResolvedValue(null);

      await expect(menuService.getById(999)).rejects.toThrow('菜单不存在');
    });
  });

  describe('createMenu', () => {
    it('should create menu successfully', async () => {
      mockMenuMapper.insert.mockResolvedValue(1);
      mockMenuMapper.selectList.mockResolvedValueOnce([
        { id: 1, menuName: 'New Menu', parentId: 0, menuType: 1 },
      ]);

      const result = await menuService.createMenu({
        menuName: 'New Menu',
        menuType: 1,
      });

      expect(result.menuName).toBe('New Menu');
      expect(mockMenuMapper.insert).toHaveBeenCalled();
    });

    it('should throw error when insert fails', async () => {
      mockMenuMapper.insert.mockResolvedValue(0);

      await expect(
        menuService.createMenu({
          menuName: 'New Menu',
          menuType: 1,
        }),
      ).rejects.toThrow('创建菜单失败');
    });

    it('should use default values when not provided', async () => {
      mockMenuMapper.insert.mockResolvedValue(1);
      mockMenuMapper.selectList.mockResolvedValueOnce([
        { id: 1, menuName: 'Test', parentId: 0, menuType: 1, sortOrder: 0, status: 1 },
      ]);

      await menuService.createMenu({
        menuName: 'Test',
        menuType: 1,
        parentId: 0,
        sortOrder: 0,
        status: 1,
      });

      const insertCall = mockMenuMapper.insert.mock.calls[0][0];
      expect(insertCall.parentId).toBe(0);
      expect(insertCall.sortOrder).toBe(0);
      expect(insertCall.status).toBe(1);
    });
  });

  describe('updateMenu', () => {
    it('should update menu successfully', async () => {
      const mockMenu = {
        id: 1,
        menuName: 'Old Name',
        parentId: 0,
        menuType: 1,
      };

      mockMenuMapper.selectById.mockResolvedValue(mockMenu);
      mockMenuMapper.updateById.mockResolvedValue(1);

      const result = await menuService.updateMenu(1, {
        menuName: 'New Name',
      });

      expect(result.menuName).toBe('New Name');
    });

    it('should throw error when menu not found', async () => {
      mockMenuMapper.selectById.mockResolvedValue(null);

      await expect(
        menuService.updateMenu(999, { menuName: 'Test' }),
      ).rejects.toThrow('菜单不存在');
    });
  });

  describe('deleteMenu', () => {
    it('should delete menu successfully when no children', async () => {
      mockMenuMapper.selectList.mockResolvedValue([]);
      mockMenuMapper.deleteById.mockResolvedValue(1);

      const result = await menuService.deleteMenu(1);

      expect(result).toBeTruthy();
      expect(mockMenuMapper.deleteById).toHaveBeenCalledWith(1);
    });

    it('should throw error when menu has children', async () => {
      mockMenuMapper.selectList.mockResolvedValue([
        { id: 2, parentId: 1 },
      ]);

      await expect(menuService.deleteMenu(1)).rejects.toThrow('存在子菜单，无法删除');
    });
  });
});
