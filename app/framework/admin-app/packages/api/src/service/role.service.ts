import 'reflect-metadata';
import { Injectable, Autowired } from '@ai-partner-x/aiko-boot/di/server';
import { SysRoleMapper } from '../mapper/sys-role.mapper.js';
import { SysRoleMenuMapper } from '../mapper/sys-role-menu.mapper.js';
import type { CreateRoleDto, UpdateRoleDto } from '../dto/role.dto.js';

@Injectable()
export class RoleService {
  @Autowired()
  private roleMapper!: SysRoleMapper;

  @Autowired()
  private roleMenuMapper!: SysRoleMenuMapper;

  async listRoles() {
    return (await this.roleMapper.selectList()).map(r => this.parseEntityDates(r));
  }

  async getById(id: number) {
    let role = await this.roleMapper.selectById(id);
    if (!role) throw new Error('角色不存在');
    role = this.parseEntityDates(role);
    const roleMenus = await this.roleMenuMapper.selectList({ roleId: id });
    return { ...role, menuIds: roleMenus.map((rm: any) => rm.menuId) };
  }


  async createRole(dto: CreateRoleDto) {
    const exists = await this.roleMapper.selectList({ roleCode: dto.roleCode });
    if (exists.length) throw new Error('角色编码已存在');
    const role = await this.roleMapper.insert({
      roleCode: dto.roleCode,
      roleName: dto.roleName,
      description: dto.description,
      status: dto.status ?? 1,
      createdAt: new Date().toISOString(),
    });
    if (dto.menuIds?.length) {
      const roleId = typeof role === 'number' ? role : (role.id || role);
      await this.assignMenus(roleId, dto.menuIds);
    }
    return this.parseEntityDates(role);
  }


  async updateRole(id: number, dto: UpdateRoleDto) {
    let role = await this.roleMapper.selectById(id);
    if (!role) throw new Error('角色不存在');
    role = this.parseEntityDates(role);
    if (dto.roleName !== undefined) role.roleName = dto.roleName;
    if (dto.description !== undefined) role.description = dto.description;
    if (dto.status !== undefined) role.status = dto.status;
    await this.roleMapper.updateById(this.formatEntityDates(role));
    if (dto.menuIds !== undefined) await this.assignMenus(id, dto.menuIds);
    return this.parseEntityDates(role);
  }

  async deleteRole(id: number): Promise<boolean> {
    const role = await this.roleMapper.selectById(id);
    if (!role) throw new Error('角色不存在');
    await this.roleMenuMapper.delete({ roleId: id });
    return this.roleMapper.deleteById(id);
  }

  async getRoleMenuIds(roleId: number): Promise<number[]> {
    const roleMenus = await this.roleMenuMapper.selectList({ roleId });
    return roleMenus.map((rm: any) => rm.menuId);
  }

  private async assignMenus(roleId: number, menuIds: number[]) {
    await this.roleMenuMapper.delete({ roleId });
    for (const menuId of menuIds) {
      await this.roleMenuMapper.insert({ roleId, menuId });
    }
  }

  private parseEntityDates(entity: any): any {
    const parsed = { ...entity };
    if (parsed.createdAt && typeof parsed.createdAt === 'string') {
      parsed.createdAt = new Date(parsed.createdAt);
    }
    return parsed;
  }

  private formatEntityDates(entity: any): any {
    const formatted = { ...entity };
    if (formatted.createdAt && formatted.createdAt instanceof Date) {
      formatted.createdAt = formatted.createdAt.toISOString();
    }
    return formatted;
  }
}