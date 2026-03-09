/**
 * Admin Auto-Configuration
 * 
 * 自动配置管理门户功能
 */
import { autoConfigure } from '@ai-partner-x/aiko-boot/boot';
import { setAdminConfig, DEFAULT_ADMIN_CONFIG } from './config.js';

/**
 * 管理门户自动配置
 */
export const AdminAutoConfiguration = autoConfigure({
  name: 'admin',
  priority: 100,
  configure: (appConfig) => {
    // 从应用配置中获取管理门户配置
    const adminConfig = appConfig.admin || DEFAULT_ADMIN_CONFIG;
    
    // 设置全局管理门户配置
    setAdminConfig(adminConfig);
    
    console.log('[aiko-admin] Admin portal configured:', {
      appName: adminConfig.appName,
      appVersion: adminConfig.appVersion,
      layout: adminConfig.theme?.layout
    });
  }
});