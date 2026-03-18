# Aiko Boot 框架注解问题总结

## 概述

本文档总结了在 Aiko Boot 框架开发过程中发现的装饰器（注解）相关问题及其解决方案。这些问题主要集中在依赖注入、元数据管理和中间件注册等方面。

---

## 问题列表

### 1. @Mapper 装饰器缺少 @Autowired 属性注入支持

**问题描述：**
- `@Mapper` 装饰器包装了构造函数，但没有调用 `injectAutowiredProperties` 来注入 `@Autowired` 属性
- 导致 Mapper 类中的 `@Autowired` 依赖无法正确注入

**影响范围：**
- 所有使用 `@Mapper` 装饰器的类
- 例如：`UserMapper`、`RoleMapper`、`MenuMapper` 等

**修复方案：**

在 `packages/aiko-boot-starter-orm/src/decorators.ts` 的 `@Mapper` 装饰器中添加：

```typescript
// 包装构造函数，在实例化时自动设置适配器
if (entity) {
  const originalConstructor = target;
  const newConstructor = function (this: any, ...args: any[]) {
    const instance = new (originalConstructor as any)(...args);

    // 注入 @Autowired 属性
    injectAutowiredProperties(instance);

    // 如果数据库已初始化且实例有 setAdapter 方法，自动设置适配器
    if (isDatabaseInitialized() && typeof instance.setAdapter === 'function' && !instance.adapter) {
      try {
        const adapter = createAdapterFromEntity(entity as any);
        instance.setAdapter(adapter);
      } catch {
        // 忽略错误，允许手动设置
      }
    }

    return instance;
  } as unknown as T;

  // 复制原型和静态属性
  newConstructor.prototype = originalConstructor.prototype;
  Object.setPrototypeOf(newConstructor, originalConstructor);

  // 复制 metadata
  const metadataKeys = Reflect.getMetadataKeys(originalConstructor);
  metadataKeys.forEach(key => {
    const value = Reflect.getMetadata(key, originalConstructor);
    Reflect.defineMetadata(key, value, newConstructor);
  });

  return newConstructor;
}
```

同时需要添加导入：

```typescript
import { Injectable, Singleton, inject, injectAutowiredProperties } from '@ai-partner-x/aiko-boot/di/server';
```

---

### 2. @Autowired 装饰器类型获取问题

**问题描述：**
- `@Autowired` 装饰器从 `Reflect.getMetadata('design:type', target, propertyKey)` 获取的类型是 `undefined`
- 这导致依赖注入无法正确解析

**可能原因：**
- 装饰器在包装后的构造函数上没有正确工作
- `target.constructor` 指向了包装后的构造函数，而不是原始构造函数
- TypeScript 编译器可能没有正确生成类型元数据

**影响范围：**
- 所有使用 `@Autowired` 装饰器的属性
- 特别是在 `@Mapper` 装饰的类中

**当前实现：**

```typescript
export function Autowired(type?: Function) {
  return function (target: Object, propertyKey: string | symbol): void {
    const existingFields: AutowiredInfo[] = Reflect.getMetadata(AUTOWIRED_METADATA, target.constructor) || [];
    // 优先使用显式指定的类型，否则从 design:type 获取
    const propertyType = type || Reflect.getMetadata('design:type', target, propertyKey);

    existingFields.push({
      propertyKey: String(propertyKey),
      type: propertyType,
    });

    Reflect.defineMetadata(AUTOWIRED_METADATA, existingFields, target.constructor);
  };
}
```

**建议的修复方案：**

1. 确保在所有使用装饰器的文件顶部添加 `import 'reflect-metadata'`
2. 在 `tsconfig.json` 中启用装饰器元数据：
   ```json
   {
     "compilerOptions": {
       "emitDecoratorMetadata": true,
       "experimentalDecorators": true
     }
   }
   ```
3. 考虑在 `@Autowired` 装饰器中添加调试信息：
   ```typescript
   console.log(`[Autowired] Property: ${String(propertyKey)}, Type: ${propertyType?.name || 'undefined'}`);
   ```

---

### 3. 装饰器元数据复制不完整

**问题描述：**
- `@Mapper`、`@Service`、`@Component`、`@RestController` 等装饰器都包装了构造函数
- 虽然复制了元数据，但 `@Autowired` 装饰器存储的元数据可能没有正确复制

**当前实现：**

