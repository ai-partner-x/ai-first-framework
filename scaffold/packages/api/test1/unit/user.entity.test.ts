import { describe, it, expect } from 'vitest';
import { User } from '../../src/entity/user.entity.js';

describe('User Entity', () => {
  it('should create user instance with required fields', () => {
    const user = new User();
    user.id = 1;
    user.username = 'admin';
    user.passwordHash = 'hashed_password';
    user.email = 'admin@example.com';
    user.status = 1;

    expect(user.id).toBe(1);
    expect(user.username).toBe('admin');
    expect(user.passwordHash).toBe('hashed_password');
    expect(user.email).toBe('admin@example.com');
    expect(user.status).toBe(1);
  });

  it('should allow optional fields', () => {
    const user = new User();
    user.realName = '管理员';
    user.phone = '13800138000';

    expect(user.realName).toBe('管理员');
    expect(user.phone).toBe('13800138000');
  });

  it('should handle date fields', () => {
    const user = new User();
    const now = new Date();
    user.createdAt = now;
    user.updatedAt = now;

    expect(user.createdAt).toEqual(now);
    expect(user.updatedAt).toEqual(now);
  });
});
