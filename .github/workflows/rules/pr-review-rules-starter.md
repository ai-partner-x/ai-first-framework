# Server Starter PR Review Rules

服务端 Starter 插件 PR 审查规则

## 适用目录

- `packages/aiko-boot-starter-*/` - Starter 插件包

## 包名规范检查

- 包名是否符合 `@ai-partner-x/aiko-boot-starter-{功能}` 格式
- 功能名称是否简短清晰（如 orm, web, redis, mq）
- 包描述是否清晰说明插件用途

## 配置规范检查

- 配置前缀是否简短有意义（如 database, redis, mq）
- 配置属性类命名是否为 `{Feature}Properties`
- 是否提供配置示例
- 配置项是否有默认值

## 自动配置类检查

- 类命名是否为 `{Feature}AutoConfiguration`
- 是否使用 `@AutoConfiguration` 标记
- order 值是否合理（与其他 starter 协调）
- 是否使用 `@ConditionalOnProperty` 让用户可控启用/禁用
- 是否使用 `@ConditionalOnMissingBean` 允许用户覆盖默认实现

## Bean 定义检查

- `@Bean` 方法返回类型是否清晰
- 是否使用 `@ConditionalOnMissingBean` 避免重复注册
- Bean 生命周期管理是否正确

## 类型扩展检查

- 是否提供 `config-augment.ts` 扩展 `AppConfig` 接口
- 类型定义是否完整，让用户的 `app.config.ts` 有智能提示
- 是否导出类型扩展供其他包使用

## 日志输出检查

- 是否使用 emoji 前缀标识模块（如 `🗄️ [aiko-orm]`）
- 关键操作是否输出日志便于调试
- 启动/关闭日志是否清晰

## 导出规范检查

- `index.ts` 是否正确导出所有公共 API
- 是否导出 `@AutoConfiguration` 标记的类
- 是否导出配置属性类
- 是否导出类型扩展

## 文档检查

- README 是否包含安装和使用说明
- 是否提供配置示例
- 是否说明与其他 starter 的依赖关系
