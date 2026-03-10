import { Entity, TableId, TableField } from '@ai-partner-x/aiko-boot-starter-orm';

@Entity({ tableName: 'sys_role' })
export class SysRole {
  @TableId({ type: 'AUTO' })
  id!: number;

  @TableField({ column: 'role_code' })
  roleCode!: string;

  @TableField({ column: 'role_name' })
  roleName!: string;

  @TableField({ column: 'description' })
  description?: string;

  @TableField({ column: 'status' })
  status!: number;

  @TableField({ column: 'created_at' })
  createdAt?: Date;
}
