import { describe, it, expect, beforeEach } from 'vitest';
import 'reflect-metadata';
import {
  PreAuthorize,
  PostAuthorize,
  Secured,
  getPreAuthorizeMetadata,
  getPostAuthorizeMetadata,
  getSecuredMetadata,
} from '../src/permission/decorators.js';

describe('Permission Decorators', function() {
  let target: any;
  let propertyKey: string;
  let descriptor: PropertyDescriptor;

  beforeEach(function() {
    target = {};
    propertyKey = 'testMethod';
    descriptor = {
      value: function() {},
      writable: true,
      enumerable: true,
      configurable: true,
    };
  });

  describe('PreAuthorize', function() {
    it('should set preAuthorize metadata with hasRole expression', function() {
      const decorator = PreAuthorize("hasRole('ADMIN')");
      decorator(target, propertyKey, descriptor);

      expect(getPreAuthorizeMetadata(target, propertyKey)).toBe("hasRole('ADMIN')");
    });

    it('should set preAuthorize metadata with hasPermission expression', function() {
      const decorator = PreAuthorize("hasPermission('user:read')");
      decorator(target, propertyKey, descriptor);

      expect(getPreAuthorizeMetadata(target, propertyKey)).toBe("hasPermission('user:read')");
    });

    it('should set preAuthorize metadata with authenticated expression', function() {
      const decorator = PreAuthorize('authenticated()');
      decorator(target, propertyKey, descriptor);

      expect(getPreAuthorizeMetadata(target, propertyKey)).toBe('authenticated()');
    });

    it('should return the descriptor', function() {
      const decorator = PreAuthorize("hasRole('ADMIN')");
      const result = decorator(target, propertyKey, descriptor);

      expect(result).toBe(descriptor);
    });
  });

  describe('PostAuthorize', function() {
    it('should set postAuthorize metadata with expression', function() {
      const decorator = PostAuthorize("hasPermission('user:read')");
      decorator(target, propertyKey, descriptor);

      expect(getPostAuthorizeMetadata(target, propertyKey)).toBe("hasPermission('user:read')");
    });

    it('should return the descriptor', function() {
      const decorator = PostAuthorize("hasRole('ADMIN')");
      const result = decorator(target, propertyKey, descriptor);

      expect(result).toBe(descriptor);
    });
  });

  describe('Secured', function() {
    it('should set secured metadata with single permission', function() {
      const decorator = Secured('user:read');
      decorator(target, propertyKey, descriptor);

      expect(getSecuredMetadata(target, propertyKey)).toEqual(['user:read']);
    });

    it('should set secured metadata with multiple permissions', function() {
      const decorator = Secured('user:read', 'user:write', 'user:delete');
      decorator(target, propertyKey, descriptor);

      expect(getSecuredMetadata(target, propertyKey)).toEqual(['user:read', 'user:write', 'user:delete']);
    });

    it('should return the descriptor', function() {
      const decorator = Secured('user:read');
      const result = decorator(target, propertyKey, descriptor);

      expect(result).toBe(descriptor);
    });

    it('should work with empty permissions', function() {
      const decorator = Secured();
      decorator(target, propertyKey, descriptor);

      expect(getSecuredMetadata(target, propertyKey)).toEqual([]);
    });
  });

  describe('getPreAuthorizeMetadata', function() {
    it('should return undefined when metadata not set', function() {
      expect(getPreAuthorizeMetadata(target, propertyKey)).toBeUndefined();
    });

    it('should return expression when metadata is set', function() {
      PreAuthorize("hasRole('ADMIN')")(target, propertyKey, descriptor);
      expect(getPreAuthorizeMetadata(target, propertyKey)).toBe("hasRole('ADMIN')");
    });
  });

  describe('getPostAuthorizeMetadata', function() {
    it('should return undefined when metadata not set', function() {
      expect(getPostAuthorizeMetadata(target, propertyKey)).toBeUndefined();
    });

    it('should return expression when metadata is set', function() {
      PostAuthorize("hasPermission('user:read')")(target, propertyKey, descriptor);
      expect(getPostAuthorizeMetadata(target, propertyKey)).toBe("hasPermission('user:read')");
    });
  });

  describe('getSecuredMetadata', function() {
    it('should return empty array when metadata not set', function() {
      expect(getSecuredMetadata(target, propertyKey)).toEqual([]);
    });

    it('should return permissions array when metadata is set', function() {
      Secured('user:read', 'user:write')(target, propertyKey, descriptor);
      expect(getSecuredMetadata(target, propertyKey)).toEqual(['user:read', 'user:write']);
    });
  });
});
