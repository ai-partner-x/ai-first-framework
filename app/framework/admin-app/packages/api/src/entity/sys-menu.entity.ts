import { Entity, TableId, TableField } from '@ai-partner-x/aiko-boot-starter-orm';

@Entity({ tableName: 'sys_menu' })
export class SysMenu {
  @TableId({ type: 'AUTO' })
  id!: number;

  @TableField({ column: 'parent_id' })
  parentId!: number; // 0 为顶级

  @TableField({ column: 'menu_name' })
  menuName!: string;

  @TableField({ column: 'menu_type' })
  menuType!: number; // 1目录 2菜单 3按钮

  @TableField({ column: 'path' })
  path?: string;

  @TableField({ column: 'component' })
  component?: string;

  @TableField({ column: 'permission' })
  permission?: string; // 权限标识，如 sys:user:list

  @TableField({ column: 'icon' })
  icon?: string;

  @TableField({ column: 'sort_order' })
  sortOrder!: number;

  @TableField({ column: 'status' })
  status!: number;
}
