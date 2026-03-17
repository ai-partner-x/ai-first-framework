export {
  PreAuthorize,
  PostAuthorize,
  Secured,
  RequirePermission,
  ApiPermission,
  MethodPermission,
  ButtonPermission,
  RolePermission,
  MenuPermission,
  DataPermission,
  getPreAuthorizeMetadata,
  getPostAuthorizeMetadata,
  getSecuredMetadata,
  getRequirePermissionMetadata,
  getApiPermissionMetadata,
  getMethodPermissionMetadata,
  getButtonPermissionMetadata,
  getRolePermissionMetadata,
  getMenuPermissionMetadata,
  getAllPermissionMetadata,
  type PermissionDefinition,
} from './decorators.js';
export { PermissionExpressionParser, type PermissionExpression } from './expression-parser.js';
export { PermissionService } from './permission.service.js';
export { PermissionGuard } from './guard.js';
export {
  PermissionMetadataCollector,
  getGlobalPermissionMetadataCollector,
  exportPermissionConfig,
  type PermissionMetadata,
} from './metadata-collector.js';
