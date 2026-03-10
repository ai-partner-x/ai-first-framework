import { Entity, TableId, TableField } from '@ai-partner-x/aiko-boot-starter-orm';

@Entity({ tableName: 'sys_role_menu' })
export class SysRoleMenu {
  @TableId({ type: 'AUTO' })
  id!: number;

  @TableField({ column: 'role_id' })
  roleId!: number;

  @TableField({ column: 'menu_id' })
  menuId!: number;
}
