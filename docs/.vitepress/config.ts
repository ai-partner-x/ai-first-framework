import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Aiko Boot docs site.
 *
 * Notes:
 * - Docs source lives in `/docs`.
 * - Existing markdown files are currently flat under `/docs/*.md`,
 *   so sidebar links use root routes like `/aiko-boot-plugin-guide`.
 */
export default withMermaid(
  defineConfig({
  lang: 'zh-CN',
  title: 'Aiko Boot',
  description: 'AI 可理解的全栈开发框架（Aiko Boot）文档',

  // If you later deploy under a sub-path (e.g. GitHub Pages), change `base`.
  base: '/',

  // Keep URLs stable and clean.
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
  ],

  vite: {
    resolve: {
      alias: {
        /**
         * Fix CJS/ESM named export interop issue in dev:
         * `@braintree/sanitize-url` is CJS, but mermaid stack imports `{ sanitizeUrl }`.
         * We provide a tiny ESM shim with a named export.
         */
        '@braintree/sanitize-url': path.join(__dirname, 'shims/sanitize-url.ts'),
      },
    },
  },

  themeConfig: {
    siteTitle: 'Aiko Boot',

    nav: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/guide/cli/aiko-boot-cli' },
      { text: '核心指南', link: '/core/plugin-guide' },
      { text: '开发指南', link: '/guide/api-development' },
      { text: 'Starter', link: '/starters/storage' },
      { text: '工程流程', link: '/engineering/git-workflow' },
    ],

    sidebar: [
      {
        text: '快速入口',
        items: [
          { text: 'README（仓库）', link: 'https://github.com/ai-partner-x/aiko-boot' },
          { text: 'aiko-boot（脚手架 CLI）', link: '/guide/cli/aiko-boot-cli' },
          { text: '核心能力与插件开发指南', link: '/core/plugin-guide' },
        ],
      },
      {
        text: '核心与开发指南',
        items: [
          { text: '核心能力与插件开发指南', link: '/core/plugin-guide' },
          { text: 'API 开发', link: '/guide/api-development' },
          { text: '缓存开发', link: '/guide/cache-development' },
          { text: 'Codegen 指南', link: '/guide/codegen' },
        ],
      },
      {
        text: 'Starter 文档',
        items: [
          { text: '文件存储 Starter', link: '/starters/storage' },
          { text: '消息队列 Starter', link: '/starters/mq' },
          { text: '日志 Starter', link: '/starters/log' },
          { text: '缓存 Starter', link: '/starters/cache' },
          { text: '日志组件手册（扩展）', link: '/starters/log-component-manual' },
        ],
      },
      {
        text: '认证与安全',
        items: [
          { text: '认证接口规范', link: '/reference/auth/auth-api' },
          { text: '用户/角色/菜单接口', link: '/reference/auth/user-role-menu-api' },
          { text: 'JWT 工具说明', link: '/reference/auth/jwt-util' },
          { text: '安全组件使用说明', link: '/reference/security/security-component-guide' },
        ],
      },
      {
        text: '数据库',
        items: [{ text: '初始化脚本说明', link: '/reference/database/init-db' }],
      },
      {
        text: 'Scaffold',
        items: [
          { text: 'Admin App Skill', link: '/scaffold/admin-app-skill' },
          { text: 'Core Auth Skill', link: '/scaffold/core-auth-skill' },
        ],
      },
      {
        text: '工程规范与发布',
        items: [
          { text: 'Git 工作流', link: '/engineering/git-workflow' },
          { text: 'Commit 规范与测试', link: '/engineering/commit-and-testing' },
          { text: 'GitHub Actions 工作流', link: '/engineering/github-actions-workflows' },
          { text: '发布指南', link: '/engineering/publish-guide' },
        ],
      },
      {
        text: '问题与记录',
        items: [{ text: '框架注解问题记录', link: '/troubleshooting/framework-annotation-issues' }],
      },
    ],

    search: {
      provider: 'local',
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/ai-partner-x/aiko-boot' }],
  },
  })
);

