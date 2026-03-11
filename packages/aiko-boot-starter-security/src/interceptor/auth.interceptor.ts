import { Injectable, Singleton, Autowired } from '@ai-partner-x/aiko-boot';
import { JwtStrategy } from '../auth/strategies/jwt.strategy.js';
import { SecurityContext } from '../context/security.context.js';
import { ConfigLoader } from '@ai-partner-x/aiko-boot/boot';

@Injectable()
@Singleton()
export class AuthInterceptor {
  @Autowired()
  private jwtStrategy!: JwtStrategy;

  @Autowired()
  private securityContext!: SecurityContext;

  async intercept(request: any, _response: any, next: any): Promise<void> {
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
    }

    next();
  }
}
