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
  private expiresIn: string;

  constructor() {
    this.secret = process.env.JWT_SECRET || ConfigLoader.get<string>('security.jwt.secret', 'ai-first-admin-secret-change-in-production');
    this.expiresIn = ConfigLoader.get<string>('security.jwt.expiresIn', '2h');
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

      // 支持业务代码的用户权限结构
      // 业务代码使用 permissions: string[] 和 roles: string[]
      const userId = payload.sub || (payload as any).userId;

      return {
        id: userId,
        username: payload.username,
        email: payload.email || '',
        roles: (payload.roles as any[])?.map(function(role: any) {
          // 支持字符串或对象格式
          if (typeof role === 'string') {
            return { id: 0, name: role };
          }
          return { id: role.id || 0, name: role.name };
        }) || [],
        permissions: payload.permissions || [], // 业务代码使用的权限字符串列表
      } as User;
    } catch (error: any) {
      // 重新抛出 JWT 验证错误，让上层处理具体的错误类型
      throw error;
    }
  }

  async generateToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      // 统一使用字符串格式，便于业务代码处理
      roles: user.roles?.map(function(r) { return typeof r === 'string' ? r : r.name; }) || [],
      permissions: user.permissions || [], // 支持权限列表
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn } as any);
  }
}
