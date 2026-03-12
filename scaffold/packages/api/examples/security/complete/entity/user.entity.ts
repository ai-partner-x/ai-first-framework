import { Entity, TableId, TableField, Column } from '@ai-partner-x/aiko-boot-starter-orm';

@Entity({ tableName: 'users' })
export class User {
  @TableId()
  id!: number;

  @TableField()
  @Column()
  username!: string;

  @TableField()
  @Column()
  email!: string;

  @TableField()
  @Column()
  password!: string;

  @TableField()
  @Column()
  enabled!: boolean;

  @TableField()
  @Column()
  provider!: string;

  @TableField()
  @Column()
  providerId!: string;

  @TableField()
  @Column()
  avatar!: string;

  @TableField()
  @Column()
  createdAt!: Date;

  @TableField()
  @Column()
  updatedAt!: Date;

  roles?: Role[];
  permissions?: Permission[];
}
