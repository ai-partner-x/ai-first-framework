/**
 * Message Queue Auto-Configuration
 * 
 * 自动配置消息队列连接和绑定
 */
import { autoConfigure } from '@ai-partner-x/aiko-boot/boot';
import { setMqConfig, DEFAULT_MQ_CONFIG } from './config.js';

/**
 * 消息队列自动配置
 */
export const MqAutoConfiguration = autoConfigure({
  name: 'mq',
  priority: 100,
  configure: (appConfig) => {
    // 从应用配置中获取消息队列配置
    const mqConfig = appConfig.mq || DEFAULT_MQ_CONFIG;
    
    // 设置全局消息队列配置
    setMqConfig(mqConfig);
    
    console.log('[aiko-mq] Message queue configured:', {
      type: mqConfig.type,
      host: mqConfig.host,
      port: mqConfig.port
    });
  }
});