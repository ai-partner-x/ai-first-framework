/**
 * 用户实体
 *
 * 使用 @ai-partner-x/aiko-boot-starter-orm 的 @Entity/@TableId/@TableField 装饰器，
 * 对应 SQLite 表 cache_user。
 *
 * 对应 Java Spring Boot:
 * @Entity
 * @Table(name = "cache_user")
 * public class User { ... }
 */

import { Entity, TableId, TableField } from '@ai-partner-x/aiko-boot-starter-orm';

@Entity({ tableName: 'cache_user' })
export class User {
  @TableId({ type: 'AUTO' })
  id!: number;

  @TableField()
  name!: string;

  @TableField()
  email!: string;

  @TableField()
  age?: number;
}
