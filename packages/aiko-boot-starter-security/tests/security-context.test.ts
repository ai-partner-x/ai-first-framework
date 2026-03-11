import { describe, it, expect, beforeEach } from 'vitest';
import { SecurityContext } from '../src/context/security.context.js';
import type { User } from '../src/entities/index.js';

describe('SecurityContext', function() {
  let context: SecurityContext;

  beforeEach(function() {
    context = new SecurityContext();
  });

  const createTestUser = function(): User {
    return {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      enabled: true,
      roles: [
        { id: 1, name: 'ADMIN' },
        { id: 2, name: 'MANAGER' },
      ],
    };
  };

  describe('setCurrentUser / getCurrentUser', function() {
    it('should set and get current user', function() {
      const user = createTestUser();
      context.setCurrentUser(user);

      expect(context.getCurrentUser()).toEqual(user);
    });

    it('should set current user to null', function() {
      context.setCurrentUser(createTestUser());
      context.setCurrentUser(null);

      expect(context.getCurrentUser()).toBeNull();
    });

    it('should return null when no user is set', function() {
      expect(context.getCurrentUser()).toBeNull();
    });
  });

  describe('setCurrentRequest / getCurrentRequest', function() {
    it('should set and get current request', function() {
      const request = { path: '/api/test', method: 'GET' };
      context.setCurrentRequest(request);

      expect(context.getCurrentRequest()).toEqual(request);
    });

    it('should set user from request if present', function() {
      const user = createTestUser();
      const request = { path: '/api/test', user: user };
      context.setCurrentRequest(request);

      expect(context.getCurrentUser()).toEqual(user);
    });

    it('should not set user if request has no user', function() {
      const request = { path: '/api/test' };
      context.setCurrentRequest(request);

      expect(context.getCurrentUser()).toBeNull();
    });
  });

  describe('isAuthenticated', function() {
    it('should return true when user is set', function() {
      context.setCurrentUser(createTestUser());

      expect(context.isAuthenticated()).toBe(true);
    });

    it('should return false when user is null', function() {
      expect(context.isAuthenticated()).toBe(false);
    });

    it('should return false after clear', function() {
      context.setCurrentUser(createTestUser());
      context.clear();

      expect(context.isAuthenticated()).toBe(false);
    });
  });

  describe('hasRole', function() {
    it('should return true when user has the role', function() {
      context.setCurrentUser(createTestUser());

      expect(context.hasRole('ADMIN')).toBe(true);
    });

    it('should return false when user does not have the role', function() {
      context.setCurrentUser(createTestUser());

      expect(context.hasRole('SUPER_ADMIN')).toBe(false);
    });

    it('should return false when no user is set', function() {
      expect(context.hasRole('ADMIN')).toBe(false);
    });

    it('should return false when user has no roles', function() {
      const user = createTestUser();
      user.roles = undefined;
      context.setCurrentUser(user);

      expect(context.hasRole('ADMIN')).toBe(false);
    });

    it('should return false when user has empty roles', function() {
      const user = createTestUser();
      user.roles = [];
      context.setCurrentUser(user);

      expect(context.hasRole('ADMIN')).toBe(false);
    });
  });

  describe('hasAnyRole', function() {
    it('should return true when user has any of the roles', function() {
      context.setCurrentUser(createTestUser());

      expect(context.hasAnyRole(['ADMIN', 'SUPER_ADMIN'])).toBe(true);
    });

    it('should return false when user has none of the roles', function() {
      context.setCurrentUser(createTestUser());

      expect(context.hasAnyRole(['SUPER_ADMIN', 'GUEST'])).toBe(false);
    });

    it('should return false when no user is set', function() {
      expect(context.hasAnyRole(['ADMIN'])).toBe(false);
    });

    it('should return false when user has no roles', function() {
      const user = createTestUser();
      user.roles = undefined;
      context.setCurrentUser(user);

      expect(context.hasAnyRole(['ADMIN'])).toBe(false);
    });
  });

  describe('clear', function() {
    it('should clear current user', function() {
      context.setCurrentUser(createTestUser());
      context.clear();

      expect(context.getCurrentUser()).toBeNull();
    });

    it('should clear current request', function() {
      context.setCurrentRequest({ path: '/test' });
      context.clear();

      expect(context.getCurrentRequest()).toBeNull();
    });

    it('should clear both user and request', function() {
      context.setCurrentUser(createTestUser());
      context.setCurrentRequest({ path: '/test' });
      context.clear();

      expect(context.getCurrentUser()).toBeNull();
      expect(context.getCurrentRequest()).toBeNull();
    });
  });
});
