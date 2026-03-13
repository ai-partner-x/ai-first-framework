import { describe, it, expect } from 'vitest';
import { Menu } from '../../src/entity/menu.entity.js';

describe('Menu Entity', () => {
  it('should create menu instance with required fields', () => {
    const menu = new Menu();
    menu.id = 1;
    menu.parentId = 0;
    menu.menuName = '系统管理';
    menu.menuType = 1;
    menu.sortOrder = 1;
    menu.status = 1;

    expect(menu.id).toBe(1);
    expect(menu.parentId).toBe(0);
    expect(menu.menuName).toBe('系统管理');
    expect(menu.menuType).toBe(1);
    expect(menu.sortOrder).toBe(1);
    expect(menu.status).toBe(1);
  });

  it('should handle directory menu type', () => {
    const menu = new Menu();
    menu.menuType = 1;
    menu.menuName = '系统管理';

    expect(menu.menuType).toBe(1);
    expect(menu.menuName).toBe('系统管理');
  });

  it('should handle menu item menu type', () => {
    const menu = new Menu();
    menu.menuType = 2;
    menu.menuName = '用户管理';
    menu.path = '/user';
    menu.component = '/user/index';

    expect(menu.menuType).toBe(2);
    expect(menu.path).toBe('/user');
    expect(menu.component).toBe('/user/index');
  });

  it('should handle button menu type', () => {
    const menu = new Menu();
    menu.menuType = 3;
    menu.menuName = '新增用户';
    menu.permission = 'user:create';

    expect(menu.menuType).toBe(3);
    expect(menu.permission).toBe('user:create');
  });

  it('should allow optional fields', () => {
    const menu = new Menu();
    menu.icon = 'user';
    menu.path = '/system';
    menu.component = 'system/index';
    menu.permission = 'system:view';

    expect(menu.icon).toBe('user');
    expect(menu.path).toBe('/system');
    expect(menu.component).toBe('system/index');
    expect(menu.permission).toBe('system:view');
  });
});
