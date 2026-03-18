# Docs 结构与命名规范（Aiko Boot）

本文档用于约束 `/docs` 的目录结构与命名方式，避免文档长期“平铺 + 难检索”。

## 目录结构（约定）

> 原则：**按模块分组**（core / guide / starters / reference / scaffold / engineering / troubleshooting），并让路径能稳定映射到 VitePress 路由。

```
docs/
  index.md                     # 文档站首页（入口页）
  README.md                    # 本文件：文档结构约定

  core/                        # 框架核心概念（面向所有使用者）
  guide/                       # 开发指南/规范（how-to）
  starters/                    # 各 Starter 使用说明（按包名分）
  reference/                   # API/接口/工具类/协议等参考文档（what/contract）
  scaffold/                    # scaffold 相关（monorepo 子工程技能/约定）
  engineering/                 # 工程流程（Git/CI/CD/发布）
  troubleshooting/             # 问题记录/FAQ/排障
```

## 命名规范（强制）

- **文件名**：一律 `kebab-case.md`（例如：`api-development.md`、`jwt-util.md`）
- **目录名**：一律 `kebab-case/`
- **避免**：
  - 文件名中出现空格（例如 `aiko-boot-starter-cache .md` 需要修复）
  - 文件名使用中文（可在标题中使用中文，但文件名建议英文统一）
- **路由稳定**：迁移文件后，VitePress 侧边栏与首页入口必须同步更新，避免 404。

## 分类建议（经验）

- **guide/**：面向“怎么做”，如 API 开发规范、缓存开发指南
- **starters/**：面向“怎么用某个 starter”，如 storage/mq/log/cache
- **reference/**：面向“契约/接口/工具”，如 auth API、用户角色菜单 API、JWT 工具
- **engineering/**：面向“团队流程”，如 git workflow、actions、发布指南
- **troubleshooting/**：面向“问题沉淀”，如注解问题记录

