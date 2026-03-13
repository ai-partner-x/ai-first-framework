import { describe, it, expect, beforeEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../src/utils/jwt.util.js';

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
}));

describe('JWT Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signAccessToken', () => {
    it('should sign access token with correct payload', () => {
      const payload = {
        userId: 1,
        username: 'admin',
        roles: ['admin'],
        permissions: ['user:view'],
      };

      (jwt.sign as any).mockReturnValue('access-token-mock');

      const result = signAccessToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        expect.any(String),
        { expiresIn: '2h' },
      );
      expect(result).toBe('access-token-mock');
    });
  });

  describe('signRefreshToken', () => {
    it('should sign refresh token with userId', () => {
      const payload = { userId: 1 };

      (jwt.sign as any).mockReturnValue('refresh-token-mock');

      const result = signRefreshToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        expect.any(String),
        { expiresIn: '7d' },
      );
      expect(result).toBe('refresh-token-mock');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify access token and return payload', () => {
      const mockPayload = {
        userId: 1,
        username: 'admin',
        roles: ['admin'],
        permissions: ['user:view'],
      };

      (jwt.verify as any).mockReturnValue(mockPayload);

      const result = verifyAccessToken('valid-token');

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
      expect(result).toEqual(mockPayload);
    });

    it('should throw error for invalid token', () => {
      (jwt.verify as any).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => verifyAccessToken('invalid-token')).toThrow('Invalid token');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify refresh token and return userId', () => {
      const mockPayload = { userId: 1 };

      (jwt.verify as any).mockReturnValue(mockPayload);

      const result = verifyRefreshToken('valid-refresh-token');

      expect(jwt.verify).toHaveBeenCalledWith('valid-refresh-token', expect.any(String));
      expect(result).toEqual(mockPayload);
    });
  });
});
