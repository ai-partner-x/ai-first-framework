import { describe, it, expect } from 'vitest';
import { Role } from '../../src/entity/role.entity.js';

describe('Role Entity', () => {
  it('should create role instance with required fields', () => {
    const role = new Role();
    role.id = 1;
    role.roleCode = 'admin';
    role.roleName = '管理员';
    role.status = 1;

    expect(role.id).toBe(1);
    expect(role.roleCode).toBe('admin');
    expect(role.roleName).toBe('管理员');
    expect(role.status).toBe(1);
  });

  it('should allow optional description', () => {
    const role = new Role();
    role.description = '系统管理员角色';

    expect(role.description).toBe('系统管理员角色');
  });

  it('should handle date fields', () => {
    const role = new Role();
    const now = new Date();
    role.createdAt = now;

    expect(role.createdAt).toEqual(now);
  });
});
