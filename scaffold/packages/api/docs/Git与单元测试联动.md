# Git 与单元测试联动教程

本文档介绍如何配置 Git 钩子实现提交代码前自动运行单元测试。

## 目录

1. [什么是 Git 钩子？](#什么是-git-钩子)
2. [pre-commit 钩子工作原理](#pre-commit-钩子工作原理)
3. [项目配置说明](#项目配置说明)
4. [Windows 环境配置](#windows-环境配置)
5. [Linux/Mac 环境配置](#linuxmac-环境配置)
6. [验证配置是否生效](#验证配置是否生效)
7. [常见问题](#常见问题)

---

## 什么是 Git 钩子？

Git 钩子是 Git 在特定事件发生时自动运行的脚本。常见的钩子类型：

| 钩子名称 | 执行时机 | 用途 |
|----------|----------|------|
| `pre-commit` | commit 之前 | 运行测试、代码检查 |
| `commit-msg` | commit 消息编辑后 | 检查提交信息格式 |
| `pre-push` | push 之前 | 运行完整测试套件 |
| `post-commit` | commit 之后 | 发送通知等 |

### 为什么需要 pre-commit 钩子？

1. **强制质量门禁** - 防止不合格代码进入版本库
2. **自动化流程** - 无需手动运行测试
3. **团队统一标准** - 确保所有成员都运行测试

---

## pre-commit 钩子工作原理

```
你执行 git commit
       ↓
Git 准备提交代码
       ↓
触发 pre-commit 钩子
       ↓
运行 pnpm test
       ↓
测试通过？ ──是──→ 提交成功 ✅
       ↓否
测试失败？ ──是──→ 提交中止 ❌
```

### 工作流程详解

```
1. 你执行: git commit -m "修复了某个 bug"
                    ↓
2. Git 创建提交对象，但先不执行提交
                    ↓
3. Git 查找 .git/hooks/pre-commit 文件
                    ↓
4. 如果存在，执行该脚本
                    ↓
5. 脚本运行: pnpm test
                    ↓
6. 检查测试结果
   - 退出码 = 0（成功）→ 继续提交
   - 退出码 ≠ 0（失败）→ 取消提交
```

---

## 项目配置说明

### 脚本位置

项目中的 pre-commit 脚本位于：

```
scaffold/packages/api/pre-commit
```

### 脚本内容

```bash
#!/bin/sh
# ============================================================
# pre-commit hook
# 用途：在 git commit 提交代码前自动运行单元测试
# ============================================================

echo "🔍 Running unit tests before commit..."

# 切换到 api 包所在的目录
cd "$(dirname "$0")/../packages/api"

# 运行单元测试
pnpm test

# 检查测试是否通过
if [ $? -ne 0 ]; then
  echo "❌ Unit tests failed! Commit aborted."
  exit 1
fi

echo "✅ All tests passed!"
```

### 配置依赖

| 依赖项 | 说明 |
|--------|------|
| 脚本路径 | `scaffold/packages/api/pre-commit` |
| 测试命令 | `pnpm test`（使用 vitest.config.ts 配置） |
| 测试目录 | `test1/**/*.test.ts` |

---

## Windows 环境配置

### 方案1：复制脚本（推荐）

```powershell
# 1. 创建 hooks 目录（如果不存在）
mkdir -p .git/hooks

# 2. 复制 pre-commit 脚本
copy scaffold\packages\api\pre-commit .git\hooks\pre-commit

# 3. 赋予执行权限
cmd /c "attrib +x .git\hooks\pre-commit"
```

### 方案2：创建符号链接

```powershell
# 创建符号链接（需要管理员权限）
cmd /c "mklink .git\hooks\pre-commit scaffold\packages\api\pre-commit"
```

### 验证权限

```powershell
# 检查权限是否设置成功
dir .git\hooks\pre-commit
```

输出应包含 `A`（可执行）属性：

```
 Attributes   Name
------------  ----
 A    SHR    pre-commit
```

---

## Linux/Mac 环境配置

### 步骤1：复制脚本

```bash
# 复制 pre-commit 脚本到 hooks 目录
cp scaffold/packages/api/pre-commit .git/hooks/pre-commit
```

### 步骤2：赋予执行权限

```bash
# 赋予执行权限
chmod +x .git/hooks/pre-commit
```

### 步骤3：验证

```bash
# 查看文件权限
ls -la .git/hooks/pre-commit

# 输出类似：
# -rwxr-xr-x 1 username staff  1234 Jan 1 12:00 .git/hooks/pre-commit
```

注意 `pre-commit` 前面有 `x` 标记，表示可执行。

---

## 验证配置是否生效

### 方法1：尝试提交代码

```bash
# 修改一个文件
echo "# test" >> README.md

# 添加到暂存区
git add README.md

# 尝试提交
git commit -m "test: 验证 pre-commit 钩子"

# 如果配置成功，你会看到：
# 🔍 Running unit tests before commit...
# ✓ 运行测试...
# ✅ All tests passed!
# [main xxx] test: 验证 pre-commit 钩子
```

### 方法2：查看钩子列表

```bash
# 列出所有已配置的钩子
ls -la .git/hooks/

# 应该能看到 pre-commit 文件
```

### 方法3：跳过钩子（紧急情况）

如果需要跳过钩子（比如测试超时），可以使用：

```bash
# 跳过 pre-commit 钩子
git commit --no-verify -m "紧急修复，跳过测试"

# ⚠️ 警告：仅在紧急情况下使用！
```

---

## 常见问题

### 1. Windows 上脚本不执行

**症状**：提交时没有运行测试

**原因**：Windows 默认不识别 `.sh` 脚本

**解决**：
```powershell
# 确认文件有执行权限
cmd /c "attrib +x .git\hooks\pre-commit"

# 或使用 PowerShell 方式配置
```

### 2. 脚本路径错误

**症状**：`cd: .../packages/api: No such file or directory`

**原因**：脚本中的相对路径不正确

**解决**：检查脚本中的路径是否正确，或手动指定绝对路径：

```bash
# 修改脚本中的 cd 命令
cd "C:/D/project/ai-frist-framework/scaffold/packages/api"
```

### 3. 测试超时

**症状**：提交等待时间过长

**解决**：可以修改测试命令使用更快的方式：

```bash
# 只运行有变化的测试（需要 vitest watch 模式）
# 或增加超时限制

# 在 vitest.config.ts 中添加：
export default defineConfig({
  test: {
    testTimeout: 30000,  // 30 秒超时
  },
});
```

### 4. 不想每次都运行测试

**方法1**：临时跳过
```bash
git commit --no-verify -m "快速提交"
```

**方法2**：只对特定分支启用
```bash
# 在脚本开头添加分支判断
current_branch=$(git symbolic-ref --short HEAD)
if [ "$current_branch" = "main" ]; then
  # 只在 main 分支运行测试
  pnpm test
fi
```

### 5. 多个 npm 命令冲突

**症状**：找不到 `pnpm` 命令

**解决**：使用完整路径：

```bash
# 修改脚本中的命令
./node_modules/.bin/vitest run

# 或使用 npx
npx vitest run
```

---

## 扩展：添加更多检查

可以在 pre-commit 中添加更多检查：

```bash
#!/bin/sh
echo "🔍 Running pre-commit checks..."

cd "$(dirname "$0")/../packages/api"

# 1. 运行单元测试
echo "Running unit tests..."
pnpm test
if [ $? -ne 0 ]; then
  echo "❌ Unit tests failed!"
  exit 1
fi

# 2. 运行代码检查（可选）
echo "Running lint..."
pnpm lint
if [ $? -ne 0 ]; then
  echo "❌ Lint failed!"
  exit 1
fi

# 3. 运行类型检查（可选）
echo "Running type check..."
pnpm typecheck
if [ $? -ne 0 ]; then
  echo "❌ Type check failed!"
  exit 1
fi

echo "✅ All checks passed!"
```

---

## 相关文档

- [单元测试指南](./单元测试指南.md)
- [Vitest 官方文档](https://vitest.dev/)
- [Git Hooks 文档](https://git-scm.com/book/zh/v2/自定义-Git-Git-钩子)
