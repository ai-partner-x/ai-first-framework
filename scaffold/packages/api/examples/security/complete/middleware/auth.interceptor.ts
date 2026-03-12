import { Injectable, Singleton, Autowired } from '@ai-partner-x/aiko-boot';
import { SecurityContext } from '@ai-partner-x/aiko-boot-starter-security';
import { JwtStrategy } from '@ai-partner-x/aiko-boot-starter-security';
import { SessionStrategy } from '@ai-partner-x/aiko-boot-starter-security';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
@Singleton()
export class AuthInterceptor {
  @Autowired()
  private jwtStrategy!: JwtStrategy;

  @Autowired()
  private sessionStrategy!: SessionStrategy;

  async intercept(req: Request, res: Response, next: NextFunction): Promise<void> {
    const securityContext = SecurityContext.getInstance();

    try {
      let user = null;

      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        const token = req.headers.authorization.substring(7);
        user = await this.jwtStrategy.validate(token);
      } else if (req.session && req.session.userId) {
        user = await this.sessionStrategy.authenticate(req);
      }

      if (user) {
        securityContext.setCurrentUser(user);
      }

      next();
    } catch (error) {
      console.error('Auth error:', error);
      res.status(401).json({ error: '未授权' });
    }
  }
}
