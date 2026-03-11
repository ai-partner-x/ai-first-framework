import bcrypt from 'bcrypt';
import { Injectable, Singleton, Autowired } from '@ai-partner-x/aiko-boot';
import type { IAuthStrategy } from '../../types.js';
import type { User } from '../../entities/index.js';
import { JwtStrategy } from './jwt.strategy.js';

@Injectable()
@Singleton()
export class LocalStrategy implements IAuthStrategy {
  name = 'local';

  @Autowired()
  private jwtStrategy!: JwtStrategy;

  async authenticate(_request: any): Promise<User | null> {
    return null;
  }

  async validate(_token: string): Promise<User | null> {
    return null;
  }

  async generateToken(user: User): Promise<string> {
    return this.jwtStrategy.generateToken(user);
  }

  async verifyPassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
