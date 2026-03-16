/**
 * 路由路径常量，统一维护便于引用与重定向
 */
export const ROUTES = {
  /** 登录页 */
  LOGIN: '/login',
  /** 主页（登录后） */
  HOME: '/',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
