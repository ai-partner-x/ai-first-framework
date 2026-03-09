/**
 * Message Queue 全局配置
 * 
 * 在 createApp 时设置消息队列配置
 */

// ==================== Types ====================

/** 消息队列配置 */
export interface MqConfig {
  /** 消息队列类型 */
  type: 'kafka' | 'rabbitmq' | 'rocketmq';
  /** 主机地址 */
  host: string;
  /** 端口 */
  port: number;
  /** 用户名 */
  username?: string;
  /** 密码 */
  password?: string;
  /** 虚拟主机（RabbitMQ） */
  virtualHost?: string;
  /** 集群地址（Kafka） */
  bootstrapServers?: string[];
}

// ==================== Global Config ====================

/** 全局消息队列配置 */
let globalMqConfig: MqConfig | null = null;

/**
 * 设置全局消息队列配置
 */
export function setMqConfig(config: MqConfig): void {
  globalMqConfig = config;
}

/**
 * 获取全局消息队列配置
 */
export function getMqConfig(): MqConfig | null {
  return globalMqConfig;
}

/**
 * 检查消息队列配置是否已设置
 */
export function isMqConfigured(): boolean {
  return globalMqConfig !== null;
}

// ==================== Default Config ====================

/**
 * 默认消息队列配置
 */
export const DEFAULT_MQ_CONFIG: MqConfig = {
  type: 'kafka',
  host: 'localhost',
  port: 9092
};