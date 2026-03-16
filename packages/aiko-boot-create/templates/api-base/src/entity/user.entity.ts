import { Entity, TableId, TableField } from '@ai-partner-x/aiko-boot-starter-orm';

@Entity({ tableName: 'sys_user' })
export class User {
  @TableId({ type: 'AUTO' })
  id!: number;

  @TableField({ column: 'user_name' })
  username!: string;

  @TableField({ column: 'password_hash' })
  passwordHash!: string;

  @TableField({ column: 'real_name' })
  realName?: string;

  @TableField({ column: 'email' })
  email!: string;

  @TableField({ column: 'phone' })
  phone?: string;

  @TableField({ column: 'status' })
  status!: number; // 1启用 0禁用

  @TableField({ column: 'created_at' })
  createdAt?: Date;

  @TableField({ column: 'updated_at' })
  updatedAt?: Date;
}

