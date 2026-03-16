import { Entity, TableId, TableField, Column } from '@ai-partner-x/aiko-boot-starter-orm';

@Entity({ tableName: 'user_roles' })
export class UserRole {
    @TableId()
    id!: number;

    @TableField()
    @Column()
    userId!: number;

    @TableField()
    @Column()
    roleId!: number;

    @TableField()
    @Column()
    createdAt!: Date;
}
