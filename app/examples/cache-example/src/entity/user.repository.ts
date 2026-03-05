/**
 * 用户数据仓库（模拟数据库层）
 *
 * 使用 @Service 注册到 DI 容器，可被 @RedisComponent 通过 @Autowired 注入。
 *
 * 对应 Java Spring Boot:
 * @Repository
 * public class UserRepository { ... }
 */

import { Service } from '@ai-first/core';
import { type User } from './user.entity.js';

@Service()
export class UserRepository {
  private db: Map<number, User> = new Map([
    [1, { id: 1, name: '张三', email: 'zhangsan@example.com', age: 25 }],
    [2, { id: 2, name: '李四', email: 'lisi@example.com', age: 30 }],
    [3, { id: 3, name: '王五', email: 'wangwu@example.com', age: 22 }],
  ]);
  private nextId = 4;

  findById(id: number): User | null {
    return this.db.get(id) ?? null;
  }

  findAll(): User[] {
    return [...this.db.values()];
  }

  save(data: Omit<User, 'id'>): User {
    const user: User = { id: this.nextId++, ...data };
    this.db.set(user.id, user);
    return user;
  }

  update(id: number, data: Partial<Omit<User, 'id'>>): User {
    const existing = this.db.get(id);
    if (!existing) throw new Error(`用户 ${id} 不存在`);
    const updated: User = { ...existing, ...data };
    this.db.set(id, updated);
    return updated;
  }

  remove(id: number): boolean {
    return this.db.delete(id);
  }
}
