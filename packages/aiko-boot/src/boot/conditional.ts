/**
 * Conditional Decorators - Spring Boot Style Conditional Configuration
 * 
 * 支持:
 * 1. @ConditionalOnClass - 类存在时才加载
 * 2. @ConditionalOnMissingClass - 类不存在时才加载
 * 3. @ConditionalOnProperty - 配置满足条件时才加载
 * 4. @ConditionalOnMissingBean - Bean 不存在时才加载
 * 5. @ConditionalOnBean - Bean 存在时才加载
 * 6. @ConditionalOnExpression - 表达式为真时才加载
 * 7. @Configuration - 配置类标记
 * 8. @Bean - 方法级别的 Bean 定义
 * 
 * @example
 * ```typescript
 * @Configuration()
 * @ConditionalOnProperty('cache.enabled', { havingValue: 'true' })
 * export class CacheAutoConfiguration {
 *   @Bean()
 *   @ConditionalOnMissingBean(CacheService)
 *   createCacheService(): CacheService {
 *     return new RedisCacheService();
 *   }
 * }
 * ```
 */
import 'reflect-metadata';
import { Injectable, Singleton } from '../di/server.js';
import { Container } from '../di/server.js';
import { ConfigLoader } from './config.js';

// Metadata keys (使用字符串而非 Symbol，以便跨 ESM 模块共享)
const CONDITIONAL_METADATA = 'aiko-boot:conditional';
const CONFIGURATION_METADATA = 'aiko-boot:configuration';
const BEAN_METADATA = 'aiko-boot:bean';

// 条件类型
export type ConditionType = 
  | 'onClass' 
  | 'onMissingClass' 
  | 'onProperty' 
  | 'onMissingBean' 
  | 'onBean'
  | 'onExpression';

// 条件定义
export interface Condition {
  type: ConditionType;
  value: any;
  options?: Record<string, any>;
}

// 已注册的配置类
const configurationClasses: Array<{ target: Function; conditions: Condition[] }> = [];

// Bean 定义
interface BeanDefinition {
  methodName: string;
  beanName?: string;
  conditions: Condition[];
}

/**
 * @Configuration - 标记配置类
 * 
 * 配置类用于定义 Bean 和自动配置逻辑
 * 
 * @example
 * ```typescript
 * @Configuration()
 * export class AppConfiguration {
 *   @Bean()
 *   createService(): MyService {
 *     return new MyService();
 *   }
 * }
 * ```
 */
export function Configuration() {
  return function <T extends { new (...args: any[]): any }>(target: T) {
    Reflect.defineMetadata(CONFIGURATION_METADATA, { className: target.name }, target);
    
    // 收集类级别的条件
    const conditions = Reflect.getMetadata(CONDITIONAL_METADATA, target) || [];
    
    // 注册到全局列表
    configurationClasses.push({ target, conditions });

    // Apply DI decorators
    Injectable()(target);
    Singleton()(target);

    return target;
  };
}

/**
 * @Bean - 方法级别的 Bean 定义
 * 
 * @param name - Bean 名称（可选，默认使用方法名）
 * 
 * @example
 * ```typescript
 * @Configuration()
 * export class DataSourceConfiguration {
 *   @Bean('dataSource')
 *   createDataSource(): DataSource {
 *     return new PostgresDataSource();
 *   }
 * }
 * ```
 */
export function Bean(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const beans: BeanDefinition[] = Reflect.getMetadata(BEAN_METADATA, target.constructor) || [];
    const conditions = Reflect.getMetadata(CONDITIONAL_METADATA, target, propertyKey) || [];
    
    beans.push({
      methodName: propertyKey,
      beanName: name || propertyKey,
      conditions,
    });
    
    Reflect.defineMetadata(BEAN_METADATA, beans, target.constructor);
    return descriptor;
  };
}

/**
 * @ConditionalOnClass - 指定类存在时才加载
 * 
 * @param classes - 需要存在的类数组
 * 
 * @example
 * ```typescript
 * @Configuration()
 * @ConditionalOnClass([Redis])
 * export class RedisAutoConfiguration { ... }
 * ```
 */
export function ConditionalOnClass(classes: Function | Function[]) {
  return addCondition('onClass', Array.isArray(classes) ? classes : [classes]);
}

/**
 * @ConditionalOnMissingClass - 指定类不存在时才加载
 */
export function ConditionalOnMissingClass(classes: Function | Function[]) {
  return addCondition('onMissingClass', Array.isArray(classes) ? classes : [classes]);
}

/**
 * @ConditionalOnProperty - 配置满足条件时才加载
 * 
 * @param name - 配置键名
 * @param options - 条件选项
 * 
 * @example
 * ```typescript
 * @Configuration()
 * @ConditionalOnProperty('cache.enabled', { havingValue: 'true' })
 * export class CacheAutoConfiguration { ... }
 * 
 * // 或简单检查属性存在
 * @ConditionalOnProperty('database.url')
 * export class DatabaseAutoConfiguration { ... }
 * ```
 */
export function ConditionalOnProperty(
  name: string,
  options: { 
    havingValue?: string | boolean | number;
    matchIfMissing?: boolean;
  } = {}
) {
  return addCondition('onProperty', name, options);
}

