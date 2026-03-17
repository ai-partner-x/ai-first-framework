import { describe, it, expect } from 'vitest';
import { CreateMenuDto, UpdateMenuDto, MenuTreeVo } from '../../src/dto/menu.dto.js';

describe('Menu DTO', () => {
  describe('CreateMenuDto', () => {
    it('should create CreateMenuDto with required fields', () => {
      const dto = new CreateMenuDto();
      dto.menuName = '系统管理';
      dto.menuType = 1;

      expect(dto.menuName).toBe('系统管理');
      expect(dto.menuType).toBe(1);
      expect(dto.parentId).toBe(0);
      expect(dto.sortOrder).toBe(0);
      expect(dto.status).toBe(1);
    });

    it('should allow optional fields', () => {
      const dto = new CreateMenuDto();
      dto.parentId = 1;
      dto.menuName = '用户管理';
      dto.menuType = 2;
      dto.path = '/user';
      dto.component = '/user/index';
      dto.permission = 'user:view';
      dto.icon = 'user';
      dto.sortOrder = 1;

      expect(dto.parentId).toBe(1);
      expect(dto.path).toBe('/user');
      expect(dto.component).toBe('/user/index');
      expect(dto.permission).toBe('user:view');
      expect(dto.icon).toBe('user');
      expect(dto.sortOrder).toBe(1);
    });

    it('should handle button menu type', () => {
      const dto = new CreateMenuDto();
      dto.menuName = '新增用户';
      dto.menuType = 3;
      dto.permission = 'user:create';

      expect(dto.menuType).toBe(3);
      expect(dto.permission).toBe('user:create');
    });
  });

  describe('UpdateMenuDto', () => {
    it('should create UpdateMenuDto with optional fields', () => {
      const dto = new UpdateMenuDto();
      dto.menuName = '更新菜单';
      dto.status = 0;
      dto.sortOrder = 5;

      expect(dto.menuName).toBe('更新菜单');
      expect(dto.status).toBe(0);
      expect(dto.sortOrder).toBe(5);
    });

    it('should allow undefined fields', () => {
      const dto = new UpdateMenuDto();

      expect(dto.menuName).toBeUndefined();
      expect(dto.status).toBeUndefined();
    });
  });

  describe('MenuTreeVo', () => {
    it('should create MenuTreeVo with children', () => {
      const vo: MenuTreeVo = {
        id: 1,
        parentId: 0,
        menuName: '系统管理',
        menuType: 1,
        sortOrder: 1,
        status: 1,
        children: [
          {
            id: 2,
            parentId: 1,
            menuName: '用户管理',
            menuType: 2,
            sortOrder: 1,
            status: 1,
          },
        ],
      };

      expect(vo.id).toBe(1);
      expect(vo.menuName).toBe('系统管理');
      expect(vo.children).toHaveLength(1);
      expect(vo.children![0].menuName).toBe('用户管理');
    });

    it('should handle nested children', () => {
      const vo: MenuTreeVo = {
        id: 1,
        parentId: 0,
        menuName: '系统管理',
        menuType: 1,
        sortOrder: 1,
        status: 1,
        children: [
          {
            id: 2,
            parentId: 1,
            menuName: '用户管理',
            menuType: 2,
            sortOrder: 1,
            status: 1,
            children: [
              {
                id: 3,
                parentId: 2,
                menuName: '新增用户',
                menuType: 3,
                sortOrder: 1,
                status: 1,
                permission: 'user:create',
              },
            ],
          },
        ],
      };

      expect(vo.children![0].children).toHaveLength(1);
      expect(vo.children![0].children![0].permission).toBe('user:create');
    });
  });
});
