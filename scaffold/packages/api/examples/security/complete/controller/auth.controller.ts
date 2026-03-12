import { RestController, GetMapping, PostMapping, QueryParam } from '@ai-partner-x/aiko-boot-starter-web';
import { Public } from '@ai-partner-x/aiko-boot-starter-security';
import { AuthService } from '../service/auth.service.js';
import { LoginDto } from '../dto/login.dto.js';
import { RegisterDto } from '../dto/register.dto.js';
import { ChangePasswordDto } from '../dto/change-password.dto.js';
import { SecurityContext } from '@ai-partner-x/aiko-boot-starter-security';
import axios from 'axios';

@RestController({ path: '/auth' })
export class AuthController {
  @Autowired()
  private authService!: AuthService;

  @PostMapping('/login')
  @Public()
  async login(@RequestBody() dto: LoginDto): Promise<any> {
    return this.authService.login(dto.username, dto.password);
  }

  @PostMapping('/register')
  @Public()
  async register(@RequestBody() dto: RegisterDto): Promise<any> {
    return this.authService.register(dto);
  }

  @PostMapping('/refresh')
  async refresh(@RequestBody() body: { refreshToken: string }): Promise<any> {
    return this.authService.refreshToken(body.refreshToken);
  }

  @PostMapping('/logout')
  async logout(@RequestBody() body: { token: string }): Promise<any> {
    return this.authService.logout(body.token);
  }

  @PostMapping('/change-password')
  async changePassword(@RequestBody() dto: ChangePasswordDto): Promise<any> {
    const securityContext = SecurityContext.getInstance();
    const currentUser = securityContext.getCurrentUser();
    
    if (!currentUser) {
      throw new Error('未登录');
    }

    return this.authService.changePassword(currentUser.id, dto.oldPassword, dto.newPassword);
  }

  @GetMapping('/github')
  @Public()
  async githubAuth(): Promise<any> {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = process.env.GITHUB_CALLBACK_URL;
    const scope = 'user:email';
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
    
    return { authUrl };
  }

  @GetMapping('/github/callback')
  @Public()
  async githubCallback(@QueryParam('code') code: string): Promise<any> {
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
  }

  @GetMapping('/google')
  @Public()
  async googleAuth(): Promise<any> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL;
    const scope = 'profile email';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code`;
    
    return { authUrl };
  }

  @GetMapping('/google/callback')
  @Public()
  async googleCallback(@QueryParam('code') code: string): Promise<any> {
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
  }
}
