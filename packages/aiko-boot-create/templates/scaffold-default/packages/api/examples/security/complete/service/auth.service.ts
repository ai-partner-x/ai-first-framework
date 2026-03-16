import { Service, Autowired } from '@ai-partner-x/aiko-boot';
import { AuthService as SecurityAuthService } from '@ai-partner-x/aiko-boot-starter-security';
import { UserService } from './user.service.js';
import { OAuthService } from './oauth.service.js';
import type { RegisterDto } from '../dto/register.dto.js';

@Service()
export class AuthService {
    @Autowired()
    private securityAuthService!: SecurityAuthService;

    @Autowired()
    private userService!: UserService;

    @Autowired()
    private oauthService!: OAuthService;

    async login(username: string, password: string) {
        return this.securityAuthService.login({ username, password });
    }

    async register(userData: RegisterDto) {
        return this.securityAuthService.register(userData);
    }

    async refreshToken(refreshToken: string) {
        return this.securityAuthService.refreshToken(refreshToken);
    }

    async logout(token: string) {
        return this.securityAuthService.logout(token);
    }

    async changePassword(userId: number, oldPassword: string, newPassword: string) {
        return this.securityAuthService.changePassword(userId, oldPassword, newPassword);
    }

    async handleOAuthCallback(profile: any, tokens: any): Promise<any> {
        return this.oauthService.handleOAuthCallback(profile, tokens);
    }
}
