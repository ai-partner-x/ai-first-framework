import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthController } from '../../src/controller/auth.controller.js';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: any;

  beforeEach(() => {
    mockAuthService = {
      login: vi.fn(),
      refreshToken: vi.fn(),
      getUserInfo: vi.fn(),
    };

    controller = new AuthController();
    (controller as any).authService = mockAuthService;
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockDto = { username: 'admin', password: '123456' };
      const mockResult = {
        accessToken: 'token',
        refreshToken: 'refresh',
        userInfo: { id: 1, username: 'admin' },
      };
      mockAuthService.login.mockResolvedValue(mockResult);

      const result = await controller.login(mockDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(mockDto);
      expect(result).toEqual(mockResult);
    });

    it('should propagate login errors', async () => {
      mockAuthService.login.mockRejectedValue(new Error('登录失败'));

      await expect(controller.login({ username: 'admin', password: 'wrong' })).rejects.toThrow('登录失败');
    });
  });

  describe('refresh', () => {
    it('should refresh token successfully', async () => {
      const mockDto = { refreshToken: 'valid-refresh-token' };
      const mockResult = { accessToken: 'new-access-token' };
      mockAuthService.refreshToken.mockResolvedValue(mockResult);

      const result = await controller.refresh(mockDto);

      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(result).toEqual(mockResult);
    });
  });

  describe('getUserInfo', () => {
    it('should return user info', async () => {
      const mockUserInfo = { id: 1, username: 'admin', roles: ['admin'] };
      mockAuthService.getUserInfo.mockResolvedValue(mockUserInfo);

      const result = await controller.getUserInfo('1');

      expect(mockAuthService.getUserInfo).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUserInfo);
    });
  });
});
