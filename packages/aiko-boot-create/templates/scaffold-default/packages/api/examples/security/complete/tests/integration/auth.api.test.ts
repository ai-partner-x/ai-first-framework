import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcrypt';
import { AuthService } from '../../service/auth.service.js';
import { UserService } from '../../service/user.service.js';
import { RoleService } from '../../service/role.service.js';
import { PermissionService } from '../../service/permission.service.js';
import { User, Role, Permission } from '../../entity/index.js';
import { SecurityContext } from '@ai-partner-x/aiko-boot-starter-security';

describe('Auth API Integration Tests', () => {
    let app: express.Application;
    let authService: AuthService;
    let userService: UserService;
    let roleService: RoleService;
    let permissionService: PermissionService;

    beforeAll(async () => {
        app = express();
        app.use(express.json());

        authService = new AuthService();
        userService = new UserService();
        roleService = new RoleService();
        permissionService = new PermissionService();

        (authService as any).securityAuthService = {
            login: async (credentials: any) => {
                const user = await userService.findByUsername(credentials.username);
                if (!user) {
                    throw new Error('用户名或密码错误');
                }

                const isValidPassword = await bcrypt.compare(credentials.password, user.password);
                if (!isValidPassword) {
                    throw new Error('用户名或密码错误');
                }

                return {
                    accessToken: 'mock-access-token',
                    refreshToken: 'mock-refresh-token',
                    expiresIn: 3600,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                    },
                };
            },
            register: async (userData: any) => {
                const existingUser = await userService.findByUsername(userData.username);
                if (existingUser) {
                    throw new Error('用户名已存在');
                }

                const hashedPassword = await bcrypt.hash(userData.password, 10);
                const user = await userService.create({
                    ...userData,
                    password: hashedPassword,
                });

                return {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                    },
                    accessToken: 'new-access-token',
                    refreshToken: 'new-refresh-token',
                };
            },
            refreshToken: async (refreshToken: string) => {
                if (refreshToken === 'invalid-token') {
                    throw new Error('无效的 refresh token');
                }
                return {
                    accessToken: 'new-access-token',
                    refreshToken: 'new-refresh-token',
                    expiresIn: 3600,
                };
            },
            logout: async (token: string) => {
                return { success: true };
            },
            changePassword: async (userId: number, oldPassword: string, newPassword: string) => {
                const user = await userService.findById(userId);
                if (!user) {
                    throw new Error('用户不存在');
                }

                const isValidPassword = await bcrypt.compare(oldPassword, user.password);
                if (!isValidPassword) {
                    throw new Error('旧密码错误');
                }

                await userService.update(userId, { password: newPassword });
                return { success: true };
            },
        };

        (authService as any).userService = userService;
        (authService as any).oauthService = {
            handleOAuthCallback: async (profile: any, tokens: any) => {
                return {
                    user: {
                        id: 3,
                        username: profile.username,
                        email: profile.email,
                    },
                    accessToken: 'oauth-access-token',
                    refreshToken: 'oauth-refresh-token',
                };
            },
        };

        app.post('/api/auth/login', async (req, res) => {
            try {
                const result = await authService.login(req.body.username, req.body.password);
                res.json(result);
            } catch (error: any) {
                res.status(401).json({ error: error.message });
            }
        });

        app.post('/api/auth/register', async (req, res) => {
            try {
                const result = await authService.register(req.body);
                res.json(result);
            } catch (error: any) {
                res.status(400).json({ error: error.message });
            }
        });

        app.post('/api/auth/refresh', async (req, res) => {
            try {
                const result = await authService.refreshToken(req.body.refreshToken);
                res.json(result);
            } catch (error: any) {
                res.status(401).json({ error: error.message });
            }
        });

        app.post('/api/auth/logout', async (req, res) => {
            try {
                const result = await authService.logout(req.body.token);
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        app.post('/api/auth/change-password', async (req, res) => {
            try {
                const securityContext = SecurityContext.getInstance();
                const currentUser = securityContext.getCurrentUser();

                if (!currentUser) {
                    return res.status(401).json({ error: '未登录' });
                }

                const result = await authService.changePassword(currentUser.id, req.body.oldPassword, req.body.newPassword);
                res.json(result);
            } catch (error: any) {
                res.status(400).json({ error: error.message });
            }
        });

        app.get('/api/auth/github', async (req, res) => {
            res.json({ authUrl: 'https://github.com/login/oauth/authorize' });
        });

        app.get('/api/auth/google', async (req, res) => {
            res.json({ authUrl: 'https://accounts.google.com/o/oauth2/v2/auth' });
        });
    });

    afterAll(async () => {
        SecurityContext.getInstance().setCurrentUser(null);
    });

    beforeEach(() => {
        SecurityContext.getInstance().setCurrentUser(null);
    });

    describe('POST /api/auth/login', () => {
        it('应该成功登录', async () => {
            const hashedPassword = await bcrypt.hash('Admin123!', 10);
            (userService as any).userMapper = {
                selectList: jest.fn().mockResolvedValue([{
                    id: 1,
                    username: 'admin',
                    email: 'admin@example.com',
                    password: hashedPassword,
                    enabled: true,
                    provider: 'local',
                    providerId: '',
                    avatar: '',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }]),
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'admin',
                    password: 'Admin123!',
                })
                .expect(200);

            expect(response.body).toHaveProperty('accessToken');
            expect(response.body).toHaveProperty('refreshToken');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.username).toBe('admin');
        });

        it('应该拒绝错误的密码', async () => {
            const hashedPassword = await bcrypt.hash('Admin123!', 10);
            (userService as any).userMapper = {
                selectList: jest.fn().mockResolvedValue([{
                    id: 1,
                    username: 'admin',
                    email: 'admin@example.com',
                    password: hashedPassword,
                    enabled: true,
                    provider: 'local',
                    providerId: '',
                    avatar: '',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }]),
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'admin',
                    password: 'WrongPassword123!',
                })
                .expect(401);

            expect(response.body).toHaveProperty('error', '用户名或密码错误');
        });

        it('应该拒绝不存在的用户', async () => {
            (userService as any).userMapper = {
                selectList: jest.fn().mockResolvedValue([]),
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'nonexistent',
                    password: 'password123',
                })
                .expect(401);

            expect(response.body).toHaveProperty('error', '用户名或密码错误');
        });
    });

    describe('POST /api/auth/register', () => {
        it('应该成功注册新用户', async () => {
            (userService as any).userMapper = {
                selectList: jest.fn().mockResolvedValue([]),
                insert: jest.fn().mockResolvedValue(2),
                selectById: jest.fn().mockResolvedValue({
                    id: 2,
                    username: 'newuser',
                    email: 'new@example.com',
                    password: 'hashedpassword',
                    enabled: true,
                    provider: 'local',
                    providerId: '',
                    avatar: '',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }),
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'newuser',
                    email: 'new@example.com',
                    password: 'Password123!',
                })
                .expect(200);

            expect(response.body).toHaveProperty('user');
            expect(response.body.user.username).toBe('newuser');
            expect(response.body).toHaveProperty('accessToken');
        });

        it('应该拒绝已存在的用户名', async () => {
            (userService as any).userMapper = {
                selectList: jest.fn().mockResolvedValue([{
                    id: 1,
                    username: 'admin',
                    email: 'admin@example.com',
                    password: 'hashedpassword',
                    enabled: true,
                    provider: 'local',
                    providerId: '',
                    avatar: '',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }]),
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'admin',
                    email: 'new@example.com',
                    password: 'Password123!',
                })
                .expect(400);

            expect(response.body).toHaveProperty('error', '用户名已存在');
        });
    });

    describe('POST /api/auth/refresh', () => {
        it('应该成功刷新 token', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .send({
                    refreshToken: 'valid-refresh-token',
                })
                .expect(200);

            expect(response.body).toHaveProperty('accessToken');
            expect(response.body).toHaveProperty('refreshToken');
        });

        it('应该拒绝无效的 refresh token', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .send({
                    refreshToken: 'invalid-token',
                })
                .expect(401);

            expect(response.body).toHaveProperty('error', '无效的 refresh token');
        });
    });

    describe('POST /api/auth/logout', () => {
        it('应该成功登出', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .send({
                    token: 'access-token',
                })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
        });
    });

    describe('POST /api/auth/change-password', () => {
        it('应该成功修改密码', async () => {
            const hashedPassword = await bcrypt.hash('Admin123!', 10);
            (userService as any).userMapper = {
                selectById: jest.fn().mockResolvedValue({
                    id: 1,
                    username: 'admin',
                    email: 'admin@example.com',
                    password: hashedPassword,
                    enabled: true,
                    provider: 'local',
                    providerId: '',
                    avatar: '',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }),
                updateById: jest.fn().mockResolvedValue(1),
            };

            SecurityContext.getInstance().setCurrentUser({ id: 1, username: 'admin' });

            const response = await request(app)
                .post('/api/auth/change-password')
                .send({
                    oldPassword: 'Admin123!',
                    newPassword: 'NewPassword123!',
                })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
        });

        it('应该拒绝未登录用户的密码修改', async () => {
            const response = await request(app)
                .post('/api/auth/change-password')
                .send({
                    oldPassword: 'Admin123!',
                    newPassword: 'NewPassword123!',
                })
                .expect(401);

            expect(response.body).toHaveProperty('error', '未登录');
        });
    });

    describe('GET /api/auth/github', () => {
        it('应该返回 GitHub OAuth 授权 URL', async () => {
            const response = await request(app)
                .get('/api/auth/github')
                .expect(200);

            expect(response.body).toHaveProperty('authUrl');
            expect(response.body.authUrl).toContain('github.com');
        });
    });

    describe('GET /api/auth/google', () => {
        it('应该返回 Google OAuth 授权 URL', async () => {
            const response = await request(app)
                .get('/api/auth/google')
                .expect(200);

            expect(response.body).toHaveProperty('authUrl');
            expect(response.body.authUrl).toContain('accounts.google.com');
        });
    });
});
