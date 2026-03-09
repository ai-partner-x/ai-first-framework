/**
 * Redis Auto-Configuration
 * 
 * 自动配置 Redis 连接和仓库
 */
import { autoConfigure } from '@ai-partner-x/aiko-boot/boot';
import { setRedisConfig, DEFAULT_REDIS_CONFIG } from './config.js';

/**
 * Redis 自动配置
 */
export const RedisAutoConfiguration = autoConfigure({
  name: 'redis',
  priority: 100,
  configure: (appConfig) => {
    // 从应用配置中获取 Redis 配置
    const redisConfig = appConfig.redis || DEFAULT_REDIS_CONFIG;
    
    // 设置全局 Redis 配置
    setRedisConfig(redisConfig);
    
    console.log('[aiko-redis] Redis configured:', {
      host: redisConfig.host,
      port: redisConfig.port,
      db: redisConfig.db
    });
  }
});