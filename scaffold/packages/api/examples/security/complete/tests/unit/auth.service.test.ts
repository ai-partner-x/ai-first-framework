import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { AuthService } from '../../service/auth.service.js';
import { UserService } from '../../service/user.service.js';
import { OAuthService } from '../../service/oauth.service.js';
import { SecurityContext } from '@ai-partner-x/aiko-boot-starter-security';

describe('AuthService', () => {
    let authService: AuthService;
    let userService: UserService;
    let oauthService: OAuthService;

    beforeEach(() => {
        authService = new AuthService();
        userService = new UserService();
        oauthService = new OAuthService();

        (authService as any).securityAuthService = {
            login: jest.fn(),
            register: jest.fn(),
            refreshToken: jest.fn(),
            logout: jest.fn(),
            changePassword: jest.fn(),
        };

        (authService as any).userService = userService;
        (authService as any).oauthService = oauthService;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('login', () => {
        it('应该成功登录用户', async () => {
            const mockResponse = {
                accessToken: 'mock-access-token',
                refreshToken: 'mock-refresh-token',
                expiresIn: 3600,
                user: {
                    id: 1,
                    username: 'testuser',
                    email: 'test@example.com',
                },
            };

            ((authService as any).securityAuthService.login as jest.Mock).mockResolvedValue(mockResponse);

            const result = await authService.login('testuser', 'password123');

            expect(result).toEqual(mockResponse);
            expect(((authService as any).securityAuthService.login as jest.Mock)).toHaveBeenCalledWith({
                username: 'testuser',
                password: 'password123',
            });
        });

        it('应该处理登录失败', async () => {
            const mockError = new Error('用户名或密码错误');
            ((authService as any).securityAuthService.login as jest.Mock).mockRejectedValue(mockError);

            await expect(authService.login('testuser', 'wrongpassword')).rejects.toThrow('用户名或密码错误');
        });
    });

    describe('register', () => {
        it('应该成功注册新用户', async () => {
            const mockUserData = {
                username: 'newuser',
                email: 'new@example.com',
                password: 'Password123!',
            };

            const mockResponse = {
                user: {
                    id: 2,
                    username: 'newuser',
                    email: 'new@example.com',
                },
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token',
            };

            ((authService as any).securityAuthService.register as jest.Mock).mockResolvedValue(mockResponse);

            const result = await authService.register(mockUserData);

            expect(result).toEqual(mockResponse);
            expect(((authService as any).securityAuthService.register as jest.Mock)).toHaveBeenCalledWith(mockUserData);
        });

        it('应该处理注册失败（用户已存在）', async () => {
            const mockUserData = {
                username: 'existinguser',
                email: 'existing@example.com',
                password: 'Password123!',
            };

            const mockError = new Error('用户名已存在');
            ((authService as any).securityAuthService.register as jest.Mock).mockRejectedValue(mockError);

            await expect(authService.register(mockUserData)).rejects.toThrow('用户名已存在');
        });
    });

    describe('refreshToken', () => {
        it('应该成功刷新 token', async () => {
            const mockResponse = {
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token',
                expiresIn: 3600,
            };

            ((authService as any).securityAuthService.refreshToken as jest.Mock).mockResolvedValue(mockResponse);

            const result = await authService.refreshToken('old-refresh-token');

            expect(result).toEqual(mockResponse);
            expect(((authService as any).securityAuthService.refreshToken as jest.Mock)).toHaveBeenCalledWith('old-refresh-token');
        });

        it('应该处理无效的 refresh token', async () => {
            const mockError = new Error('无效的 refresh token');
            ((authService as any).securityAuthService.refreshToken as jest.Mock).mockRejectedValue(mockError);

            await expect(authService.refreshToken('invalid-token')).rejects.toThrow('无效的 refresh token');
        });
    });

    describe('logout', () => {
        it('应该成功登出用户', async () => {
            const mockResponse = { success: true };
            ((authService as any).securityAuthService.logout as jest.Mock).mockResolvedValue(mockResponse);

            const result = await authService.logout('access-token');

            expect(result).toEqual(mockResponse);
            expect(((authService as any).securityAuthService.logout as jest.Mock)).toHaveBeenCalledWith('access-token');
        });
    });

    describe('changePassword', () => {
        it('应该成功修改密码', async () => {
            const mockResponse = { success: true };
            ((authService as any).securityAuthService.changePassword as jest.Mock).mockResolvedValue(mockResponse);

            SecurityContext.getInstance().setCurrentUser({ id: 1, username: 'testuser' });

            const result = await authService.changePassword(1, 'oldpassword', 'newpassword');

            expect(result).toEqual(mockResponse);
            expect(((authService as any).securityAuthService.changePassword as jest.Mock)).toHaveBeenCalledWith(
                1,
                'oldpassword',
                'newpassword'
            );
        });

        it('应该处理未登录用户的密码修改', async () => {
            SecurityContext.getInstance().setCurrentUser(null);

            await expect(authService.changePassword(1, 'oldpassword', 'newpassword')).rejects.toThrow('未登录');
        });
    });

    describe('handleOAuthCallback', () => {
        it('应该成功处理 OAuth 回调', async () => {
            const mockProfile = {
                id: 'github-123',
                username: 'githubuser',
                email: 'github@example.com',
                avatar: 'https://github.com/avatar.png',
                provider: 'github',
            };

            const mockTokens = {
                access_token: 'github-access-token',
                refresh_token: 'github-refresh-token',
                expires_at: 1234567890,
            };

            const mockResponse = {
                user: {
                    id: 3,
                    username: 'githubuser',
                    email: 'github@example.com',
                },
                accessToken: 'app-access-token',
                refreshToken: 'app-refresh-token',
            };

            (oauthService.handleOAuthCallback as jest.Mock).mockResolvedValue(mockResponse);

            const result = await authService.handleOAuthCallback(mockProfile, mockTokens);

            expect(result).toEqual(mockResponse);
            expect(oauthService.handleOAuthCallback).toHaveBeenCalledWith(mockProfile, mockTokens);
        });
    });
});
