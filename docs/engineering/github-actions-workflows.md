# GitHub Actions 工作流说明

本文档介绍项目中配置的 GitHub Actions 工作流，用于自动化 Issue 分类、AI 分析回复等功能。

## 工作流概览

| 工作流 | 触发条件 | 功能 |
|--------|----------|------|
| `auto-label.yml` | Issue 创建时 | 自动添加标签和类型 |
| `opencode-triage.yml` | Issue 创建时 | AI 分析并回复 |
| `opencode.yml` | Issue/PR 评论 | AI 命令响应 |
| `pr-review.yml` | PR 创建/更新时 | 静态检查 + 测试 + AI 审查 |

---

## 1. auto-label.yml - 自动标签分类

### 功能说明

当新 Issue 创建时，自动根据标题和内容添加标签和 Issue Type。

### 触发条件

```yaml
on:
  issues:
    types: [opened]
```

### 分类规则

#### 类型标签

| 标签 | 触发关键词 |
|------|-----------|
| `bug` | bug, 错误, 失败, crash |
| `feature` | feature, 功能, 添加, 支持 |
| `question` | question, 问题, 询问, 怎么 |
| `documentation` | doc, 文档, 说明 |

#### 模块标签

| 标签 | 触发条件 |
|------|----------|
| `module: web` | 标题包含 web 或正文包含 aiko-boot-starter-web |
| `module: orm` | 标题包含 orm 或正文包含 aiko-boot-starter-orm |
| `module: core` | 标题包含 core 或正文包含 aiko-boot |

#### 功能标签

| 标签 | 触发关键词 |
|------|-----------|
| `database` | 数据库, mysql, postgresql |
| `logging` | 日志, log |
| `configuration` | 配置, config |
| `needs-review` | 无匹配时默认添加 |

#### Issue Type 设置

| 类型 | 对应标签 |
|------|----------|
| Bug | bug |
| Feature | feature |
| Task | question |

### 示例

创建标题为 `Feature: 添加用户认证功能` 的 Issue，会自动添加：
- Labels: `feature`, `module: web`
- Type: `Feature`

---

## 2. opencode-triage.yml - Issue 自动分析

### 功能说明

当新 Issue 创建时，使用 AI（OpenCode + 通义千问）自动分析 Issue 内容并发布评论回复。

### 触发条件

```yaml
on:
  issues:
    types: [opened]
  workflow_dispatch:
    inputs:
      issue_number:
        description: 'Issue number to triage'
        required: true
        type: number
```

- **自动触发**: Issue 创建时
- **手动触发**: GitHub Actions 页面手动运行，需提供 Issue 编号

### 安全机制

工作流会检查 Issue 创建者的账户年龄，仅处理注册满 30 天以上的用户提交的 Issue，以减少垃圾信息。

### AI 模型配置

- **提供商**: 阿里云百炼
- **模型**: qwen3.5-plus
- **配置文件**: 项目根目录 `opencode.json`

### 分析内容

AI 会自动分析以下内容：

1. **Issue 类型判断** - bug/feature/question/documentation
2. **问题分析** - 分析问题原因和影响范围
3. **相关代码定位** - 查找相关代码位置
4. **解决方案建议** - 提供修复建议或实现方案
5. **标签建议** - 推荐适当的标签

### 使用示例

创建 Issue 后，AI 会自动发布分析评论：

```
## Issue 分析结果

### 📋 Issue 类型
Bug - 数据库连接失败问题

### 🔍 问题分析
...

### 📖 相关代码位置
- packages/aiko-boot-starter-orm/src/database.ts:47-94
- packages/aiko-boot-starter-orm/src/auto-configuration.ts:61-134

### ✅ 建议排查步骤
...

### 🏷️ 建议标签
bug, database, orm, needs-info
```

---

## 3. opencode.yml - 评论命令响应

### 功能说明

在 Issue 或 PR 的评论中使用 `/oc` 或 `/opencode` 命令，触发 AI 进行响应。

### 触发条件

```yaml
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
```

### 命令格式

在 Issue 或 PR 评论中输入：

```
/oc 你的问题或指令
```

或

```
/opencode 你的问题或指令
```

### 常用命令示例

| 命令 | 说明 |
|------|------|
| `/oc explain this issue` | 解释这个 Issue |
| `/oc fix this` | 修复这个问题（会创建 PR） |
| `/oc review this code` | 审查代码 |
| `/oc add error handling here` | 在此处添加错误处理 |

### 使用场景

1. **Issue 中提问**
   ```
   /oc 请分析这个问题的根本原因
   ```

2. **请求修复**
   ```
   /opencode fix this bug
   ```

3. **PR 代码审查**
   ```
   /oc 检查这段代码是否有安全问题
   ```

4. **特定代码行评论**
   - 在 PR 的 Files 选项卡中对特定代码行评论
   - AI 会自动获取文件路径、行号和 diff 上下文

---

## 4. pr-review.yml - PR 自动审查

### 功能说明

当 PR 创建或更新时，自动执行代码质量检查并使用 AI 进行审查。

### 触发条件

```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]
```

| 事件 | 说明 |
|------|------|
| `opened` | PR 创建时 |
| `synchronize` | PR 有新提交时 |
| `reopened` | PR 重新打开时 |
| `ready_for_review` | PR 标记为可审查时 |

### 检查流程

```
PR 创建/更新
    │
    ├── 1. TypeScript 类型检查
    │       └── pnpm type-check
    │
    ├── 2. ESLint 代码检查
    │       └── pnpm lint
    │
    ├── 3. 单元测试执行
    │       └── pnpm test
    │
    └── 4. AI 综合分析
            ├── 分析检查结果
            ├── 审查代码质量
            ├── 识别潜在问题
            └── 提供修复建议
```

