import 'reflect-metadata';
import { Service, Transactional } from '@ai-partner-x/aiko-boot';
import { Autowired } from '@ai-partner-x/aiko-boot/di/server';
import { MenuMapper } from '../mapper/menu.mapper.js';
import { Menu } from '../entity/menu.entity.js';
import type { CreateMenuDto, UpdateMenuDto, MenuTreeVo } from '../dto/menu.dto.js';

@Service()
export class MenuService {
  @Autowired(MenuMapper)
  private menuMapper!: MenuMapper;

  async getFullTree(): Promise<MenuTreeVo[]> {
    const all = await this.menuMapper.selectList();
    return this.buildTree(all, 0);
  }

  async getUserMenuTree(permissions: string[]): Promise<MenuTreeVo[]> {
    const all = await this.menuMapper.selectList({ status: 1 });
    const visible: any[] = [];
    for (let i = 0; i < all.length; i++) {
      const m = all[i];
      if (m.menuType === 3) {
        if (m.permission && permissions.includes(m.permission)) {
          visible.push(m);
        }
      } else {
        visible.push(m);
      }
    }
    return this.buildTree(visible, 0);
  }

  async getById(id: number) {
    const menu = await this.menuMapper.selectById(id);
    if (!menu) throw new Error('菜单不存在');
    return menu;
  }

  @Transactional()
  async createMenu(dto: CreateMenuDto) {
    const menu: Menu = {
      id: 0,
      parentId: dto.parentId !== undefined ? dto.parentId : 0,
      menuName: dto.menuName,
      menuType: dto.menuType,
      path: dto.path,
      component: dto.component,
      permission: dto.permission,
      icon: dto.icon,
      sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : 0,
      status: dto.status !== undefined ? dto.status : 1,
    };
    const result:number = await this.menuMapper.insert(menu);
    console.log("result", result);
    if (result !== 1) {
      throw new Error('创建菜单失败');
    }
    const menus = await this.menuMapper.selectList({ id: menu.id });
    return menus[0] || null;
  }

  @Transactional()
  async updateMenu(id: number, dto: UpdateMenuDto) {
    const menu = await this.menuMapper.selectById(id);
    if (!menu) throw new Error('菜单不存在');
    Object.assign(menu, dto);
    await this.menuMapper.updateById(menu);
    return menu;
  }

  async deleteMenu(id: number): Promise<boolean> {
    const children = await this.menuMapper.selectList({ parentId: id });
    if (children.length) throw new Error('存在子菜单，无法删除');
    return this.menuMapper.deleteById(id);
  }

  private buildTree(menus: any[], parentId: number): MenuTreeVo[] {
    const result: MenuTreeVo[] = [];
    for (let i = 0; i < menus.length; i++) {
      const m = menus[i];
      if (m.parentId === parentId) {
        const children = this.buildTree(menus, m.id);
        const item: MenuTreeVo = { ...m };
        if (children.length > 0) {
          item.children = children;
        }
        result.push(item);
      }
    }
    result.sort((a, b) => a.sortOrder - b.sortOrder);
    return result;
  }
}
