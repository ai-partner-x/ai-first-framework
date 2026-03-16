import { describe, it, expect } from '@jest/globals';
import { User, Role, Permission } from '../../entity/index.js';

describe('Test Helpers', () => {
  describe('createMockUser', () => {
    it('应该创建模拟用户对象', () => {
      const user = createMockUser({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
      });

      expect(user).toHaveProperty('id', 1);
      expect(user).toHaveProperty('username', 'testuser');
      expect(user).toHaveProperty('email', 'test@example.com');
      expect(user).toHaveProperty('password');
      expect(user).toHaveProperty('enabled', true);
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
    });
  });

  describe('createMockRole', () => {
    it('应该创建模拟角色对象', () => {
      const role = createMockRole({
        id: 1,
        name: 'ADMIN',
        description: '管理员',
      });

      expect(role).toHaveProperty('id', 1);
      expect(role).toHaveProperty('name', 'ADMIN');
      expect(role).toHaveProperty('description', '管理员');
      expect(role).toHaveProperty('createdAt');
      expect(role).toHaveProperty('updatedAt');
    });
  });

  describe('createMockPermission', () => {
    it('应该创建模拟权限对象', () => {
      const permission = createMockPermission({
        id: 1,
        name: 'user:view',
        description: '查看用户',
        resource: 'user',
        action: 'view',
      });

      expect(permission).toHaveProperty('id', 1);
      expect(permission).toHaveProperty('name', 'user:view');
      expect(permission).toHaveProperty('description', '查看用户');
      expect(permission).toHaveProperty('resource', 'user');
      expect(permission).toHaveProperty('action', 'view');
      expect(permission).toHaveProperty('createdAt');
      expect(permission).toHaveProperty('updatedAt');
    });
  });
});

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    enabled: true,
    provider: 'local',
    providerId: '',
    avatar: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockRole(overrides: Partial<Role> = {}): Role {
  return {
    id: 1,
    name: 'TEST_ROLE',
    description: '测试角色',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockPermission(overrides: Partial<Permission> = {}): Permission {
  return {
    id: 1,
    name: 'test:permission',
    description: '测试权限',
    resource: 'test',
    action: 'test',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockAuthResponse(overrides: any = {}) {
  return {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
    user: createMockUser(),
    ...overrides,
  };
}

export function createMockErrorResponse(message: string, statusCode: number = 400) {
  return {
    error: message,
    statusCode,
  };
}

export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function createMockMapper() {
  return {
    selectList: jest.fn(),
    selectById: jest.fn(),
    insert: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
  };
}
