import 'reflect-metadata';
import { Injectable, Autowired } from '@ai-partner-x/aiko-boot/di/server';
import { SysMenuMapper } from '../mapper/sys-menu.mapper.js';
import type { CreateMenuDto, UpdateMenuDto, MenuTreeVo } from '../dto/menu.dto.js';

@Injectable()
export class MenuService {
  @Autowired()
  private menuMapper!: SysMenuMapper;

  async getFullTree(): Promise<MenuTreeVo[]> {
    const all = await this.menuMapper.selectList();
    return this.buildTree(all, 0);
  }

  async getUserMenuTree(permissions: string[]): Promise<MenuTreeVo[]> {
    const all = await this.menuMapper.selectList({ status: 1 });
    // 按钮类型(3)只检查权限，目录和菜单直接显示
    const visible = all.filter((m: any) => {
      if (m.menuType === 3) return m.permission && permissions.includes(m.permission);
      return true;
    });
    return this.buildTree(visible, 0);
  }

  async getById(id: number) {
    const menu = await this.menuMapper.selectById(id);
    if (!menu) throw new Error('菜单不存在');
    return menu;
  }

  async createMenu(dto: CreateMenuDto) {
    return this.menuMapper.insert({
      parentId: dto.parentId ?? 0,
      menuName: dto.menuName,
      menuType: dto.menuType,
      path: dto.path,
      component: dto.component,
      permission: dto.permission,
      icon: dto.icon,
      sortOrder: dto.sortOrder ?? 0,
      status: dto.status ?? 1,
    });
  }

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
    return menus
      .filter(m => m.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(m => ({ ...m, children: this.buildTree(menus, m.id) }))
      .map(m => (m.children.length === 0 ? { ...m, children: undefined } : m));
  }
}
