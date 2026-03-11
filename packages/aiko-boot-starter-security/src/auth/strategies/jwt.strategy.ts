import jwt from 'jsonwebtoken';
import { ExtractJwt } from 'passport-jwt';
import { Injectable, Singleton } from '@ai-partner-x/aiko-boot';
import type { IAuthStrategy, JwtPayload } from '../../types.js';
import type { User } from '../../entities/index.js';
import { ConfigLoader } from '@ai-partner-x/aiko-boot/boot';

@Injectable()
@Singleton()
export class JwtStrategy implements IAuthStrategy {
  name = 'jwt';

  private secret: string;

  constructor() {
    this.secret = ConfigLoader.get<string>('security.jwt.secret', 'your-secret-key');
  }

  async authenticate(request: any): Promise<User | null> {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
    if (!token) return null;
    return this.validate(token);
  }

  async validate(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, this.secret);
      const payload = decoded as unknown as JwtPayload;
      return {
        id: payload.sub,
        username: payload.username,
        roles: payload.roles.map(function(name) {
          return { id: 0, name: name };
        }),
      } as User;
    } catch {
      return null;
    }
  }

  async generateToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      username: user.username,
      roles: user.roles ? user.roles.map(function(r) { return r.name; }) : [],
    };
    const expiresIn = ConfigLoader.get<string>('security.jwt.expiresIn', '24h');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return jwt.sign(payload, this.secret, { expiresIn } as any);
  }
}
