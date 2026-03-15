import 'reflect-metadata';

export type { User, Role, Permission, Menu, UserRole, RolePermission, PermissionType } from './entities/index.js';
export type { IAuthStrategy, LoginDto, LoginResult, JwtPayload, SecurityConfig } from './types.js';
export { defaultSecurityConfig } from './types.js';

export { JwtStrategy, OAuth2Strategy, SessionStrategy, LocalStrategy } from './auth/index.js';
export { Public, Authenticated, RolesAllowed, getPublicMetadata, getAuthenticatedMetadata, getRolesMetadata } from './auth/index.js';
export { AuthService } from './auth/index.js';

export {
  PreAuthorize,
  PostAuthorize,
  Secured,
  RequirePermission,
  ApiPermission,
  MethodPermission,
  ButtonPermission,
  getPreAuthorizeMetadata,
  getPostAuthorizeMetadata,
  getSecuredMetadata,
  getRequirePermissionMetadata,
  getApiPermissionMetadata,
  getMethodPermissionMetadata,
  getButtonPermissionMetadata,
  getAllPermissionMetadata,
  type PermissionDefinition,
} from './permission/index.js';
export type { PermissionExpression } from './permission/index.js';
export { PermissionExpressionParser } from './permission/index.js';
export { PermissionService } from './permission/index.js';
export { PermissionGuard } from './permission/index.js';
export {
  PermissionMetadataCollector,
  getGlobalPermissionMetadataCollector,
  exportPermissionConfig,
  type PermissionMetadata,
} from './permission/index.js';

export { SecurityContext } from './context/index.js';

export { AuthInterceptor, PermissionInterceptor } from './interceptor/index.js';

export { SecurityAutoConfiguration, type SecurityProperties } from './auto-configuration.js';
import './config-augment.js';

export { SECURITY_JAVA_MAPPING, getJavaMapping, getAllSecurityJavaMappings } from './java-mapping.js';
