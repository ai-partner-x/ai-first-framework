import 'reflect-metadata';

const PUBLIC_METADATA = 'aiko-boot:public';
const AUTHENTICATED_METADATA = 'aiko-boot:authenticated';
const ROLES_METADATA = 'aiko-boot:roles';

export function Public() {
  return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
    if (propertyKey && descriptor) {
      // 方法装饰器
      Reflect.defineMetadata(PUBLIC_METADATA, true, target, propertyKey);
      return descriptor;
    } else {
      // 类装饰器
      Reflect.defineMetadata(PUBLIC_METADATA, true, target);
      return target;
    }
  };
}

export function Authenticated() {
  return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
    if (propertyKey && descriptor) {
      Reflect.defineMetadata(AUTHENTICATED_METADATA, true, target, propertyKey);
      return descriptor;
    } else {
      Reflect.defineMetadata(AUTHENTICATED_METADATA, true, target);
      return target;
    }
  };
}

export function RolesAllowed() {
  const roles = Array.prototype.slice.call(arguments);
  return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
    if (propertyKey && descriptor) {
      Reflect.defineMetadata(ROLES_METADATA, roles, target, propertyKey);
      return descriptor;
    } else {
      Reflect.defineMetadata(ROLES_METADATA, roles, target);
      return target;
    }
  };
}

export function getPublicMetadata(target: any, propertyKey?: string): boolean {
  if (propertyKey) {
    return Reflect.getMetadata(PUBLIC_METADATA, target, propertyKey) || Reflect.getMetadata(PUBLIC_METADATA, target.constructor) || false;
  }
  return Reflect.getMetadata(PUBLIC_METADATA, target) || Reflect.getMetadata(PUBLIC_METADATA, target.constructor) || false;
}

export function getAuthenticatedMetadata(target: any, propertyKey?: string): boolean {
  if (propertyKey) {
    return Reflect.getMetadata(AUTHENTICATED_METADATA, target, propertyKey) || Reflect.getMetadata(AUTHENTICATED_METADATA, target.constructor) || false;
  }
  return Reflect.getMetadata(AUTHENTICATED_METADATA, target) || Reflect.getMetadata(AUTHENTICATED_METADATA, target.constructor) || false;
}

export function getRolesMetadata(target: any, propertyKey?: string): string[] {
  if (propertyKey) {
    return Reflect.getMetadata(ROLES_METADATA, target, propertyKey) || Reflect.getMetadata(ROLES_METADATA, target.constructor) || [];
  }
  return Reflect.getMetadata(ROLES_METADATA, target) || Reflect.getMetadata(ROLES_METADATA, target.constructor) || [];
}
