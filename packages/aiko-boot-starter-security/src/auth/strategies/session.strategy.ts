import { Injectable, Singleton } from '@ai-partner-x/aiko-boot';
import type { IAuthStrategy } from '../../types.js';
import type { User } from '../../entities/index.js';

@Injectable()
@Singleton()
export class SessionStrategy implements IAuthStrategy {
  name = 'session';

  async authenticate(request: any): Promise<User | null> {
    if (request.session && request.session.userId) {
      return {
        id: request.session.userId,
        username: request.session.username,
      } as User;
    }
    return null;
  }

  async validate(_token: string): Promise<User | null> {
    return null;
  }

  async generateToken(_user: User): Promise<string> {
    return '';
  }

  async login(request: any, user: User): Promise<void> {
    request.session.userId = user.id;
    request.session.username = user.username;
  }

  async logout(request: any): Promise<void> {
    request.session.destroy(function() {});
  }
}
