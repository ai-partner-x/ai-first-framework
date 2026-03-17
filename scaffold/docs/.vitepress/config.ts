import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Aiko Boot Scaffold',
  description: 'Aiko Boot 项目脚手架文档',

  lang: 'zh-CN',

  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: '技术文档', link: '/spec/auth-api' },
      { text: 'GitHub', link: 'https://github.com/your-repo' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '项目结构', link: '/guide/project-structure' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '认证 API', link: '/api/auth' },
            { text: '用户 API', link: '/api/user' },
            { text: '角色 API', link: '/api/role' },
            { text: '菜单 API', link: '/api/menu' },
          ],
        },
      ],
      '/spec/': [
        {
          text: '技术文档',
          items: [
            { text: '认证接口规范', link: '/spec/auth-api' },
            { text: '用户/角色/菜单 CRUD 接口规范', link: '/spec/user-role-menu-api' },
            { text: 'JWT 工具类使用说明', link: '/spec/jwt-util' },
            { text: '数据库初始化脚本说明', link: '/spec/init-db' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-repo' },
    ],

    search: {
      provider: 'local',
    },

    footer: {
      message: '基于 MIT 许可发布',
      copyright: 'Copyright © 2024 Aiko Boot Team',
    },
  },
});
