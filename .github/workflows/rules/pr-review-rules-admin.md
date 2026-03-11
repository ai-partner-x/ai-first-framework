# Admin Frontend PR Review Rules

管理后台前端 PR 审查规则

## 适用目录

- `app/examples/admin/` - 管理后台示例应用
- `app/framework/admin-app/` - 管理后台框架应用

## 前端规范检查

- 组件命名是否符合 PascalCase
- 是否正确使用 React Hooks
- 状态管理是否合理
- 文件结构是否清晰

## UI/UX 检查

- 是否遵循设计系统规范
- 响应式布局是否正确
- 无障碍访问是否考虑（aria-label、键盘导航）
- 表单验证是否完善

## 性能检查

- 是否有不必要的重渲染
- 图片是否优化（懒加载、压缩）
- 是否正确使用 React.memo / useMemo / useCallback
- 路由懒加载是否配置

## 安全检查

- XSS 防护（ dangerouslySetInnerHTML 使用检查）
- 敏感数据处理（密码、Token）
- 权限控制是否正确

## 代码质量

- TypeScript 类型是否完整
- 是否使用绝对路径导入
- 常量是否提取到单独文件
