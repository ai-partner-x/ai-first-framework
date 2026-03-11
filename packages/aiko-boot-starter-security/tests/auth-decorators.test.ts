import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'reflect-metadata';
import {
  Public,
  Authenticated,
  RolesAllowed,
  getPublicMetadata,
  getAuthenticatedMetadata,
  getRolesMetadata,
} from '../src/auth/decorators.js';

describe('Auth Decorators', function() {
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

  describe('Public', function() {
    it('should set public metadata to true', function() {
      const decorator = Public();
      decorator(target, propertyKey, descriptor);

      expect(getPublicMetadata(target, propertyKey)).toBe(true);
    });

    it('should return the descriptor', function() {
      const decorator = Public();
      const result = decorator(target, propertyKey, descriptor);

      expect(result).toBe(descriptor);
    });

    it('should not affect other metadata', function() {
      const decorator = Public();
      decorator(target, propertyKey, descriptor);

      expect(getAuthenticatedMetadata(target, propertyKey)).toBe(false);
      expect(getRolesMetadata(target, propertyKey)).toEqual([]);
    });
  });

  describe('Authenticated', function() {
    it('should set authenticated metadata to true', function() {
      const decorator = Authenticated();
      decorator(target, propertyKey, descriptor);

      expect(getAuthenticatedMetadata(target, propertyKey)).toBe(true);
    });

    it('should return the descriptor', function() {
      const decorator = Authenticated();
      const result = decorator(target, propertyKey, descriptor);

      expect(result).toBe(descriptor);
    });
  });

  describe('RolesAllowed', function() {
    it('should set roles metadata with single role', function() {
      const decorator = RolesAllowed('ADMIN');
      decorator(target, propertyKey, descriptor);

      expect(getRolesMetadata(target, propertyKey)).toEqual(['ADMIN']);
    });

    it('should set roles metadata with multiple roles', function() {
      const decorator = RolesAllowed('ADMIN', 'MANAGER', 'USER');
      decorator(target, propertyKey, descriptor);

      expect(getRolesMetadata(target, propertyKey)).toEqual(['ADMIN', 'MANAGER', 'USER']);
    });

    it('should return the descriptor', function() {
      const decorator = RolesAllowed('ADMIN');
      const result = decorator(target, propertyKey, descriptor);

      expect(result).toBe(descriptor);
    });

    it('should work with empty roles', function() {
      const decorator = RolesAllowed();
      decorator(target, propertyKey, descriptor);

      expect(getRolesMetadata(target, propertyKey)).toEqual([]);
    });
  });

  describe('getPublicMetadata', function() {
    it('should return false when metadata not set', function() {
      expect(getPublicMetadata(target, propertyKey)).toBe(false);
    });

    it('should return true when metadata is set', function() {
      Public()(target, propertyKey, descriptor);
      expect(getPublicMetadata(target, propertyKey)).toBe(true);
    });
  });

  describe('getAuthenticatedMetadata', function() {
    it('should return false when metadata not set', function() {
      expect(getAuthenticatedMetadata(target, propertyKey)).toBe(false);
    });

    it('should return true when metadata is set', function() {
      Authenticated()(target, propertyKey, descriptor);
      expect(getAuthenticatedMetadata(target, propertyKey)).toBe(true);
    });
  });

  describe('getRolesMetadata', function() {
    it('should return empty array when metadata not set', function() {
      expect(getRolesMetadata(target, propertyKey)).toEqual([]);
    });

    it('should return roles array when metadata is set', function() {
      RolesAllowed('ADMIN', 'USER')(target, propertyKey, descriptor);
      expect(getRolesMetadata(target, propertyKey)).toEqual(['ADMIN', 'USER']);
    });
  });
});
