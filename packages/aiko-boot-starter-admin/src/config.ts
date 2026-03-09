/**
 * Admin Framework 全局配置
 * 
 * 在 createApp 时设置管理门户配置
 */

// ==================== Types ====================

/** 管理门户配置 */
export interface AdminConfig {
  /** 应用名称 */
  appName: string;
  /** 应用版本 */
  appVersion: string;
  /** 登录页面配置 */
  login?: {
    /** 登录标题 */
    title?: string;
    /** 登录描述 */
    description?: string;
    /** 记住我选项 */
    rememberMe?: boolean;
  };
  /** 菜单配置 */
  menu?: {
    /** 默认展开的菜单 */
    defaultOpen?: string[];
    /** 默认选中的菜单 */
    defaultSelected?: string;
  };
  /** 主题配置 */
  theme?: {
    /** 主题颜色 */
    primaryColor?: string;
    /** 布局类型 */
    layout?: 'side' | 'top' | 'mix';
    /** 是否固定头部 */
    fixedHeader?: boolean;
    /** 是否固定侧边栏 */
    fixedSidebar?: boolean;
  };
  /** API 配置 */
  api?: {
    /** API 基础路径 */
    baseUrl?: string;
    /** 超时时间（毫秒） */
    timeout?: number;
  };
}

// ==================== Global Config ====================

/** 全局管理门户配置 */
let globalAdminConfig: AdminConfig | null = null;

/**
 * 设置全局管理门户配置
 */
export function setAdminConfig(config: AdminConfig): void {
  globalAdminConfig = config;
}

/**
 * 获取全局管理门户配置
 */
export function getAdminConfig(): AdminConfig | null {
  return globalAdminConfig;
}

/**
 * 检查管理门户配置是否已设置
 */
export function isAdminConfigured(): boolean {
  return globalAdminConfig !== null;
}

// ==================== Default Config ====================

/**
 * 默认管理门户配置
 */
export const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  appName: 'Aiko Admin',
  appVersion: '1.0.0',
  login: {
    title: 'Aiko Admin',
    description: 'Please login to continue',
    rememberMe: true
  },
  menu: {
    defaultOpen: [],
    defaultSelected: ''
  },
  theme: {
    primaryColor: '#1890ff',
    layout: 'side',
    fixedHeader: true,
    fixedSidebar: true
  },
  api: {
    baseUrl: '/api',
    timeout: 30000
  }
};