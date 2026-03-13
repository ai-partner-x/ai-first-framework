import 'reflect-metadata';
import { RestController, PostMapping, GetMapping, RequestBody, RequestParam, QueryParam } from '@ai-partner-x/aiko-boot-starter-web';
import { Autowired } from '@ai-partner-x/aiko-boot';
import { Public } from '@ai-partner-x/aiko-boot-starter-security';
import { AuthService } from '../service/auth.service.js';
import type { LoginDto, LoginResultDto, RefreshTokenDto } from '../dto/auth.dto.js';
import { SecurityContext } from '@ai-partner-x/aiko-boot-starter-security';
import axios from 'axios';

@RestController({ path: '/auth' })
export class AuthController {
  @Autowired()
  private authService!: AuthService;

  @PostMapping('/login')
  @Public()
  async login(@RequestBody() dto: LoginDto): Promise<LoginResultDto> {
    return this.authService.login(dto);
  }

  @PostMapping('/refresh')
  @Public()
  async refresh(@RequestBody() dto: RefreshTokenDto): Promise<{ accessToken: string }> {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @GetMapping('/info')
  async getUserInfo(@RequestParam('_uid') userId: string): Promise<LoginResultDto['userInfo']> {
    return this.authService.getUserInfo(Number(userId));
  }

  @PostMapping('/logout')
  async logout(@RequestBody() body: { token: string }): Promise<any> {
    return this.authService.logout(body.token);
  }

  @GetMapping('/github')
  @Public()
  async githubAuth(@QueryParam('redirect') redirect?: string): Promise<any> {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = process.env.GITHUB_CALLBACK_URL;
    const scope = 'user:email';

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}${redirect ? `&redirect_uri=${encodeURIComponent(redirect)}` : ''}`;

    return { authUrl };
  }

  @GetMapping('/github/callback')
  @Public()
  async githubCallback(@QueryParam('code') code: string): Promise<any> {
    try {
      const clientId = process.env.GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;
      const redirectUri = process.env.GITHUB_CALLBACK_URL;

      const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }, {
        headers: { Accept: 'application/json' }
      });

      const tokens = tokenResponse.data;

      const userResponse = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });

      const profile = {
        ...userResponse.data,
        provider: 'github',
      };

      return this.authService.handleOAuthCallback(profile, tokens);
    } catch (error) {
      throw new Error('GitHub OAuth token exchange failed');
    }
  }

  @GetMapping('/google')
  @Public()
  async googleAuth(@QueryParam('redirect') redirect?: string): Promise<any> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL;
    const scope = 'profile email';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code${redirect ? `&redirect_uri=${encodeURIComponent(redirect)}` : ''}`;

    return { authUrl };
  }

  @GetMapping('/google/callback')
  @Public()
  async googleCallback(@QueryParam('code') code: string): Promise<any> {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = process.env.GOOGLE_CALLBACK_URL;

      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });

      const tokens = tokenResponse.data;

      const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });

      const profile = {
        ...userResponse.data,
        provider: 'google',
      };

      return this.authService.handleOAuthCallback(profile, tokens);
    } catch (error) {
      throw new Error('Google OAuth token exchange failed');
    }
  }
}
