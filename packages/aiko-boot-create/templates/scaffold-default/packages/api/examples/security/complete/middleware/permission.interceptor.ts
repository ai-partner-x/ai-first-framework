import { Injectable, Singleton, Autowired } from '@ai-partner-x/aiko-boot';
import { SecurityContext } from '@ai-partner-x/aiko-boot-starter-security';
import { PermissionService } from '../service/permission.service.js';
import { PermissionExpressionParser } from '@ai-partner-x/aiko-boot-starter-security';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
@Singleton()
export class PermissionInterceptor {
  @Autowired()
  private permissionService!: PermissionService;

  private parser = new PermissionExpressionParser();

  async intercept(req: Request, res: Response, next: NextFunction): Promise<void> {
    const securityContext = SecurityContext.getInstance();
    const currentUser = securityContext.getCurrentUser();

    if (!currentUser) {
      return res.status(401).json({ error: '未授权' });
    }

    const permissionExpression = this.getPermissionExpression(req);
    
    if (permissionExpression) {
      const hasPermission = await this.parser.evaluate(
        permissionExpression,
        currentUser,
        this.permissionService
      );

      if (!hasPermission) {
        return res.status(403).json({ error: '禁止访问' });
      }
    }

    next();
  }

  private getPermissionExpression(req: Request): string | null {
    const route = req.route;
    if (!route) {
      return null;
    }

    const metadata = Reflect.getMetadata('aiko-boot:preAuthorize', route);
    if (metadata) {
      return metadata as string;
    }

    const rolesMetadata = Reflect.getMetadata('aiko-boot:roles', route);
    if (rolesMetadata && Array.isArray(rolesMetadata)) {
      const roles = rolesMetadata as string[];
      if (roles.length > 0) {
        return `hasAnyRole('${roles.join("','")}')`;
      }
    }

    return null;
  }
}
