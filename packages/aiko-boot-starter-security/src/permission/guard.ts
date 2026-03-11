import { Injectable, Singleton, Autowired } from '@ai-partner-x/aiko-boot';
import { PermissionExpressionParser } from './expression-parser.js';
import { PermissionService } from './permission.service.js';
import type { User } from '../entities/index.js';

@Injectable()
@Singleton()
export class PermissionGuard {
  @Autowired()
  private permissionService!: PermissionService;

  @Autowired()
  private expressionParser!: PermissionExpressionParser;

  async canActivate(user: User | null, expression: string): Promise<boolean> {
    if (!user) {
      return false;
    }

    const parsed = this.expressionParser.parse(expression);
    return this.expressionParser.evaluate(parsed, user);
  }

  async canActivateWithPermissions(user: User | null, permissions: string[]): Promise<boolean> {
    if (!user) {
      return false;
    }

    return this.permissionService.hasPermissions(user, permissions);
  }
}