### AI 审查内容

1. **检查结果分析** - 分析类型检查、ESLint、测试的结果
2. **代码质量** - 可读性、规范、重复代码
3. **潜在问题** - Bug、安全风险、性能问题
4. **最佳实践** - TypeScript 规范、框架使用
5. **测试覆盖** - 单元测试、边界情况

### 服务端组件专项审查

当 PR 涉及以下目录时，会按 Aiko Boot 插件开发规范进行专项审查：

| 目录 | 说明 |
|------|------|
| `packages/aiko-boot/` | 核心框架 |
| `packages/aiko-boot-starter-*/` | Starter 插件 |
| `packages/aiko-boot-codegen/` | 代码生成器 |

#### 审查项目

| 检查项 | 说明 |
|--------|------|
| **命名规范** | 包名、配置前缀、类命名是否符合约定 |
| **条件装配** | `@ConditionalOnProperty`、`@ConditionalOnMissingBean` 使用 |
| **生命周期** | `@OnApplicationReady`、`@OnApplicationShutdown` 使用 |
| **类型扩展** | `config-augment.ts` 扩展 `AppConfig` 接口 |
| **日志输出** | emoji 前缀标识模块 |
| **导出规范** | `index.ts` 正确导出公共 API |

### 输出格式

AI 会按以下格式发布审查评论：

```
### 🔴 必须修复
列出类型错误、测试失败等必须修复的问题

### 🟡 建议改进  
列出 ESLint 警告、代码风格问题

### ✅ 优点
列出代码的优点

### 💡 建议
其他建议和修复方案
```

### 示例

创建 PR 后，AI 会自动发布审查评论：

```
## PR 审查结果

### 🔴 必须修复
1. src/user.ts:45 - 类型错误: 'user' 可能为 null
2. 测试失败: UserService.test.ts - 期望值不匹配

### 🟡 建议改进
1. src/auth.ts:12 - 未使用的变量 'temp'
2. src/utils.ts:88 - 缺少返回类型声明

### ✅ 优点
- 代码结构清晰，模块划分合理
- 使用了 TypeScript 类型保护

### 💡 建议
- 建议添加更多单元测试覆盖边界情况
- 可以使用可选链操作符简化代码
```

---

## 配置要求

### Secrets 配置

在 GitHub 仓库的 Settings → Secrets and variables → Actions 中配置：

| Secret 名称 | 说明 |
|-------------|------|
| `BAILIAN_API_KEY` | 阿里云百炼 API Key |

### 权限要求

工作流需要以下权限：

```yaml
permissions:
  id-token: write
  contents: write
  pull-requests: write
  issues: write
```

### 自定义模型配置

项目根目录的 `opencode.json` 文件配置了百炼 API：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "bailian": {
      "env": ["BAILIAN_API_KEY"],
      "options": {
        "baseURL": "https://dashscope.aliyuncs.com/compatible-mode/v1"
      },
      "models": {
        "qwen3.5-plus": {
          "name": "Qwen 3.5 Plus",
          "context": 131072,
          "max_output": 8192
        }
      }
    }
  }
}
```

---

## 标签列表

项目预定义的标签：

### 类型标签

| 标签 | 颜色 | 说明 |
|------|------|------|
| `bug` | 红色 | Bug 报告 |
| `feature` | 蓝色 | 功能请求 |
| `question` | 紫色 | 问题咨询 |
| `documentation` | 深蓝 | 文档相关 |

### 模块标签

| 标签 | 颜色 | 说明 |
|------|------|------|
| `module: web` | 蓝色 | Web 模块相关 |
| `module: orm` | 蓝色 | ORM 模块相关 |
| `module: core` | 蓝色 | 核心框架相关 |

### 功能标签

| 标签 | 颜色 | 说明 |
|------|------|------|
| `database` | 紫色 | 数据库相关 |
| `logging` | 粉色 | 日志相关 |
| `configuration` | 绿色 | 配置相关 |
| `needs-review` | 黄色 | 需要审查 |

---

## 工作流执行流程

```
创建 Issue
    ├── auto-label.yml
    │       ├── 添加标签
    │       └── 设置 Issue Type
    │
    └── opencode-triage.yml
            ├── 账户年龄检查
            │       ├── 通过 → AI 分析 → 发布分析评论
            │       └── 不通过 → 跳过

Issue/PR 评论
    ├── 包含 /oc 或 /opencode → opencode.yml → AI 响应 → 发布回复评论
    └── 不包含命令 → 不触发

创建/更新 PR
    └── pr-review.yml
            ├── TypeScript 类型检查
            ├── ESLint 代码检查
            ├── 单元测试执行
            └── AI 综合分析 → 发布审查评论
```

---

## 常见问题

### Q: Issue 创建后没有自动添加标签？

检查以下几点：
1. 确认 `auto-label.yml` 工作流已在 main 分支
2. 检查 Actions 页面是否有错误日志
3. 确认标签已在仓库中创建

### Q: AI 分析响应很慢？

OpenCode 分析可能需要 1-5 分钟，取决于：
- Issue 内容复杂度
- 代码库大小
- 模型响应速度

如果等待时间过长，可以使用评论命令 `/oc` 快速触发响应。

### Q: 如何更换 AI 模型？

修改 `opencode.json` 和工作流文件中的 `model` 参数。支持格式：`provider/model-name`。

### Q: 如何添加新的自动分类规则？

编辑 `auto-label.yml` 中的分类逻辑，添加新的关键词匹配规则。
