import 'reflect-metadata';
import {
  RestController, GetMapping, PostMapping, PutMapping, DeleteMapping,
  PathVariable, RequestBody, RequestParam,
} from '@ai-partner-x/aiko-boot-starter-web';
import { Autowired } from '@ai-partner-x/aiko-boot/di/server';
import { ApiPermission, ButtonPermission } from '@ai-partner-x/aiko-boot-starter-security';
import { MenuService } from '../service/menu.service.js';
import type { CreateMenuDto, UpdateMenuDto } from '../dto/menu.dto.js';

@RestController({ path: '/sys/menu' })
export class MenuController {
  @Autowired(MenuService)
  private menuService!: MenuService;

  @GetMapping('/tree')
  @ApiPermission('menu', 'tree', {
    description: '查看菜单树',
    group: '菜单管理',
  })
  async getFullTree() {
    return this.menuService.getFullTree();
  }

  @GetMapping('/user-tree')
  @ApiPermission('menu', 'user-tree', {
    description: '查看用户菜单树',
    group: '菜单管理',
  })
  async getUserTree(@RequestParam('_perms') perms: string) {
    const permissions = perms ? perms.split(',').filter(Boolean) : [];
    return this.menuService.getUserMenuTree(permissions);
  }

  @GetMapping('/:id')
  @ApiPermission('menu', 'read', {
    description: '查看菜单详情',
    group: '菜单管理',
  })
  async getById(@PathVariable('id') id: string) {
    return this.menuService.getById(Number(id));
  }

  @PostMapping()
  @ApiPermission('menu', 'create', {
    description: '创建菜单',
    group: '菜单管理',
  })
  @ButtonPermission('menu', 'create', {
    description: '创建菜单按钮',
    group: '菜单管理',
    buttonId: 'btn-create-menu',
  })
  async create(@RequestBody() dto: CreateMenuDto) {
    return this.menuService.createMenu(dto);
  }

  @PutMapping('/:id')
  @ApiPermission('menu', 'update', {
    description: '更新菜单',
    group: '菜单管理',
  })
  @ButtonPermission('menu', 'update', {
    description: '更新菜单按钮',
    group: '菜单管理',
    buttonId: 'btn-update-menu',
  })
  async update(@PathVariable('id') id: string, @RequestBody() dto: UpdateMenuDto) {
    return this.menuService.updateMenu(Number(id), dto);
  }

  @DeleteMapping('/:id')
  @ApiPermission('menu', 'delete', {
    description: '删除菜单',
    group: '菜单管理',
  })
  @ButtonPermission('menu', 'delete', {
    description: '删除菜单按钮',
    group: '菜单管理',
    buttonId: 'btn-delete-menu',
  })
  async delete(@PathVariable('id') id: string) {
    await this.menuService.deleteMenu(Number(id));
    return { message: '删除成功' };
  }
}
