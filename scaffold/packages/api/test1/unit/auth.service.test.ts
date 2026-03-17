import { describe, it, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../../src/service/auth.service.js';

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'mocked-token'),
    verify: vi.fn(),
  },
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserMapper: any;
  let mockUserRoleMapper: any;
  let mockRoleMapper: any;
  let mockRoleMenuMapper: any;
  let mockMenuMapper: any;

  beforeEach(() => {
    mockUserMapper = {
      selectByUsername: vi.fn(),
      selectById: vi.fn(),
    };

    mockUserRoleMapper = {
      selectList: vi.fn(),
    };

    mockRoleMapper = {
      selectById: vi.fn(),
    };

    mockRoleMenuMapper = {
      selectList: vi.fn(),
    };

    mockMenuMapper = {
      selectById: vi.fn(),
    };

    authService = new AuthService();
    (authService as any).userMapper = mockUserMapper;
    (authService as any).userRoleMapper = mockUserRoleMapper;
    (authService as any).roleMapper = mockRoleMapper;
    (authService as any).roleMenuMapper = mockRoleMenuMapper;
    (authService as any).menuMapper = mockMenuMapper;
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        passwordHash: 'hashedPassword',
        status: 1,
        realName: 'Admin',
        email: 'admin@example.com',
      };

      mockUserMapper.selectByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);
      mockUserRoleMapper.selectList.mockResolvedValue([
        { userId: 1, roleId: 1 },
      ]);
      mockRoleMapper.selectById.mockResolvedValue({
        id: 1,
        roleCode: 'admin',
        status: 1,
      });
      mockRoleMenuMapper.selectList.mockResolvedValue([
        { roleId: 1, menuId: 1 },
      ]);
      mockMenuMapper.selectById.mockResolvedValue({
        id: 1,
        permission: 'user:view',
      });

      const result = await authService.login({
        username: 'admin',
        password: 'password123',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.userInfo).toBeDefined();
      expect(result.userInfo.username).toBe('admin');
    });

    it('should throw error when user not found', async () => {
      mockUserMapper.selectByUsername.mockResolvedValue(null);

      await expect(
        authService.login({ username: 'nonexistent', password: 'password' }),
      ).rejects.toThrow('用户名或密码错误');
    });

    it('should throw error when user is disabled', async () => {
      mockUserMapper.selectByUsername.mockResolvedValue({
        id: 1,
        username: 'admin',
        passwordHash: 'hashedPassword',
        status: 0,
      });

      await expect(
        authService.login({ username: 'admin', password: 'password' }),
      ).rejects.toThrow('账户已被禁用');
    });

    it('should throw error when password is incorrect', async () => {
      mockUserMapper.selectByUsername.mockResolvedValue({
        id: 1,
        username: 'admin',
        passwordHash: 'hashedPassword',
        status: 1,
      });
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        authService.login({ username: 'admin', password: 'wrongpassword' }),
      ).rejects.toThrow('用户名或密码错误');
    });
  });

  describe('getUserInfo', () => {
    it('should return user info with roles and permissions', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        passwordHash: 'hashedPassword',
        status: 1,
        realName: 'Admin',
        email: 'admin@example.com',
      };

      mockUserMapper.selectById.mockResolvedValue(mockUser);
      mockUserRoleMapper.selectList.mockResolvedValue([
        { userId: 1, roleId: 1 },
      ]);
      mockRoleMapper.selectById.mockResolvedValue({
        id: 1,
        roleCode: 'admin',
        status: 1,
      });
      mockRoleMenuMapper.selectList.mockResolvedValue([
        { roleId: 1, menuId: 1 },
      ]);
      mockMenuMapper.selectById.mockResolvedValue({
        id: 1,
        permission: 'user:view',
      });

      const result = await authService.getUserInfo(1);

      expect(result.username).toBe('admin');
      expect(result.roles).toContain('admin');
      expect(result.permissions).toContain('user:view');
      expect(result.password).toBeUndefined();
    });

    it('should throw error when user not found', async () => {
      mockUserMapper.selectById.mockResolvedValue(null);

      await expect(authService.getUserInfo(999)).rejects.toThrow('用户不存在');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        passwordHash: 'hashedPassword',
        status: 1,
      };

      (jwt.verify as any).mockResolvedValue({ userId: 1 });
      mockUserMapper.selectById.mockResolvedValue(mockUser);
      mockUserRoleMapper.selectList.mockResolvedValue([]);
      mockRoleMapper.selectById.mockResolvedValue(null);
      mockRoleMenuMapper.selectList.mockResolvedValue([]);

      const result = await authService.refreshToken('valid-refresh-token');

      expect(result.accessToken).toBeDefined();
    });

    it('should throw error when user not found or disabled', async () => {
      (jwt.verify as any).mockResolvedValue({ userId: 1 });
      mockUserMapper.selectById.mockResolvedValue(null);

      await expect(
        authService.refreshToken('valid-token'),
      ).rejects.toThrow('用户不存在或已禁用');
    });
  });
});
