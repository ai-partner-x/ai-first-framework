/**
 * @ai-partner-x/aiko-boot
 * 
 * Aiko Boot - Core Boot
 * 
 * Includes:
 * - Dependency Injection (DI)
 * - Domain decorators (@Service, @Component)
 * - Configuration system (@ConfigurationProperties, @Value)
 * - Auto-configuration (@AutoConfiguration, @ConditionalOn*)
 * - Lifecycle events (@OnApplicationReady, @EventListener)
 * - Exception handling (@ControllerAdvice, @ExceptionHandler)
 * 
 * ORM decorators -> @ai-partner-x/aiko-boot-starter-orm
 * Web decorators -> @ai-partner-x/aiko-boot-starter-web
 * Validation decorators -> @ai-partner-x/aiko-boot-starter-validation
 */

// Export types
export * from './types.js';

// Export config types (统一配置类型 - Spring Boot 风格)
export type {
  AppConfig,
  LoggingConfig,
  LoggingLevelConfig,
} from './config-types.js';

// Export domain decorators
export {
  Component,
  Service,
  Transactional,
  getComponentMetadata,
  getServiceMetadata,
  isTransactional,
} from './decorators.js';

// Re-export DI (for convenience)
export {
  Container,
  Lifecycle,
  Injectable,
  Inject,
  inject,
  Singleton,
  Scoped,
  AutoRegister,
  Autowired,
  getAutowiredProperties,
  injectAutowiredProperties,
  registry,
} from './di/server.js';

export type { DependencyContainer, InjectionToken } from 'tsyringe';

// Re-export createApp (main entry point)
export {
  createApp,
  getApplicationContext,
  type ApplicationContext,
  type AppOptions,
  type HttpServer,
} from './boot/bootstrap.js';
