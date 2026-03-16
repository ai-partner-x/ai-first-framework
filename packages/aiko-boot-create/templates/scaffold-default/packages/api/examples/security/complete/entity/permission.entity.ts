import { Entity, TableId, TableField, Column } from '@ai-partner-x/aiko-boot-starter-orm';

@Entity({ tableName: 'permissions' })
export class Permission {
  @TableId()
  id!: number;

  @TableField()
  @Column()
  name!: string;

  @TableField()
  @Column()
  description!: string;

  @TableField()
  @Column()
  resource!: string;

  @TableField()
  @Column()
  action!: string;

  @TableField()
  @Column()
  createdAt!: Date;

  @TableField()
  @Column()
  updatedAt!: Date;
}
