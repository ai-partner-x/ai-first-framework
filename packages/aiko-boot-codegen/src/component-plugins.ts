/**
 * Component Plugins for Code Generation
 * 
 * Plugins to handle Redis, Message Queue, Security, and Admin components
 */
import type { TranspilePlugin, TransformContext } from './plugins.js';
import type { ParsedDecorator, ParsedMethod, ParsedClass } from './types.js';

// ==================== Redis Plugin ====================

/**
 * Redis plugin for code generation
 */
export const redisPlugin: TranspilePlugin = {
  name: 'redis',
  transformDecorator: (decorator: ParsedDecorator, _context: TransformContext) => {
    switch (decorator.name) {
      case 'RedisHash':
        return {
          ...decorator,
          name: 'RedisHash'
        };
      case 'RedisKey':
      case 'Id':
        return {
          ...decorator,
          name: 'Id'
        };
      case 'RedisValue':
      case 'Indexed':
        return {
          ...decorator,
          name: 'Indexed'
        };
      case 'RedisRepository':
      case 'RedisRepo':
        return {
          ...decorator,
          name: 'Repository'
        };
      default:
        return decorator;
    }
  },
  transformClass: (cls: ParsedClass, _context: TransformContext) => {
    // Add Redis-specific logic if needed
    return cls;
  }
};

// ==================== Message Queue Plugin ====================

/**
 * Message Queue plugin for code generation
 */
export const mqPlugin: TranspilePlugin = {
  name: 'mq',
  transformDecorator: (decorator: ParsedDecorator, _context: TransformContext) => {
    switch (decorator.name) {
      case 'MqListener':
      case 'StreamListener':
        return {
          ...decorator,
          name: 'StreamListener'
        };
      case 'MqSender':
      case 'Output':
        return {
          ...decorator,
          name: 'Output'
        };
      case 'MqBinding':
      case 'EnableBinding':
        return {
          ...decorator,
          name: 'EnableBinding'
        };
      default:
        return decorator;
    }
  },
  transformMethod: (method: ParsedMethod, _context: TransformContext) => {
    // Add MQ-specific logic if needed
    return method;
  }
};

// ==================== Security Plugin ====================

/**
 * Security plugin for code generation
 */
export const securityPlugin: TranspilePlugin = {
  name: 'security',
  transformDecorator: (decorator: ParsedDecorator, _context: TransformContext) => {
    switch (decorator.name) {
      case 'PreAuthorize':
      case 'PostAuthorize':
      case 'Secured':
      case 'RolesAllowed':
      case 'AuthenticationPrincipal':
      case 'EnableGlobalMethodSecurity':
        return decorator;
      default:
        return decorator;
    }
  },
  transformMethod: (method: ParsedMethod, _context: TransformContext) => {
    // Add security-specific logic if needed
    return method;
  }
};

// ==================== Admin Plugin ====================

/**
 * Admin plugin for code generation
 */
export const adminPlugin: TranspilePlugin = {
  name: 'admin',
  transformDecorator: (decorator: ParsedDecorator, _context: TransformContext) => {
    switch (decorator.name) {
      case 'AdminMenu':
      case 'AdminRoute':
      case 'AdminPermission':
      case 'AdminModule':
        return decorator;
      default:
        return decorator;
    }
  },
  transformClass: (cls: ParsedClass, _context: TransformContext) => {
    // Add admin-specific logic if needed
    return cls;
  }
};

// ==================== Get All Component Plugins ====================

/**
 * Get all component plugins
 */
export function getComponentPlugins(): TranspilePlugin[] {
  return [
    redisPlugin,
    mqPlugin,
    securityPlugin,
    adminPlugin
  ];
}