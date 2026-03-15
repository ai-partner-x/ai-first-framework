import { Autowired } from '@ai-partner-x/aiko-boot';
import { JwtStrategy } from '../auth/strategies/jwt.strategy.js';
import { SecurityContext } from '../context/security.context.js';
import { ConfigLoader } from '@ai-partner-x/aiko-boot/boot';

// 移除 @Injectable() 和 @Singleton() 装饰器
// 让 SecurityAutoConfiguration 通过 @Bean() 和 @ConditionalOnMissingBean() 来管理Bean创建
export class AuthInterceptor {
  @Autowired()
  private jwtStrategy!: JwtStrategy;

  @Autowired()
  private securityContext!: SecurityContext;

  async intercept(request: any, response: any, next: any): Promise<void> {
    const publicPaths = ConfigLoader.get<string[]>('security.publicPaths', []);
    const requestPath = request.path;

    const isPublic = publicPaths.some(function(path) {
      return requestPath.indexOf(path) === 0;
    });

    if (isPublic) {
      next();
      return;
    }

    const user = await this.jwtStrategy.authenticate(request);

    if (user) {
      this.securityContext.setCurrentUser(user);
      request.user = user;
      next();
    } else {
      // 认证失败，返回401错误
      response.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }
  }
}
