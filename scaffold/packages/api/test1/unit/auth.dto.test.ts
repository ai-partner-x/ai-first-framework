import { describe, it, expect } from 'vitest';
import { LoginDto, RefreshTokenDto, LoginResultDto } from '../../src/dto/auth.dto.js';

describe('Auth DTO', () => {
  describe('LoginDto', () => {
    it('should create LoginDto with required fields', () => {
      const dto = new LoginDto();
      dto.username = 'admin';
      dto.password = '123456';

      expect(dto.username).toBe('admin');
      expect(dto.password).toBe('123456');
    });

    it('should handle long username', () => {
      const dto = new LoginDto();
      dto.username = 'a'.repeat(50);
      dto.password = '123456';

      expect(dto.username).toHaveLength(50);
    });
  });

  describe('RefreshTokenDto', () => {
    it('should create RefreshTokenDto with token', () => {
      const dto = new RefreshTokenDto();
      dto.refreshToken = 'valid-refresh-token';

      expect(dto.refreshToken).toBe('valid-refresh-token');
    });
  });

  describe('LoginResultDto', () => {
    it('should create LoginResultDto with complete data', () => {
      const dto = new LoginResultDto();
      dto.accessToken = 'access-token-xxx';
      dto.refreshToken = 'refresh-token-xxx';
      dto.userInfo = {
        id: 1,
        username: 'admin',
        realName: '管理员',
        email: 'admin@example.com',
        roles: ['admin'],
        permissions: ['user:view', 'user:edit'],
      };

      expect(dto.accessToken).toBe('access-token-xxx');
      expect(dto.refreshToken).toBe('refresh-token-xxx');
      expect(dto.userInfo.id).toBe(1);
      expect(dto.userInfo.username).toBe('admin');
      expect(dto.userInfo.roles).toContain('admin');
      expect(dto.userInfo.permissions).toContain('user:view');
    });

    it('should handle minimal userInfo', () => {
      const dto = new LoginResultDto();
      dto.accessToken = 'token';
      dto.refreshToken = 'refresh';
      dto.userInfo = {
        id: 1,
        username: 'admin',
        roles: [],
        permissions: [],
      };

      expect(dto.userInfo.realName).toBeUndefined();
      expect(dto.userInfo.email).toBeUndefined();
      expect(dto.userInfo.roles).toEqual([]);
    });
  });
});
