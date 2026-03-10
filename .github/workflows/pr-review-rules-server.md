# Server Component PR Review Rules

服务端组件 PR 审查规则

## 适用目录

- `packages/aiko-boot/` - 核心框架
- `packages/aiko-boot-starter-*/` - Starter 插件
- `packages/aiko-boot-codegen/` - 代码生成器

## 命名规范检查

- 包名是否符合 `@ai-partner-x/aiko-boot-starter-{功能}` 格式
- 配置前缀是否简短有意义（如 database, redis, mq）
- 自动配置类命名是否为 `{Feature}AutoConfiguration`
- 配置属性类命名是否为 `{Feature}Properties`

## 条件装配检查

- 是否使用 `@ConditionalOnProperty` 让用户可控启用/禁用
- 是否使用 `@ConditionalOnMissingBean` 允许用户覆盖默认实现
- 条件表达式是否合理

## 生命周期检查

- 初始化是否使用 `@OnApplicationReady`，order 负数优先
- 清理是否使用 `@OnApplicationShutdown`，order 正数延后
- 是否正确处理异步操作

## 类型扩展检查

- 是否提供 `config-augment.ts` 扩展 `AppConfig` 接口
- 类型定义是否完整，让用户的 `app.config.ts` 有智能提示

## 日志输出检查

- 是否使用 emoji 前缀标识模块（如 `🗄️ [aiko-orm]`）
- 关键操作是否输出日志便于调试
- 错误日志是否清晰

## 导出规范检查

- `index.ts` 是否正确导出所有公共 API
- 是否导出 `@AutoConfiguration` 标记的类
- 是否导出类型扩展
