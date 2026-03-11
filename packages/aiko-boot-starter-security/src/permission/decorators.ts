import 'reflect-metadata';

const PRE_AUTHORIZE_METADATA = 'aiko-boot:preAuthorize';
const POST_AUTHORIZE_METADATA = 'aiko-boot:postAuthorize';
const SECURED_METADATA = 'aiko-boot:secured';

export function PreAuthorize(expression: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(PRE_AUTHORIZE_METADATA, expression, target, propertyKey);
    return descriptor;
  };
}

export function PostAuthorize(expression: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(POST_AUTHORIZE_METADATA, expression, target, propertyKey);
    return descriptor;
  };
}

export function Secured() {
  const permissions = Array.prototype.slice.call(arguments);
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(SECURED_METADATA, permissions, target, propertyKey);
    return descriptor;
  };
}

export function getPreAuthorizeMetadata(target: any, propertyKey: string): string | undefined {
  return Reflect.getMetadata(PRE_AUTHORIZE_METADATA, target, propertyKey);
}

export function getPostAuthorizeMetadata(target: any, propertyKey: string): string | undefined {
  return Reflect.getMetadata(POST_AUTHORIZE_METADATA, target, propertyKey);
}

export function getSecuredMetadata(target: any, propertyKey: string): string[] {
  return Reflect.getMetadata(SECURED_METADATA, target, propertyKey) || [];
}
