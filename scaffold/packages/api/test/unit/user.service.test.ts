import { describe, it, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { UserService } from '../../src/service/user.service.js';

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
  },
}));

describe('UserService', () => {
  let userService: UserService;
  let mockUserMapper: any;
  let mockUserRoleMapper: any;
  let mockRoleMapper: any;

  beforeEach(() => {
    mockUserMapper = {
      selectList: vi.fn(),
      selectById: vi.fn(),
      selectByUsername: vi.fn(),
      insert: vi.fn(),
      updateById: vi.fn(),
      deleteById: vi.fn(),
    };

    mockUserRoleMapper = {
      selectList: vi.fn(),
      delete: vi.fn(),
      insert: vi.fn(),
    };

    mockRoleMapper = {
      selectById: vi.fn(),
    };

    userService = new UserService();
    (userService as any).userMapper = mockUserMapper;
    (userService as any).userRoleMapper = mockUserRoleMapper;
    (userService as any).roleMapper = mockRoleMapper;
  });

  describe('pageUsers', () => {
    it('should return paginated users with default pagination', async () => {
      const mockUsers = [
        { id: 1, username: 'admin', status: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 2, username: 'test', status: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 3, username: 'user', status: 0, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ];

      mockUserMapper.selectList.mockResolvedValue(mockUsers);
      mockUserRoleMapper.selectList.mockResolvedValue([]);
      mockRoleMapper.selectById.mockResolvedValue(null);

      const result = await userService.pageUsers({ pageNo: 1, pageSize: 10 });

      expect(result.records).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.pageNo).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should filter users by username', async () => {
      const mockUsers = [
        { id: 1, username: 'admin', status: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 2, username: 'admin2', status: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 3, username: 'user', status: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ];

      mockUserMapper.selectList.mockResolvedValue(mockUsers);
      mockUserRoleMapper.selectList.mockResolvedValue([]);
      mockRoleMapper.selectById.mockResolvedValue(null);

      const result = await userService.pageUsers({ pageNo: 1, pageSize: 10, username: 'admin' });

      expect(result.records).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter users by status', async () => {
      const mockUsers = [
        { id: 1, username: 'admin', status: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 2, username: 'user', status: 0, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ];

      mockUserMapper.selectList.mockResolvedValue(mockUsers);
      mockUserRoleMapper.selectList.mockResolvedValue([]);
      mockRoleMapper.selectById.mockResolvedValue(null);

      const result = await userService.pageUsers({ pageNo: 1, pageSize: 10, status: 1 });

      expect(result.records).toHaveLength(1);
      expect(result.records[0].username).toBe('admin');
    });

    it('should return empty array when no users', async () => {
      mockUserMapper.selectList.mockResolvedValue([]);

      const result = await userService.pageUsers({ pageNo: 1, pageSize: 10 });

      expect(result.records).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getById', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        status: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      mockUserMapper.selectById.mockResolvedValue(mockUser);
      mockUserRoleMapper.selectList.mockResolvedValue([]);
      mockRoleMapper.selectById.mockResolvedValue(null);

      const result = await userService.getById(1);

      expect(result.username).toBe('admin');
    });

    it('should throw error when user not found', async () => {
      mockUserMapper.selectById.mockResolvedValue(null);

      await expect(userService.getById(999)).rejects.toThrow('用户不存在');
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      mockUserMapper.selectByUsername
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 1,
          username: 'newuser',
          status: 1,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        });
      (bcrypt.hash as any).mockResolvedValue('hashedPassword');
      mockUserMapper.insert.mockResolvedValue(1);
      mockUserRoleMapper.selectList.mockResolvedValue([]);
      mockRoleMapper.selectById.mockResolvedValue(null);

      const result = await userService.createUser({
        username: 'newuser',
        password: 'password123',
        email: 'test@example.com',
      });

      expect(result.username).toBe('newuser');
      expect(mockUserMapper.insert).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should throw error when username exists', async () => {
      mockUserMapper.selectByUsername.mockResolvedValue({
        id: 1,
        username: 'existinguser',
      });

      await expect(
        userService.createUser({
          username: 'existinguser',
          password: 'password123',
        }),
      ).rejects.toThrow('用户名已存在');
    });

    it('should assign roles when roleIds provided', async () => {
      mockUserMapper.selectByUsername
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 1,
          username: 'newuser',
          status: 1,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        });
      (bcrypt.hash as any).mockResolvedValue('hashedPassword');
      mockUserMapper.insert.mockResolvedValue(1);
      mockUserRoleMapper.selectList.mockResolvedValue([]);
      mockRoleMapper.selectById.mockResolvedValue(null);
      mockUserRoleMapper.delete.mockResolvedValue(1);
      mockUserRoleMapper.insert.mockResolvedValue(1);

      await userService.createUser({
        username: 'newuser',
        password: 'password123',
        roleIds: [1, 2],
      });

      expect(mockUserRoleMapper.delete).toHaveBeenCalled();
      expect(mockUserRoleMapper.insert).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        status: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      mockUserMapper.selectById.mockResolvedValue(mockUser);
      mockUserMapper.updateById.mockResolvedValue(1);
      mockUserRoleMapper.selectList.mockResolvedValue([]);
      mockRoleMapper.selectById.mockResolvedValue(null);

      const result = await userService.updateUser(1, {
        realName: 'Updated Name',
        email: 'updated@example.com',
      });

      expect(result.realName).toBe('Updated Name');
    });

    it('should throw error when user not found', async () => {
      mockUserMapper.selectById.mockResolvedValue(null);

      await expect(
        userService.updateUser(999, { realName: 'Test' }),
      ).rejects.toThrow('用户不存在');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        status: 1,
      };

      mockUserMapper.selectById.mockResolvedValue(mockUser);
      mockUserRoleMapper.delete.mockResolvedValue(1);
      mockUserMapper.deleteById.mockResolvedValue(1);

      const result = await userService.deleteUser(1);

      expect(result).toBeTruthy();
      expect(mockUserRoleMapper.delete).toHaveBeenCalledWith({ userId: 1 });
    });

    it('should throw error when user not found', async () => {
      mockUserMapper.selectById.mockResolvedValue(null);

      await expect(userService.deleteUser(999)).rejects.toThrow('用户不存在');
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        passwordHash: 'oldHash',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      mockUserMapper.selectById.mockResolvedValue(mockUser);
      (bcrypt.hash as any).mockResolvedValue('newHash');
      mockUserMapper.updateById.mockResolvedValue(1);

      await userService.resetPassword(1, 'newpassword123');

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(mockUserMapper.updateById).toHaveBeenCalled();
    });

    it('should throw error when user not found', async () => {
      mockUserMapper.selectById.mockResolvedValue(null);

      await expect(
        userService.resetPassword(999, 'newpassword'),
      ).rejects.toThrow('用户不存在');
    });
  });
});
