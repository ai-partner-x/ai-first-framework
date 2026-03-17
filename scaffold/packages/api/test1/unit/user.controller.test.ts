import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserController } from '../../src/controller/user.controller.js';

describe('UserController', () => {
  let controller: UserController;
  let mockUserService: any;

  beforeEach(() => {
    mockUserService = {
      pageUsers: vi.fn(),
      getById: vi.fn(),
      createUser: vi.fn(),
      updateUser: vi.fn(),
      deleteUser: vi.fn(),
      resetPassword: vi.fn(),
    };

    controller = new UserController();
    (controller as any).userService = mockUserService;
  });

  describe('page', () => {
    it('should return paginated users', async () => {
      const mockResult = {
        list: [{ id: 1, username: 'admin' }],
        total: 1,
      };
      mockUserService.pageUsers.mockResolvedValue(mockResult);

      const result = await controller.page('1', '10', 'admin', '1');

      expect(mockUserService.pageUsers).toHaveBeenCalledWith({
        pageNo: 1,
        pageSize: 10,
        username: 'admin',
        status: 1,
      });
      expect(result).toEqual(mockResult);
    });

    it('should use default values when params are empty', async () => {
      mockUserService.pageUsers.mockResolvedValue({ list: [], total: 0 });

      await controller.page('', '', '', '');

      expect(mockUserService.pageUsers).toHaveBeenCalledWith({
        pageNo: 1,
        pageSize: 10,
        username: undefined,
        status: undefined,
      });
    });

    it('should handle undefined status', async () => {
      mockUserService.pageUsers.mockResolvedValue({ list: [], total: 0 });

      await controller.page('1', '10', 'admin', undefined);

      expect(mockUserService.pageUsers).toHaveBeenCalledWith({
        pageNo: 1,
        pageSize: 10,
        username: 'admin',
        status: undefined,
      });
    });
  });

  describe('getById', () => {
    it('should return user by id', async () => {
      const mockUser = { id: 1, username: 'admin' };
      mockUserService.getById.mockResolvedValue(mockUser);

      const result = await controller.getById('1');

      expect(mockUserService.getById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('should create user', async () => {
      const mockDto = { username: 'test', password: '123456' };
      const mockResult = { id: 1, ...mockDto };
      mockUserService.createUser.mockResolvedValue(mockResult);

      const result = await controller.create(mockDto);

      expect(mockUserService.createUser).toHaveBeenCalledWith(mockDto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const mockDto = { realName: 'Test User' };
      const mockResult = { id: 1, ...mockDto };
      mockUserService.updateUser.mockResolvedValue(mockResult);

      const result = await controller.update('1', mockDto);

      expect(mockUserService.updateUser).toHaveBeenCalledWith(1, mockDto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      mockUserService.deleteUser.mockResolvedValue(true);

      const result = await controller.delete('1');

      expect(mockUserService.deleteUser).toHaveBeenCalledWith(1);
      expect(result).toEqual({ message: '删除成功' });
    });
  });

  describe('resetPassword', () => {
    it('should reset password', async () => {
      mockUserService.resetPassword.mockResolvedValue(true);

      const result = await controller.resetPassword('1', { newPassword: 'newpass123' });

      expect(mockUserService.resetPassword).toHaveBeenCalledWith(1, 'newpass123');
      expect(result).toEqual({ message: '密码重置成功' });
    });
  });
});
