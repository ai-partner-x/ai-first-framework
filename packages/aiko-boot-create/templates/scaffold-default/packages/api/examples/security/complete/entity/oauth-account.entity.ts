import { Entity, TableId, TableField, Column } from '@ai-partner-x/aiko-boot-starter-orm';

@Entity({ tableName: 'oauth_accounts' })
export class OAuthAccount {
  @TableId()
  id!: number;

  @TableField()
  @Column()
  userId!: number;

  @TableField()
  @Column()
  provider!: string;

  @TableField()
  @Column()
  providerId!: string;

  @TableField()
  @Column()
  accessToken!: string;

  @TableField()
  @Column()
  refreshToken!: string;

  @TableField()
  @Column()
  expiresAt!: Date;

  @TableField()
  @Column()
  createdAt!: Date;

  @TableField()
  @Column()
  updatedAt!: Date;
}
