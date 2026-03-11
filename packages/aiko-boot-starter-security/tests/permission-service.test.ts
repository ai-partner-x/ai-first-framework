import { describe, it, expect, beforeEach } from 'vitest';
import { PermissionService } from '../src/permission/permission.service.js';
import type { User } from '../src/entities/index.js';

describe('PermissionService', function () {
    let service: PermissionService;
    let mockUserMapper: any;
    let mockRoleMapper: any;
    let mockPermissionMapper: any;

    beforeEach(function () {
        service = new PermissionService();
        mockUserMapper = {
            selectById: vi.fn(),
        };
        mockRoleMapper = {};
        mockPermissionMapper = {};
        service.setMappers(mockUserMapper, mockRoleMapper, mockPermissionMapper);
    });

    const createTestUser = function (roles: any[]): User {
        return {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            enabled: true,
            roles: roles,
        };
    };

    describe('hasRole', function () {
        it('should return true when user has the role', function () {
            const user = createTestUser([{ id: 1, name: 'ADMIN' }]);

            expect(service.hasRole(user, 'ADMIN')).toBe(true);
        });

        it('should return false when user does not have the role', function () {
            const user = createTestUser([{ id: 1, name: 'USER' }]);

            expect(service.hasRole(user, 'ADMIN')).toBe(false);
        });

        it('should return false when user has no roles', function () {
            const user = createTestUser([]);

            expect(service.hasRole(user, 'ADMIN')).toBe(false);
        });

        it('should return false when user roles is undefined', function () {
            const user: User = {
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                enabled: true,
            };

            expect(service.hasRole(user, 'ADMIN')).toBe(false);
        });
    });

    describe('hasAllRoles', function () {
        it('should return true when user has all roles', function () {
            const user = createTestUser([
                { id: 1, name: 'ADMIN' },
                { id: 2, name: 'MANAGER' },
            ]);

            expect(service.hasAllRoles(user, ['ADMIN', 'MANAGER'])).toBe(true);
        });

        it('should return false when user is missing a role', function () {
            const user = createTestUser([{ id: 1, name: 'ADMIN' }]);

            expect(service.hasAllRoles(user, ['ADMIN', 'MANAGER'])).toBe(false);
        });

        it('should return true when checking empty roles', function () {
            const user = createTestUser([{ id: 1, name: 'ADMIN' }]);

            expect(service.hasAllRoles(user, [])).toBe(true);
        });

        it('should return false when user has no roles', function () {
            const user = createTestUser([]);

            expect(service.hasAllRoles(user, ['ADMIN'])).toBe(false);
        });
    });

    describe('hasAnyRole', function () {
        it('should return true when user has any of the roles', function () {
            const user = createTestUser([{ id: 1, name: 'MANAGER' }]);

            expect(service.hasAnyRole(user, ['ADMIN', 'MANAGER'])).toBe(true);
        });

        it('should return false when user has none of the roles', function () {
            const user = createTestUser([{ id: 1, name: 'USER' }]);

            expect(service.hasAnyRole(user, ['ADMIN', 'MANAGER'])).toBe(false);
        });

        it('should return false when user has no roles', function () {
            const user = createTestUser([]);

            expect(service.hasAnyRole(user, ['ADMIN'])).toBe(false);
        });
    });

    describe('hasPermission', function () {
        it('should return true when user has the permission', async function () {
            const user = createTestUser([]);
            mockUserMapper.selectById.mockResolvedValue({
                id: 1,
                roles: [{
                    id: 1,
                    name: 'ADMIN',
                    permissions: [{ id: 1, name: 'user:read' }],
                }],
            });

            const result = await service.hasPermission(user, 'user:read');
            expect(result).toBe(true);
        });

        it('should return false when user does not have the permission', async function () {
            const user = createTestUser([]);
            mockUserMapper.selectById.mockResolvedValue({
                id: 1,
                roles: [{
                    id: 1,
                    name: 'ADMIN',
                    permissions: [{ id: 1, name: 'user:write' }],
                }],
            });

            const result = await service.hasPermission(user, 'user:read');
            expect(result).toBe(false);
        });

        it('should return false when user has no roles', async function () {
            const user = createTestUser([]);
            mockUserMapper.selectById.mockResolvedValue({
                id: 1,
                roles: [],
            });

            const result = await service.hasPermission(user, 'user:read');
            expect(result).toBe(false);
        });

        it('should return false when userMapper is not set', async function () {
            service.setMappers(null, null, null);
            const user = createTestUser([]);

            const result = await service.hasPermission(user, 'user:read');
            expect(result).toBe(false);
        });

        it('should return false when user not found', async function () {
            const user = createTestUser([]);
            mockUserMapper.selectById.mockResolvedValue(null);

            const result = await service.hasPermission(user, 'user:read');
            expect(result).toBe(false);
        });
    });

    describe('hasPermissions', function () {
        it('should return true when user has all permissions', async function () {
            const user = createTestUser([]);
            mockUserMapper.selectById.mockResolvedValue({
                id: 1,
                roles: [{
                    id: 1,
                    name: 'ADMIN',
                    permissions: [
                        { id: 1, name: 'user:read' },
                        { id: 2, name: 'user:write' },
                    ],
                }],
            });

            const result = await service.hasPermissions(user, ['user:read', 'user:write']);
            expect(result).toBe(true);
        });

        it('should return false when user is missing a permission', async function () {
            const user = createTestUser([]);
            mockUserMapper.selectById.mockResolvedValue({
                id: 1,
                roles: [{
                    id: 1,
                    name: 'ADMIN',
                    permissions: [{ id: 1, name: 'user:read' }],
                }],
            });

            const result = await service.hasPermissions(user, ['user:read', 'user:delete']);
            expect(result).toBe(false);
        });
    });

    describe('hasAnyPermission', function () {
        it('should return true when user has any of the permissions', async function () {
            const user = createTestUser([]);
            mockUserMapper.selectById.mockResolvedValue({
                id: 1,
                roles: [{
                    id: 1,
                    name: 'ADMIN',
                    permissions: [{ id: 1, name: 'user:read' }],
                }],
            });

            const result = await service.hasAnyPermission(user, ['user:read', 'user:delete']);
            expect(result).toBe(true);
        });

        it('should return false when user has none of the permissions', async function () {
            const user = createTestUser([]);
            mockUserMapper.selectById.mockResolvedValue({
                id: 1,
                roles: [{
                    id: 1,
                    name: 'ADMIN',
                    permissions: [{ id: 1, name: 'user:write' }],
                }],
            });

            const result = await service.hasAnyPermission(user, ['user:read', 'user:delete']);
            expect(result).toBe(false);
        });
    });
});

import { vi } from 'vitest';
