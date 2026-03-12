/**
 * MQ 配置属性
 * 支持从环境变量或 app.config.mq 加载，风格对齐 Spring Boot application.yml
 */
import { ConfigLoader } from '@ai-partner-x/aiko-boot/boot';

export interface MqProperties {
  type: 'rabbitmq' | 'kafka' | 'rocketmq' | 'redis' | 'memory';
  host: string;
  port?: number;
  username: string;
  password: string;
  vhost?: string;
  connectionTimeout?: number;
  defaultRetryCount?: number;
  enableDLQ?: boolean;
  /** TLS/AMQPS 连接（MQ_USE_TLS=true） */
  useTls?: boolean;
  /** RabbitMQ 预取数量，0 表示不限制 */
  prefetchCount?: number;
  /** 连接恢复：退避初始毫秒数 */
  reconnectInitialDelayMs?: number;
  /** 连接恢复：退避最大毫秒数 */
  reconnectMaxDelayMs?: number;
  /** Kafka 客户端 ID */
  clientId?: string;
  /** Kafka 消费者组 ID */
  groupId?: string;
  /** RocketMQ 代理端点，如 127.0.0.1:8081 */
  endpoints?: string;
  /** RocketMQ 命名空间，空为默认 */
  namespace?: string;
}

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function warnDefaultCredentials(username: string, password: string): void {
  const isDefault = username === 'guest' && password === 'guest';
  if (isProduction() && isDefault) {
    console.warn(
      '[aiko-boot-starter-mq] WARNING: Using default credentials (guest/guest) in production. ' +
        'Set MQ_USERNAME and MQ_PASSWORD for production use.'
    );
  }
}

export function loadMqProperties(): MqProperties {
  const username = process.env.MQ_USERNAME || 'guest';
  const password = process.env.MQ_PASSWORD || 'guest';
  warnDefaultCredentials(username, password);

  // 优先环境变量，其次 app.config.mq
  let type: MqProperties['type'] = (process.env.MQ_TYPE as MqProperties['type']) || undefined;
  if (!type && ConfigLoader.isLoaded()) {
    const mqConfig = ConfigLoader.getPrefix('mq');
    type = mqConfig?.type as MqProperties['type'];
  }
  type = type || 'rabbitmq';

  return {
    type,
    host: process.env.MQ_HOST || 'localhost',
    port: parseInt(process.env.MQ_PORT || '5672', 10),
    username,
    password,
    vhost: process.env.MQ_VHOST || '/',
    connectionTimeout: 10000,
    defaultRetryCount: 3,
    enableDLQ: true,
    useTls: process.env.MQ_USE_TLS === 'true',
    prefetchCount: parseInt(process.env.MQ_PREFETCH_COUNT || '10', 10),
    reconnectInitialDelayMs: parseInt(process.env.MQ_RECONNECT_INITIAL_DELAY_MS || '1000', 10),
    reconnectMaxDelayMs: parseInt(process.env.MQ_RECONNECT_MAX_DELAY_MS || '30000', 10),
    clientId: process.env.MQ_CLIENT_ID || 'aiko-boot-mq',
    groupId: process.env.MQ_GROUP_ID || 'default-group',
    endpoints: process.env.MQ_ENDPOINTS || undefined,
    namespace: process.env.MQ_NAMESPACE || '',
  };
}
