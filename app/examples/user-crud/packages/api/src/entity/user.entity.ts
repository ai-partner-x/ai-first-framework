import { Entity, TableId, TableField } from '@ai-first/orm';

@Entity({ tableName: 'sys_user' })
export class User {
  @TableId({ type: 'AUTO' })
  id!: number;

  @TableField({ column: 'user_name' })
  username!: string;

  @TableField()
  email!: string;

  @TableField()
  age?: number;

  @TableField({ column: 'created_at' })
  createdAt?: Date;

  @TableField({ column: 'updated_at' })
  updatedAt?: Date;
}
