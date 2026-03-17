# VitePress 文档生成工具

## 简介

VitePress 是一个基于 Vite 的静态网站生成器，专门用于构建文档网站。它是 VuePress 的下一代版本，提供了更快速的开发体验和更好的性能。

## VitePress 特性

- 🚀 **基于 Vite** - 极速的开发服务器启动和热更新
- 📝 **Markdown 增强** - 支持 Vue 组件、数学公式、代码高亮等
- 🎨 **主题定制** - 灵活的主题系统，支持自定义主题
- 🔍 **搜索功能** - 内置全文搜索支持
- 🌐 **SSR 支持** - 服务器端渲染，更好的 SEO
- 📦 **开箱即用** - 零配置即可使用

## 在 Aiko Boot 项目中使用 VitePress

### 1. 安装 VitePress

```bash
# 在项目根目录安装
pnpm add -D vitepress
```

### 2. 创建文档目录结构

```
scaffold/
├── docs/
│   ├── .vitepress/
│   │   └── config.ts       # VitePress 配置文件
│   ├── index.md             # 首页
│   ├── guide/               # 指南文档
│   │   ├── getting-started.md
│   │   └── ...
│   └── api/                 # API 文档
│       └── ...
```

### 3. 配置 VitePress

创建 `scaffold/docs/.vitepress/config.ts`：

```typescript
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Aiko Boot',
  description: 'AI 可理解的全栈开发框架',
  
  // 主题配置
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
    ],
    
    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '核心概念', link: '/guide/core-concepts' },
          ]
        }
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: 'aiko-boot', link: '/api/aiko-boot' },
            { text: 'aiko-boot-starter-web', link: '/api/aiko-boot-starter-web' },
          ]
        }
      ]
    },
    
    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-repo' }
    ],
    
    // 搜索配置
    search: {
      provider: 'local'
    }
  }
})
```

### 4. 创建首页

创建 `scaffold/docs/index.md`：

```markdown
---
layout: home

hero:
  name: Aiko Boot
  text: AI 可理解的全栈开发框架
  tagline: 基于 TypeScript，采用 Spring Boot 风格架构
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/your-repo

features:
  - title: AI Native
    details: 使用 AI 最熟悉的语言 (TypeScript)
  - title: Spring Boot Style
    details: 熟悉的 Spring Boot 架构风格
  - title: MyBatis-Plus API
    details: 强大的条件构造器和通用 Mapper
  - title: Type Safe
    details: TypeScript + 装饰器保证代码质量
  - title: Java Compatible
    details: TypeScript 代码可转译为 Java Spring Boot + MyBatis-Plus
  - title: VitePress 文档
    details: 极速的文档生成和预览体验
---
```

### 5. 添加 npm scripts

在 `scaffold/package.json` 中添加：

```json
{
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs"
  }
}
```

## 使用命令

### 启动开发服务器

```bash
cd scaffold
pnpm docs:dev
```

### 构建静态文档

```bash
cd scaffold
pnpm docs:build
```

### 预览构建结果

```bash
cd scaffold
pnpm docs:preview
```

## Markdown 增强功能

### Vue 组件

在 Markdown 中直接使用 Vue 组件：

```markdown
<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>

# Vue 组件示例

<button @click="count++">点击次数: {{ count }}</button>
```

### 代码块

支持语法高亮和行号：

```typescript
import { Service, Autowired } from '@ai-partner-x/aiko-boot'

@Service()
export class UserService {
  @Autowired()
  private userMapper!: UserMapper
}
```

### 自定义容器

```markdown
::: tip 提示
这是一个提示信息
:::

::: warning 警告
这是一个警告信息
:::

::: danger 危险
这是一个危险信息
:::
```

## 部署

### 部署到 GitHub Pages

1. 在 `.vitepress/config.ts` 中设置 `base`：

```typescript
export default defineConfig({
  base: '/your-repo-name/',
  // ...
})
```

2. 创建 GitHub Actions 工作流 `.github/workflows/deploy-docs.yml`：

```yaml
name: Deploy Docs
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm -F scaffold docs:build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./scaffold/docs/.vitepress/dist
```

## 参考资源

- [VitePress 官方文档](https://vitepress.dev/)
- [VitePress GitHub](https://github.com/vuejs/vitepress)
- [VitePress 主题配置](https://vitepress.dev/reference/default-theme-config)
