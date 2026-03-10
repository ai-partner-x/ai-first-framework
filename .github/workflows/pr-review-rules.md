# Aiko Boot PR 审查规则

此文件定义了 PR 审查时使用的规则和检查项。

## PR 类型识别

根据 PR 修改的文件路径，自动识别 PR 类型：

| 类型 | 目录 | 规则文件 |
|------|------|----------|
| 服务端组件 | `packages/aiko-boot/`, `packages/aiko-boot-starter-*/`, `packages/aiko-boot-codegen/` | server-starter / server-core |
| 管理后台 | `app/examples/admin/` | example-admin |
| 移动端 | `app/examples/mobile/` | example-mobile |

---

## 通用审查规则

适用于所有 PR 的基础审查：

### 1. 检查结果分析
- 分析类型检查、ESLint、测试的结果
- 识别关键问题并优先处理

### 2. 代码质量
- 代码是否清晰易读
- 是否遵循项目的编码规范
- 是否有重复代码可以重构

### 3. 潜在问题
- 是否有潜在的 Bug 或逻辑错误
- 是否有安全风险（如 SQL 注入、XSS 等）
- 是否有性能问题

### 4. 最佳实践
- 是否遵循 TypeScript/JavaScript 最佳实践
- 是否正确使用了框架提供的功能
- 错误处理是否完善

### 5. 测试覆盖
- 是否需要添加单元测试
- 边界情况是否考虑

---

## server-starter / server-core 专项审查

**触发条件**: PR 修改了 `packages/aiko-boot/` 或 `packages/aiko-boot-starter-*/`

### 命名规范检查
- 包名是否符合 `@ai-partner-x/aiko-boot-starter-{功能}` 格式
- 配置前缀是否简短有意义（如 database, redis, mq）
- 自动配置类命名是否为 `{Feature}AutoConfiguration`
- 配置属性类命名是否为 `{Feature}Properties`

### 条件装配检查
- 是否使用 `@ConditionalOnProperty` 让用户可控启用/禁用
- 是否使用 `@ConditionalOnMissingBean` 允许用户覆盖默认实现
- 条件表达式是否合理

### 生命周期检查
- 初始化是否使用 `@OnApplicationReady`，order 负数优先
- 清理是否使用 `@OnApplicationShutdown`，order 正数延后
- 是否正确处理异步操作

### 类型扩展检查
- 是否提供 `config-augment.ts` 扩展 `AppConfig` 接口
- 类型定义是否完整，让用户的 `app.config.ts` 有智能提示

### 日志输出检查
- 是否使用 emoji 前缀标识模块（如 `🗄️ [aiko-orm]`）
- 关键操作是否输出日志便于调试
- 错误日志是否清晰

### 导出规范检查
- `index.ts` 是否正确导出所有公共 API
- 是否导出 `@AutoConfiguration` 标记的类
- 是否导出类型扩展

---

## example-admin 专项审查

**触发条件**: PR 修改了 `app/examples/admin/`

### 前端规范检查
- 组件命名是否符合 PascalCase
- 是否正确使用 React Hooks
- 状态管理是否合理

### UI/UX 检查
- 是否遵循设计系统规范
- 响应式布局是否正确
- 无障碍访问是否考虑

### 性能检查
- 是否有不必要的重渲染
- 图片是否优化
- 是否正确使用 React.memo / useMemo / useCallback

### 安全检查
- XSS 防护
- 敏感数据处理

---

## example-mobile 专项审查

**触发条件**: PR 修改了 `app/examples/mobile/`

### 移动端规范检查
- 是否遵循 React Native / Flutter 最佳实践
- 组件是否跨平台兼容
- 原生模块调用是否正确

### 性能检查
- 列表是否使用虚拟滚动
- 图片是否优化
- 动画是否流畅

### 设备兼容性
- iOS / Android 差异处理
- 屏幕尺寸适配
- 权限处理

---

## 输出格式要求

### 🔴 必须修复
列出类型错误、测试失败、违反核心规范等必须修复的问题

### 🟡 建议改进
列出 ESLint 警告、代码风格问题、规范优化建议

### ✅ 优点
列出代码的优点，符合规范的地方

### 💡 建议
其他建议和修复方案，包含具体代码示例
