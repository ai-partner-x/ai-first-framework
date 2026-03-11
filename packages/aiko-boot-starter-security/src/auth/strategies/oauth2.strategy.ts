import { Injectable, Singleton, Autowired } from '@ai-partner-x/aiko-boot';
import type { IAuthStrategy } from '../../types.js';
import type { User } from '../../entities/index.js';
import { JwtStrategy } from './jwt.strategy.js';

@Injectable()
@Singleton()
export class OAuth2Strategy implements IAuthStrategy {
  name = 'oauth2';

  @Autowired()
  private jwtStrategy!: JwtStrategy;

  async authenticate(_request: any): Promise<User | null> {
    return null;
  }

  async validate(token: string): Promise<User | null> {
    return this.jwtStrategy.validate(token);
  }

  async generateToken(user: User): Promise<string> {
    return this.jwtStrategy.generateToken(user);
  }
}
