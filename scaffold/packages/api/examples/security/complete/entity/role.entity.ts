import { Entity, TableId, TableField, Column } from '@ai-partner-x/aiko-boot-starter-orm';

@Entity({ tableName: 'roles' })
export class Role {
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
  createdAt!: Date;

  @TableField()
  @Column()
  updatedAt!: Date;

  permissions?: Permission[];
}
