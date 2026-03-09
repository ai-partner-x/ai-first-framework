/**
 * Security Auto-Configuration
 * 
 * 自动配置安全功能
 */
import { autoConfigure } from '@ai-partner-x/aiko-boot/boot';
import { setSecurityConfig, DEFAULT_SECURITY_CONFIG } from './config.js';

/**
 * 安全自动配置
 */
export const SecurityAutoConfiguration = autoConfigure({
  name: 'security',
  priority: 100,
  configure: (appConfig) => {
    // 从应用配置中获取安全配置
    const securityConfig = appConfig.security || DEFAULT_SECURITY_CONFIG;
    
    // 设置全局安全配置
    setSecurityConfig(securityConfig);
    
    console.log('[aiko-security] Security configured:', {
      hasJwt: !!securityConfig.jwt,
      hasOAuth2: !!securityConfig.oauth2,
      hasCors: !!securityConfig.cors
    });
  }
});