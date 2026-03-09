/**
 * 用户数据仓库（SQLite/ORM 数据库层）
 *
 * 使用 @ai-partner-x/aiko-boot-starter-orm 的 @Mapper + BaseMapper<User> 提供 CRUD 能力，
 * 通过 Kysely 驱动 SQLite（也可切换为 PostgreSQL / MySQL）。
 *
 * 由 DI 容器管理，通过 @Autowired 注入到 UserCacheService。
 *
 * 对应 Java Spring Boot:
 * @Repository
 * public interface UserRepository extends JpaRepository<User, Long> { ... }
 */

import 'reflect-metadata';
import { Mapper, BaseMapper } from '@ai-partner-x/aiko-boot-starter-orm';
import { User } from './user.entity.js';

@Mapper(User)
export class UserRepository extends BaseMapper<User> {
  async findByEmail(email: string): Promise<User | null> {
    const list = await this.selectList({ email } as Partial<User>);
    return list.length > 0 ? list[0] : null;
  }
}
