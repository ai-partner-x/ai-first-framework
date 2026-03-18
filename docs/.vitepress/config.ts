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
      { text: '核心指南', link: '/aiko-boot-plugin-guide' },
      { text: 'Starter', link: '/aiko-boot-starter-storage' },
      { text: '工程流程', link: '/git-workflow' },
    ],

    sidebar: [
      {
        text: '快速入口',
        items: [
          { text: 'README（仓库）', link: 'https://github.com/ai-partner-x/aiko-boot' },
          { text: '核心能力与插件开发指南', link: '/aiko-boot-plugin-guide' },
        ],
      },
      {
        text: '开发指南',
        items: [
          { text: 'API 开发', link: '/api-development' },
          { text: '缓存开发', link: '/cache-development' },
        ],
      },
      {
        text: 'Starter 文档',
        items: [
          { text: '文件存储 Starter', link: '/aiko-boot-starter-storage' },
          { text: '消息队列 Starter', link: '/aiko-boot-starter-mq' },
          { text: '日志 Starter', link: '/aiko-boot-starter-log' },
        ],
      },
      {
        text: '工程规范与发布',
        items: [
          { text: 'Git 工作流', link: '/git-workflow' },
          { text: 'Commit 规范与测试', link: '/test-commit' },
          { text: 'GitHub Actions 工作流', link: '/github-actions-workflows' },
          { text: '发布指南', link: '/publish-guide' },
        ],
      },
      {
        text: '问题与记录',
        items: [{ text: '框架注解问题记录', link: '/framework-annotation-issues' }],
      },
    ],

    search: {
      provider: 'local',
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/ai-partner-x/aiko-boot' }],
  },
  })
);

