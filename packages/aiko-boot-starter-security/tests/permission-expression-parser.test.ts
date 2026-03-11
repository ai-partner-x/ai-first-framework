import { describe, it, expect, beforeEach } from 'vitest';
import { PermissionExpressionParser } from '../src/permission/expression-parser.js';

describe('PermissionExpressionParser', function() {
  let parser: PermissionExpressionParser;

  beforeEach(function() {
    parser = new PermissionExpressionParser();
  });

  describe('parse', function() {
    it('should parse hasRole expression', function() {
      const result = parser.parse("hasRole('ADMIN')");
      expect(result.type).toBe('hasRole');
      expect(result.value).toBe('ADMIN');
    });

    it('should parse hasPermission expression', function() {
      const result = parser.parse("hasPermission('user:read')");
      expect(result.type).toBe('hasPermission');
      expect(result.value).toBe('user:read');
    });

    it('should parse hasAnyRole expression', function() {
      const result = parser.parse("hasAnyRole('ADMIN', 'MANAGER')");
      expect(result.type).toBe('hasAnyRole');
      expect(result.value).toEqual(['ADMIN', 'MANAGER']);
    });

    it('should parse hasAllRoles expression', function() {
      const result = parser.parse("hasAllRoles('ADMIN', 'MANAGER', 'USER')");
      expect(result.type).toBe('hasAllRoles');
      expect(result.value).toEqual(['ADMIN', 'MANAGER', 'USER']);
    });

    it('should parse authenticated expression', function() {
      const result = parser.parse('authenticated()');
      expect(result.type).toBe('authenticated');
      expect(result.value).toBe('');
    });

    it('should throw error for invalid expression', function() {
      expect(function() {
        parser.parse('invalidExpression');
      }).toThrow('Invalid permission expression');
    });
  });

  describe('evaluate', function() {
    it('should evaluate hasRole correctly', function() {
      const user = { id: 1, username: 'test', roles: [{ id: 1, name: 'ADMIN' }] };
      const expression = parser.parse("hasRole('ADMIN')");
      expect(parser.evaluate(expression, user)).toBe(true);
    });

    it('should evaluate hasRole false when role not found', function() {
      const user = { id: 1, username: 'test', roles: [{ id: 1, name: 'USER' }] };
      const expression = parser.parse("hasRole('ADMIN')");
      expect(parser.evaluate(expression, user)).toBe(false);
    });

    it('should evaluate hasPermission correctly', function() {
      const user = {
        id: 1,
        username: 'test',
        roles: [{
          id: 1,
          name: 'ADMIN',
          permissions: [{ id: 1, name: 'user:read' }]
        }]
      };
      const expression = parser.parse("hasPermission('user:read')");
      expect(parser.evaluate(expression, user)).toBe(true);
    });

    it('should evaluate hasAnyRole correctly', function() {
      const user = { id: 1, username: 'test', roles: [{ id: 1, name: 'MANAGER' }] };
      const expression = parser.parse("hasAnyRole('ADMIN', 'MANAGER')");
      expect(parser.evaluate(expression, user)).toBe(true);
    });

    it('should evaluate hasAllRoles correctly', function() {
      const user = {
        id: 1,
        username: 'test',
        roles: [
          { id: 1, name: 'ADMIN' },
          { id: 2, name: 'MANAGER' }
        ]
      };
      const expression = parser.parse("hasAllRoles('ADMIN', 'MANAGER')");
      expect(parser.evaluate(expression, user)).toBe(true);
    });

    it('should evaluate hasAllRoles false when missing role', function() {
      const user = {
        id: 1,
        username: 'test',
        roles: [{ id: 1, name: 'ADMIN' }]
      };
      const expression = parser.parse("hasAllRoles('ADMIN', 'MANAGER')");
      expect(parser.evaluate(expression, user)).toBe(false);
    });

    it('should evaluate authenticated correctly', function() {
      const user = { id: 1, username: 'test' };
      const expression = parser.parse('authenticated()');
      expect(parser.evaluate(expression, user)).toBe(true);
    });

    it('should evaluate authenticated false for null user', function() {
      const expression = parser.parse('authenticated()');
      expect(parser.evaluate(expression, null)).toBe(false);
    });
  });
});
