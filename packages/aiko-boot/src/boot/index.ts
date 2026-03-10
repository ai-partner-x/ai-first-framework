/**
 * @ai-partner-x/aiko-boot/boot
 * 
 * Spring Boot Style Auto-Configuration and Lifecycle Management
 * 
 * 提供:
 * - 配置系统 (ConfigLoader, @ConfigurationProperties, @Value)
 * - 条件装配 (@ConditionalOnClass, @ConditionalOnProperty, @ConditionalOnMissingBean)
 * - 自动配置 (@AutoConfiguration, AutoConfigurationLoader)
 * - 生命周期事件 (@OnApplicationReady, @OnApplicationShutdown, @EventListener)
 * - 异常处理 (@ControllerAdvice, @ExceptionHandler)
 * 
 * @example
 * ```typescript
 * import { 
 *   ConfigLoader, 
 *   ConfigurationProperties,
 *   AutoConfiguration,
 *   ConditionalOnProperty,
 *   OnApplicationReady,
 * } from '@ai-partner-x/aiko-boot/boot';
 * 
 * // 配置类
 * @ConfigurationProperties('database')
 * export class DatabaseProperties {
 *   host: string = 'localhost';
 *   port: number = 5432;
 * }
 * 
 * // 自动配置
 * @AutoConfiguration()
 * @ConditionalOnProperty('cache.enabled', { havingValue: 'true' })
 * export class CacheAutoConfiguration {
 *   @Bean()
 *   @ConditionalOnMissingBean(CacheService)
 *   createCacheService(): CacheService {
 *     return new InMemoryCache();
 *   }
 * }
 * ```
 */

// Configuration System
export {
  ConfigLoader,
  ConfigurationProperties,
  Value,
  getConfigurationPropertiesMetadata,
  getConfigPropertiesClasses,
  initializeConfigurationProperties,
  injectValueProperties,
} from './config.js';

// Conditional Configuration
export {
  Configuration,
  Bean,
  ConditionalOnClass,
  ConditionalOnMissingClass,
  ConditionalOnProperty,
  ConditionalOnMissingBean,
  ConditionalOnBean,
  ConditionalOnExpression,
  evaluateCondition,
  evaluateConditions,
  shouldLoadConfiguration,
  shouldLoadBean,
  getConfigurationMetadata,
  getBeanDefinitions,
  getConfigurationClasses,
  processConfiguration,
  initializeConfigurations,
  type Condition,
  type ConditionType,
} from './conditional.js';

// Auto Configuration
export {
  AutoConfiguration,
  AutoConfigureBefore,
  AutoConfigureAfter,
  EnableAutoConfiguration,
  AutoConfigurationLoader,
  getAutoConfigurationMetadata,
  getAutoConfigurationClasses,
} from './auto-configuration.js';

// Lifecycle Events
export {
  EventListener,
  OnApplicationStarting,
  OnApplicationStarted,
  OnApplicationReady,
  OnApplicationShutdown,
  Async,
  ApplicationEventPublisher,
  ApplicationLifecycle,
  getLifecycleListeners,
  getEventListeners,
  ApplicationStartingEvent,
  ApplicationStartedEvent,
  ApplicationReadyEvent,
  ApplicationShutdownEvent,
  type LifecycleEvent,
} from './lifecycle.js';

// Exception Handling
export {
  ControllerAdvice,
  ExceptionHandler,
  ResponseStatus,
  BusinessException,
  ValidationException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  ExceptionHandlerRegistry,
  getControllerAdviceMetadata,
  getExceptionHandlers,
  getResponseStatus,
  getControllerAdviceClasses,
  createErrorHandler,
  type ExceptionHandlerResult,
} from './exception.js';

// Bootstrap (Core Application Starter)
export {
  createApp,
  bootstrap,
  setupGracefulShutdown,
  getApplicationContext,
  type ApplicationContext,
  type AppOptions,
  type BootstrapOptions,
  type HttpServer,
} from './bootstrap.js';
