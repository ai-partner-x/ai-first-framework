# Aiko Boot 发布流程

## 安装使用

在项目根目录创建或编辑 `.npmrc` 文件：

```
@ai-partner-x:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_READ_TOKEN
```

然后安装所需的包：

```bash
# 安装核心包
pnpm add @ai-partner-x/aiko-boot

# 按需安装 starter
pnpm add @ai-partner-x/aiko-boot-starter-web
pnpm add @ai-partner-x/aiko-boot-starter-orm
pnpm add @ai-partner-x/aiko-boot-starter-security
pnpm add @ai-partner-x/aiko-boot-starter-cache
pnpm add @ai-partner-x/aiko-boot-starter-log
pnpm add @ai-partner-x/aiko-boot-starter-mq
pnpm add @ai-partner-x/aiko-boot-starter-storage
pnpm add @ai-partner-x/aiko-boot-starter-validation
```

---

## 方式一：手动发布

```bash
# 1. 在 develop 分支验证构建
git checkout develop
pnpm install
pnpm --filter "./packages/**" -r build

# 2. 合并到 main
git checkout main
git merge develop --no-edit
git push origin main

# 3. 发布
pnpm -r publish --no-git-checks --access public
```

---

## 方式二：自动发布（GitHub Actions）

### 手动触发

1. Actions → **Publish Packages** → **Run workflow**
2. 选择分支 `main`，`dry_run` 选 `false`
3. 点击 **Run workflow**

### 创建 Release 自动触发

1. Releases → **Draft a new release**
2. 创建新 tag（如 `v0.1.0`）
3. 点击 **Publish release**

---

## 升级版本号

```bash
# 批量升级所有包（patch / minor / major）
pnpm -r exec npm version patch
```