/**
 * @ConditionalOnMissingBean - Bean 不存在时才加载
 * 
 * @param beanType - Bean 类型
 * 
 * @example
 * ```typescript
 * @Bean()
 * @ConditionalOnMissingBean(CacheService)
 * createDefaultCache(): CacheService {
 *   return new InMemoryCache();
 * }
 * ```
 */
export function ConditionalOnMissingBean(beanType: Function) {
  return addCondition('onMissingBean', beanType);
}

/**
 * @ConditionalOnBean - Bean 存在时才加载
 */
export function ConditionalOnBean(beanType: Function) {
  return addCondition('onBean', beanType);
}

/**
 * @ConditionalOnExpression - 表达式为真时才加载
 * 
 * @param expression - 返回 boolean 的函数
 * 
 * @example
 * ```typescript
 * @ConditionalOnExpression(() => process.env.NODE_ENV === 'production')
 * export class ProductionOnlyConfig { ... }
 * ```
 */
export function ConditionalOnExpression(expression: () => boolean) {
  return addCondition('onExpression', expression);
}

/**
 * 添加条件装饰器的通用方法
 */
function addCondition(type: ConditionType, value: any, options?: Record<string, any>) {
  return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
    const condition: Condition = { type, value, options };
    
    if (propertyKey && descriptor) {
      // 方法级别的条件
      const conditions = Reflect.getMetadata(CONDITIONAL_METADATA, target, propertyKey) || [];
      conditions.push(condition);
      Reflect.defineMetadata(CONDITIONAL_METADATA, conditions, target, propertyKey);
      return descriptor;
    } else {
      // 类级别的条件
      const conditions = Reflect.getMetadata(CONDITIONAL_METADATA, target) || [];
      conditions.push(condition);
      Reflect.defineMetadata(CONDITIONAL_METADATA, conditions, target);
      return target;
    }
  };
}

/**
 * 评估条件是否满足
 */
export function evaluateCondition(condition: Condition): boolean {
  switch (condition.type) {
    case 'onClass':
      // 检查类是否存在（通过检查是否为函数）
      return (condition.value as Function[]).every(cls => typeof cls === 'function');
    
    case 'onMissingClass':
      return (condition.value as Function[]).every(cls => typeof cls !== 'function');
    
    case 'onProperty': {
      const propertyValue = ConfigLoader.get(condition.value as string);
      const { havingValue, matchIfMissing = false } = condition.options || {};
      
      if (propertyValue === undefined) {
        return matchIfMissing;
      }
      
      if (havingValue !== undefined) {
        return String(propertyValue) === String(havingValue);
      }
      
      // 只检查属性存在
      return true;
    }
    
    case 'onMissingBean':
      return !Container.isRegistered(condition.value);
    
    case 'onBean':
      return Container.isRegistered(condition.value);
    
    case 'onExpression':
      return (condition.value as () => boolean)();
    
    default:
      return true;
  }
}

/**
 * 评估所有条件
 */
export function evaluateConditions(conditions: Condition[]): boolean {
  return conditions.every(evaluateCondition);
}

/**
 * 检查配置类是否应该被加载
 */
export function shouldLoadConfiguration(target: Function): boolean {
  const conditions = Reflect.getMetadata(CONDITIONAL_METADATA, target) || [];
  return evaluateConditions(conditions);
}

/**
 * 检查 Bean 方法是否应该被加载
 */
export function shouldLoadBean(target: any, methodName: string): boolean {
  const conditions = Reflect.getMetadata(CONDITIONAL_METADATA, target, methodName) || [];
  return evaluateConditions(conditions);
}

/**
 * 获取配置类元数据
 */
export function getConfigurationMetadata(target: any): { className: string } | undefined {
  return Reflect.getMetadata(CONFIGURATION_METADATA, target);
}

/**
 * 获取 Bean 定义列表
 */
export function getBeanDefinitions(target: Function): BeanDefinition[] {
  return Reflect.getMetadata(BEAN_METADATA, target) || [];
}

/**
 * 获取所有注册的配置类
 */
export function getConfigurationClasses(): Array<{ target: Function; conditions: Condition[] }> {
  return configurationClasses;
}

/**
 * 处理配置类，注册满足条件的 Bean
 */
export function processConfiguration(ConfigurationClass: Function): void {
  // 检查类级别条件
  if (!shouldLoadConfiguration(ConfigurationClass)) {
    return;
  }

  // 解析配置类实例
  const instance = Container.resolve(ConfigurationClass as any);
  
  // 获取 Bean 定义
  const beanDefs = getBeanDefinitions(ConfigurationClass);
  
  for (const beanDef of beanDefs) {
    // 检查 Bean 级别条件
    if (!evaluateConditions(beanDef.conditions)) {
      continue;
    }

    // 调用 Bean 方法创建实例
    const beanInstance = (instance as any)[beanDef.methodName]();
    
    // 注册到 DI 容器
    if (beanInstance && beanInstance.constructor) {
      Container.registerInstance(beanInstance.constructor, beanInstance);
    }
  }
}

/**
 * 初始化所有配置类（在 createApp 中调用）
 */
export function initializeConfigurations(): void {
  for (const { target } of configurationClasses) {
    try {
      processConfiguration(target);
    } catch (e) {
      console.warn(`[aiko-boot] Failed to process configuration ${target.name}: ${(e as Error).message}`);
    }
  }
}
