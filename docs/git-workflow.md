# Git 分支策略与开发流程

本文档介绍项目的 Git 分支策略、开发流程和提交规范。

---

## 分支策略概览

```
main (生产环境)
  ↑
  │  ← hotfix/xxx 紧急修复分支
  │
develop (开发主干)
  ↑
  ├── feature/mq-starter ──┤
  ├── feature/cache ───────┤
  ├── fix/connection ──────┤
  └── docs/api-guide ──────┘
```

---

## 分支说明

### 核心分支（长期存在）

| 分支 | 用途 | 保护级别 | 说明 |
|------|------|----------|------|
| `main` | 生产环境 | 🔒 严格保护 | 仅接受 develop 和 hotfix 合并 |
| `develop` | 开发主干 | 🔒 保护 | 所有功能合并的目标分支 |

### 临时分支（用完即删）

| 分支前缀 | 用途 | 来源分支 | 目标分支 | 示例 |
|---------|------|---------|---------|------|
| `feature/` | 新功能开发 | develop | develop | `feature/mq-starter` |
| `fix/` | Bug 修复 | develop | develop | `fix/connection-timeout` |
| `hotfix/` | 紧急生产修复 | main | main + develop | `hotfix/security-patch` |
| `docs/` | 文档更新 | develop | develop | `docs/api-guide` |
| `refactor/` | 代码重构 | develop | develop | `refactor/simplify-parser` |

---

## 开发流程

### 场景 1：开发新功能

```bash
# 1. 更新 develop 分支
git checkout develop
git pull origin develop

# 2. 创建功能分支
git checkout -b feature/mq-starter

# 3. 开发代码
# ... 编写代码 ...

# 4. 提交代码
git add .
git commit -m "feat: add MQ starter with RabbitMQ adapter"

# 5. 推送到远程
git push origin feature/mq-starter

# 6. 创建 PR（目标：develop）
gh pr create --base develop --title "feat: MQ Starter" \
  --body "## 功能描述\n实现消息队列 starter...\n\n## 测试\n- [ ] 单元测试\n- [ ] 集成测试"

# 7. 等待审查合并后，删除本地分支
git checkout develop
git pull origin develop
git branch -d feature/mq-starter
```

### 场景 2：修复 Bug

```bash
# 1. 更新 develop
git checkout develop
git pull origin develop

# 2. 创建修复分支
git checkout -b fix/connection-timeout

# 3. 修复代码
# ... 修复 ...

# 4. 提交（使用 fix: 前缀）
git add .
git commit -m "fix: resolve connection timeout issue"

# 5. 推送并创建 PR
git push origin fix/connection-timeout
gh pr create --base develop --title "fix: connection timeout"
```

### 场景 3：紧急热修复（生产问题）

```bash
# 1. 从 main 创建热修复分支
git checkout main
git pull origin main
git checkout -b hotfix/security-patch

# 2. 紧急修复
# ... 修复 ...

# 3. 提交
git add .
git commit -m "hotfix: patch security vulnerability"

# 4. 推送并创建 PR 到 main
git push origin hotfix/security-patch
gh pr create --base main --title "hotfix: security patch"

# 5. PR 合并后，同步到 develop
git checkout develop
git pull origin develop
git merge main
git push origin develop

# 6. 删除热修复分支
git branch -d hotfix/security-patch
```

### 场景 4：发布版本

```bash
# 1. 确保 develop 是最新的
git checkout develop
git pull origin develop

# 2. 切换到 main
git checkout main
git pull origin main

# 3. 合并 develop 到 main
git merge develop --no-ff -m "release: merge develop for v1.0.0"

# 4. 打标签
git tag -a v1.0.0 -m "Release version 1.0.0"

# 5. 推送
git push origin main
git push origin v1.0.0
```

---

## 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

| 类型 | 用途 | 示例 |
|------|------|------|
| `feat:` | 新功能 | `feat: add cache manager` |
| `fix:` | Bug 修复 | `fix: resolve memory leak` |
| `docs:` | 文档更新 | `docs: update API guide` |
| `refactor:` | 代码重构 | `refactor: simplify parser` |
| `test:` | 测试相关 | `test: add unit tests` |
| `chore:` | 构建/工具 | `chore: update dependencies` |
| `hotfix:` | 紧急修复 | `hotfix: patch security issue` |

### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

示例：
```
feat(mq): add RabbitMQ adapter support

- Implement RabbitMqAdapter with connection pooling
- Add retry mechanism with exponential backoff
- Support TLS connections

Closes #123
```

---

## PR 规范

### PR 标题格式

```
<type>: <简短描述>
```

示例：
- `feat: add MQ starter with RabbitMQ support`
- `fix: resolve connection timeout in Redis adapter`
- `docs: update API development guide`

### PR 描述模板

```markdown
## 功能描述
<!-- 描述这个 PR 做了什么 -->

## 变更内容
<!-- 列出主要的代码变更 -->
- 
- 
- 

## 测试
<!-- 如何测试这些变更 -->
- [ ] 单元测试
- [ ] 集成测试
- [ ] 手动测试

## 检查清单
- [ ] 代码遵循项目规范
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
- [ ] 本地测试通过

## AI 辅助标注（如适用）
- [ ] AI-assisted
- [ ] 测试程度：未测试 / 轻测 / 完整测试
- [ ] 理解确认：我已理解代码功能并验证通过
```

---

## 关键原则

| 原则 | 说明 |
|------|------|
| **develop 是默认分支** | 日常开发都基于 develop |
| **一个 PR 一个功能** | 不要把多个功能混在一起 |
| **及时同步 develop** | 开发前先 `git pull origin develop` |
| **删除已合并分支** | 保持仓库整洁 |
| **PR 必须经过审查** | 使用 `/oc review` 或人工审查 |
| **保护分支不能直接推送** | 必须通过 PR 合并 |

---

## 常见问题

### Q: 开发到一半，develop 有更新了怎么办？

```bash
# 在功能分支上执行
git fetch origin
git rebase origin/develop
# 或
git merge origin/develop
```

### Q: 不小心在 develop 上直接修改了代码？

```bash
# 保存修改到临时分支
git checkout -b temp/my-changes

# 恢复 develop
git checkout develop
git reset --hard origin/develop

# 然后正常创建功能分支
git checkout -b feature/my-feature
```

### Q: PR 有冲突怎么解决？

```bash
# 在本地功能分支上
git fetch origin
git rebase origin/develop
# 解决冲突后
git push origin feature/xxx --force-with-lease
```

---

## 相关文档

- [GitHub Actions 工作流说明](./github-actions-workflows.md)
- [API 开发指南](./api-development.md)
- [Aiko Boot 插件开发指南](./aiko-boot-plugin-guide.md)
