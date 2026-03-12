import { Entity, TableId, TableField, Column } from '@ai-partner-x/aiko-boot-starter-orm';

@Entity({ tableName: 'role_permissions' })
export class RolePermission {
  @TableId()
  id!: number;

  @TableField()
  @Column()
  roleId!: number;

  @TableField()
  @Column()
  permissionId!: number;

  @TableField()
  @Column()
  createdAt!: Date;
}
