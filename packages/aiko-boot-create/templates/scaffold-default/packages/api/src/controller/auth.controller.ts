import 'reflect-metadata';
import { RestController, PostMapping, GetMapping, RequestBody, RequestParam, RequestHeader } from '@ai-partner-x/aiko-boot-starter-web';
import { Autowired } from '@ai-partner-x/aiko-boot';
import { AuthService } from '../service/auth.service.js';
import type { LoginDto, LoginResultDto, RefreshTokenDto } from '../dto/auth.dto.js';

@RestController({ path: '/auth' })
export class AuthController {
  @Autowired(AuthService)
  private authService!: AuthService;

  @PostMapping('/login')
  async login(@RequestBody() dto: LoginDto): Promise<LoginResultDto> {
    return this.authService.login(dto);
  }

  @PostMapping('/refresh')
  async refresh(@RequestBody() dto: RefreshTokenDto): Promise<{ accessToken: string }> {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @GetMapping('/info')
  async getUserInfo(@RequestParam('_uid') userId: string): Promise<LoginResultDto['userInfo']> {
    return this.authService.getUserInfo(Number(userId));
  }

  /**
   * 获取当前用户信息（基于 JWT token）
   *
   * 支持三种 token 传递方式，按优先级顺序：
   * 1. Authorization Header (Bearer token) - 推荐
   * 2. Request Body - 兼容方式
   * 3. URL Parameters - 备用方式
   *
   * 所有方式都支持 "Bearer <token>" 和 "<token>" 两种格式
   *
   * @example
   * ```bash
   * # 方式1：使用 Authorization Header（推荐）
   * curl -X POST http://localhost:3001/api/auth/current \
   *   -H "Authorization: Bearer <token>"
   *
   * # 方式2：使用请求体
   * curl -X POST http://localhost:3001/api/auth/current \
   *   -H "Content-Type: application/json" \
   *   -d '{"authorization": "Bearer <token>"}'
   * # 或者不带 Bearer 前缀：
   * curl -X POST http://localhost:3001/api/auth/current \
   *   -H "Content-Type: application/json" \
   *   -d '{"authorization": "<token>"}'
   *
   * # 方式3：使用 URL 参数
   * curl -X POST "http://localhost:3001/api/auth/current?authorization=Bearer <token>"
   * # 或者不带 Bearer 前缀：
   * curl -X POST "http://localhost:3001/api/auth/current?authorization=<token>"
   * ```
   */
  @PostMapping('/current')
  async getCurrentUser(
    @RequestHeader('Authorization', false) headerAuthorization: string | undefined,
    @RequestBody() body: any,
    @RequestParam('Authorization', false) paramAuthorization: string | undefined
  ): Promise<LoginResultDto['userInfo']> {
    let token = '';

    // 优先级1：Authorization Header
    if (headerAuthorization && typeof headerAuthorization === 'string') {
      token = headerAuthorization.trim();
      if (token.startsWith('Bearer ')) {
        token = token.substring(7).trim(); // 移除 "Bearer " 前缀并去除空格
      }
    }

    // 优先级2：Request Body - 支持大小写不敏感
    if (!token && body && typeof body === 'object') {
      const possibleKeys = ['Authorization', 'authorization', 'AUTHORIZATION'];
      for (const key of possibleKeys) {
        if (body[key] && typeof body[key] === 'string') {
          token = body[key].trim();
          if (token.startsWith('Bearer ')) {
            token = token.substring(7).trim();
          }
          break;
        }
      }
    }

    // 优先级3：URL Parameters
    if (!token && paramAuthorization && typeof paramAuthorization === 'string') {
      token = paramAuthorization.trim();
      if (token.startsWith('Bearer ')) {
        token = token.substring(7).trim();
      }
    }

    // 都没有找到有效的 token
    if (!token) {
      throw new Error('Authorization is required. Please provide authorization via Authorization header, request body, or URL parameter');
    }

    // 验证 token 格式（简单的 JWT 格式检查）
    if (token.split('.').length !== 3) {
      throw new Error('Invalid token format. Token must be a valid JWT');
    }

    return this.authService.getCurrentUserByToken(token);
  }

}
