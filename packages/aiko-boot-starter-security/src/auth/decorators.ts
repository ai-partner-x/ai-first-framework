import 'reflect-metadata';

const PUBLIC_METADATA = 'aiko-boot:public';
const AUTHENTICATED_METADATA = 'aiko-boot:authenticated';
const ROLES_METADATA = 'aiko-boot:roles';

export function Public() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(PUBLIC_METADATA, true, target, propertyKey);
    return descriptor;
  };
}

export function Authenticated() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(AUTHENTICATED_METADATA, true, target, propertyKey);
    return descriptor;
  };
}

export function RolesAllowed() {
  const roles = Array.prototype.slice.call(arguments);
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(ROLES_METADATA, roles, target, propertyKey);
    return descriptor;
  };
}

export function getPublicMetadata(target: any, propertyKey: string): boolean {
  return Reflect.getMetadata(PUBLIC_METADATA, target, propertyKey) || false;
}

export function getAuthenticatedMetadata(target: any, propertyKey: string): boolean {
  return Reflect.getMetadata(AUTHENTICATED_METADATA, target, propertyKey) || false;
}

export function getRolesMetadata(target: any, propertyKey: string): string[] {
  return Reflect.getMetadata(ROLES_METADATA, target, propertyKey) || [];
}