```typescript
// 复制 metadata
const metadataKeys = Reflect.getMetadataKeys(originalConstructor);
metadataKeys.forEach(key => {
  const value = Reflect.getMetadata(key, originalConstructor);
  Reflect.defineMetadata(key, value, newConstructor);
});
```

**潜在问题：**
- 元数据复制的时机可能不对
- `@Autowired` 装饰器可能在构造函数包装之后才执行
- 需要确保元数据在包装之前已经设置

**建议的修复方案：**

1. 在装饰器执行顺序上确保 `@Autowired` 在构造函数包装之前执行
2. 添加元数据复制的验证：
   ```typescript
   // 复制 metadata
   const metadataKeys = Reflect.getMetadataKeys(originalConstructor);
   console.log(`[Decorator] Copying ${metadataKeys.length} metadata keys`);
   metadataKeys.forEach(key => {
     const value = Reflect.getMetadata(key, originalConstructor);
     Reflect.defineMetadata(key, value, newConstructor);
   });
   ```

---

### 4. 依赖注入不一致性

**问题描述：**
- `@Service`、`@Component`、`@RestController` 装饰器都正确调用了 `injectAutowiredProperties`
- `@Mapper` 装饰器之前没有调用，现在已经修复
- 但 `@Autowired` 装饰器本身的类型获取仍然有问题

**当前状态：**

| 装饰器 | @Autowired 支持 | 状态 |
|---------|---------------|------|
| @Service | ✅ | 正确支持 |
| @Component | ✅ | 正确支持 |
| @RestController | ✅ | 正确支持 |
| @Mapper | ✅ | 已修复，支持 @Autowired |
| @Autowired | ❌ | 类型获取有问题 |

**建议的改进：**

统一所有装饰器的依赖注入行为，确保：
1. 所有装饰器都调用 `injectAutowiredProperties`
2. 所有装饰器都正确复制元数据
3. 所有装饰器都支持构造函数参数注入

---

### 5. JWT Secret 不一致

**问题描述：**
- `JwtStrategy` 和 `AuthService` 使用不同的 JWT secret
- `JwtStrategy` 使用 `ConfigLoader.get('security.jwt.secret', 'your-secret-key')`
- `AuthService` 使用 `process.env.JWT_SECRET || 'ai-first-admin-secret-change-in-production'`

**影响范围：**
- JWT token 验证失败
- 登录成功后无法访问需要认证的接口

**修复方案：**

在 `packages/aiko-boot-starter-security/src/auth/strategies/jwt.strategy.ts` 中：

```typescript
constructor() {
  this.secret = process.env.JWT_SECRET || ConfigLoader.get<string>('security.jwt.secret', 'ai-first-admin-secret-change-in-production');
}
```

同时需要支持 `userId` 字段：

```typescript
async validate(token: string): Promise<User | null> {
  try {
    const decoded = jwt.verify(token, this.secret);
    const payload = decoded as unknown as JwtPayload;
    return {
      id: payload.sub || payload.userId,
      username: payload.username,
      roles: payload.roles.map(function(name) {
        return { id: 0, name: name };
      }),
    } as User;
  } catch {
    return null;
  }
}
```

---

### 6. 中间件注册顺序问题

**问题描述：**
- `getExpressApp()` 返回的 Express 实例在路由注册之后才可用
- 导致在 `server.ts` 中添加的中间件不会在路由之前执行

**影响范围：**
- 自定义中间件（如认证中间件）无法正确拦截请求
- 中间件执行顺序不符合预期

**修复方案：**

在 `packages/aiko-boot-starter-web/src/auto-configuration.ts` 中：

```typescript
// Spring Boot 风格配置读取
const contextPath = ConfigLoader.get<string>('server.servlet.contextPath', '/api');
const maxHttpPostSize = ConfigLoader.get<string>('server.maxHttpPostSize', '10mb');
const verbose = context.verbose;

// 创建 Express 应用
const app = express();

// CORS (默认启用)
const corsModule = await import('cors');
app.use(corsModule.default());

// Body parser
app.use(express.json({ limit: maxHttpPostSize }));

// 注册到应用上下文（在路由注册之前，允许添加自定义中间件）
context.registerHttpServer(new ExpressHttpServer(app));

// 收集 Controller 并注册路由
const controllers = context.components.get('controller') || [];
const validControllers = controllers.filter((c: Function) => getControllerMetadata(c)) as (new (...args: any[]) => any)[];

if (validControllers.length > 0) {
  app.use(createExpressRouter(validControllers, { prefix: contextPath, verbose }));
  if (verbose) {
    console.log(`📡 [aiko-web] Registered ${validControllers.length} controller(s)`);
  }
} else {
  console.warn('[aiko-web] No controllers found!');
}

// 全局异常处理
ExceptionHandlerRegistry.initialize();
app.use(createErrorHandler());
```

