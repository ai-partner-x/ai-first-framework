import 'reflect-metadata';
import {
  RestController, GetMapping, PostMapping, PutMapping, DeleteMapping,
  PathVariable, RequestBody, RequestParam,
} from '@ai-partner-x/aiko-boot-starter-web';
import { Autowired } from '@ai-partner-x/aiko-boot/di/server';
import { MenuService } from '../service/menu.service.js';
import type { CreateMenuDto, UpdateMenuDto } from '../dto/menu.dto.js';

@RestController({ path: '/sys/menu' })
export class MenuController {
  @Autowired()
  private menuService!: MenuService;

  @GetMapping('/tree')
  async getFullTree() {
    return this.menuService.getFullTree();
  }

  @GetMapping('/user-tree')
  async getUserTree(@RequestParam('_perms') perms: string) {
    const permissions = perms ? perms.split(',').filter(Boolean) : [];
    return this.menuService.getUserMenuTree(permissions);
  }

  @GetMapping('/:id')
  async getById(@PathVariable('id') id: string) {
    return this.menuService.getById(Number(id));
  }

  @PostMapping()
  async create(@RequestBody() dto: CreateMenuDto) {
    return this.menuService.createMenu(dto);
  }

  @PutMapping('/:id')
  async update(@PathVariable('id') id: string, @RequestBody() dto: UpdateMenuDto) {
    return this.menuService.updateMenu(Number(id), dto);
  }

  @DeleteMapping('/:id')
  async delete(@PathVariable('id') id: string) {
    await this.menuService.deleteMenu(Number(id));
    return { message: '删除成功' };
  }
}
