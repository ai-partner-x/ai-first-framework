import { Injectable, Singleton, Autowired } from '@ai-partner-x/aiko-boot';
import { PermissionGuard } from '../permission/guard.js';
import { SecurityContext } from '../context/security.context.js';
import { getPreAuthorizeMetadata, getSecuredMetadata } from '../permission/decorators.js';

@Injectable()
@Singleton()
export class PermissionInterceptor {
  @Autowired()
  private permissionGuard!: PermissionGuard;

  @Autowired()
  private securityContext!: SecurityContext;

  async intercept(request: any, response: any, next: any): Promise<void> {
    const handler = request.route?.stack?.[request.route?.stack?.length - 1];
    if (!handler) {
      next();
      return;
    }

    const target = handler.handle?.bind(handler);
    if (!target) {
      next();
      return;
    }

    const preAuthorize = getPreAuthorizeMetadata(target, request.method.toLowerCase());
    const secured = getSecuredMetadata(target, request.method.toLowerCase());

    if (!preAuthorize && (!secured || secured.length === 0)) {
      next();
      return;
    }

    const user = this.securityContext.getCurrentUser();

    if (preAuthorize) {
      const canAccess = await this.permissionGuard.canActivate(user, preAuthorize);
      if (!canAccess) {
        response.status(403).json({
          error: 'Forbidden',
          message: 'Access denied. You do not have permission to access this resource.',
        });
        return;
      }
    }

    if (secured && secured.length > 0) {
      const canAccess = await this.permissionGuard.canActivateWithPermissions(user, secured);
      if (!canAccess) {
        response.status(403).json({
          error: 'Forbidden',
          message: 'Access denied. Required permissions: ' + secured.join(', '),
        });
        return;
      }
    }

    next();
  }

  async checkPermission(target: any, propertyKey: string, _request: any): Promise<boolean> {
    const preAuthorize = getPreAuthorizeMetadata(target, propertyKey);
    const secured = getSecuredMetadata(target, propertyKey);

    const user = this.securityContext.getCurrentUser();

    if (preAuthorize) {
      return this.permissionGuard.canActivate(user, preAuthorize);
    }

    if (secured && secured.length > 0) {
      return this.permissionGuard.canActivateWithPermissions(user, secured);
    }

    return true;
  }
}