**关键改动：**
- 将 `context.registerHttpServer(new ExpressHttpServer(app))` 移到路由注册之前
- 这样可以在路由注册之前添加自定义中间件

---

### 7. @Mapper 装饰器缺少 injectAutowiredProperties 导入

**问题描述：**
- `@Mapper` 装饰器需要使用 `injectAutowiredProperties`，但没有导入

**修复方案：**

在 `packages/aiko-boot-starter-orm/src/decorators.ts` 中添加导入：

```typescript
import { Injectable, Singleton, inject, injectAutowiredProperties } from '@ai-partner-x/aiko-boot/di/server';
```

---

## 总结

### 主要问题分类

1. **装饰器元数据管理**
   - `@Autowired` 类型获取失败
   - 元数据复制不完整
   - 装饰器执行顺序问题

2. **依赖注入一致性**
   - 不同装饰器的依赖注入行为不一致
   - `@Mapper` 装饰器缺少 `@Autowired` 支持

3. **中间件注册顺序**
   - 自定义中间件需要在路由之前注册
   - Express 应用实例的获取时机问题

4. **配置不一致**
   - JWT secret 在不同模块中使用不同的默认值
   - 配置加载方式不统一

### 建议的改进方向

1. **统一装饰器的元数据处理逻辑**
   - 创建统一的元数据管理工具
   - 确保所有装饰器使用相同的元数据处理方式

2. **确保 @Autowired 装饰器能正确获取类型信息**
   - 添加类型获取的调试信息
   - 提供类型获取失败的降级方案

3. **统一配置管理**
   - 避免硬编码默认值
   - 使用统一的配置加载机制
   - 提供配置验证和警告

4. **提供更清晰的中间件注册机制**
   - 明确中间件注册的时机
   - 提供中间件注册的钩子函数
   - 支持中间件优先级配置

5. **增强错误处理和日志**
   - 在关键位置添加调试日志
   - 提供更清晰的错误信息
   - 支持开发模式的详细日志

### 相关文件

- `packages/aiko-boot-starter-orm/src/decorators.ts`
- `packages/aiko-boot-starter-security/src/auth/strategies/jwt.strategy.ts`
- `packages/aiko-boot-starter-security/src/interceptor/auth.interceptor.ts`
- `packages/aiko-boot-starter-web/src/auto-configuration.ts`
- `packages/aiko-boot/src/di/decorators.ts`
- `packages/aiko-boot/src/decorators.ts`

### 测试建议

1. 为每个装饰器编写单元测试
2. 测试依赖注入的正确性
3. 测试中间件的执行顺序
4. 测试配置的一致性
5. 测试元数据的正确复制

---

## 附录：装饰器使用示例

### 正确的使用方式

```typescript
import 'reflect-metadata';
import { Service, Autowired } from '@ai-partner-x/aiko-boot';
import { UserMapper } from '../mapper/user.mapper.js';

@Service()
export class UserService {
  @Autowired()
  private userMapper!: UserMapper;

  async findUser(id: number) {
    return this.userMapper.selectById(id);
  }
}
```

### Mapper 的使用方式

```typescript
import 'reflect-metadata';
import { Mapper } from '@ai-partner-x/aiko-boot-starter-orm';
import { User } from '../entities/user.entity.js';

@Mapper(User)
export class UserMapper extends BaseMapper<User> {
  // @Autowired 属性会自动注入
  // 不需要手动调用 injectAutowiredProperties
}
```

### Controller 的使用方式

```typescript
import 'reflect-metadata';
import { RestController, Get, Autowired } from '@ai-partner-x/aiko-boot-starter-web';
import { UserService } from '../service/user.service.js';

@RestController('/api/users')
export class UserController {
  @Autowired()
  private userService!: UserService;

  @Get('/:id')
  async getUser(req: any, res: any) {
    const user = await this.userService.findUser(req.params.id);
    res.json(user);
  }
}
```

---

**文档版本：** 1.0
**最后更新：** 2025-03-14
**维护者：** Aiko Boot Team
