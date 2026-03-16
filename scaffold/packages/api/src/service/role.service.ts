import 'reflect-metadata';
import { Service, Transactional } from '@ai-partner-x/aiko-boot';
import { Autowired } from '@ai-partner-x/aiko-boot/di/server';
import { RoleMapper } from '../mapper/role.mapper.js';
import { RoleMenuMapper } from '../mapper/role-menu.mapper.js';
import type { CreateRoleDto, UpdateRoleDto } from '../dto/role.dto.js';

@Service()
export class RoleService {
  @Autowired(RoleMapper)
  private roleMapper!: RoleMapper;

  @Autowired(RoleMenuMapper)
  private roleMenuMapper!: RoleMenuMapper;

  async listRoles() {
    return this.roleMapper.selectList();
  }

  async getById(id: number) {
    const role = await this.roleMapper.selectById(id);
    if (!role) throw new Error('角色不存在');
    const roleMenus = await this.roleMenuMapper.selectList({ roleId: id });
    const menuIds: number[] = [];
    for (let i = 0; i < roleMenus.length; i++) {
      const rm = roleMenus[i];
      menuIds.push(rm.menuId);
    }
    return { ...role, menuIds: menuIds };
  }

  @Transactional()
  async createRole(dto: CreateRoleDto) {
    console.log("dto", dto);
    const exists = await this.roleMapper.selectList({ roleCode: dto.roleCode });
    if (exists.length) throw new Error('角色编码已存在');
    const status = dto.status !== undefined ? dto.status : 1;
    await this.roleMapper.insert({
      roleCode: dto.roleCode,
      roleName: dto.roleName,
      description: dto.description,
      status: status,
      createdAt: new Date().toISOString(),
    });
    const roles = await this.roleMapper.selectList({ roleCode: dto.roleCode });
    const role = roles[0];
    console.error("role", role);
    if (!role) throw new Error('创建角色失败');
    if (dto.menuIds !== undefined && dto.menuIds.length > 0) await this.assignMenus(role.id, dto.menuIds);
    return role;
  }

  @Transactional()
  async updateRole(id: number, dto: UpdateRoleDto) {
    const role = await this.roleMapper.selectById(id);
    if (!role) throw new Error('角色不存在');
    if (dto.roleName !== undefined) role.roleName = dto.roleName;
    if (dto.description !== undefined) role.description = dto.description;
    if (dto.status !== undefined) role.status = dto.status;
    await this.roleMapper.updateById(role);  
    if (dto.menuIds !== undefined) await this.assignMenus(id, dto.menuIds);
    return role;
  }

  async deleteRole(id: number): Promise<boolean> {
    const role = await this.roleMapper.selectById(id);
    if (!role) throw new Error('角色不存在');
    await this.roleMenuMapper.delete({ roleId: id });
    return this.roleMapper.deleteById(id);
  }

  async getRoleMenuIds(roleId: number): Promise<number[]> {
    const roleMenus = await this.roleMenuMapper.selectList({ roleId });
    const menuIds: number[] = [];
    for (let i = 0; i < roleMenus.length; i++) {
      const rm = roleMenus[i];
      menuIds.push(rm.menuId);
    }
    return menuIds;
  }

  private async assignMenus(roleId: number, menuIds: number[]) {
    await this.roleMenuMapper.delete({ roleId });
    for (const menuId of menuIds) {
      await this.roleMenuMapper.insert({ roleId, menuId });
    }
  }
}
