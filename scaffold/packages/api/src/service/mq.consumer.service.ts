import 'reflect-metadata';
import { Service } from '@ai-partner-x/aiko-boot';
import { MqListener, type MqListenerMeta } from '@ai-partner-x/aiko-boot-starter-mq';
import type { UserEventDto } from '../dto/mq.dto.js';

/**
 * MQ 消费者服务 - 订阅 user 相关消息
 * 复用 User 实体字段结构（id, username, email, createdAt, updatedAt）
 */
@Service()
export class MqConsumerService {
  static readonly MQ_LISTENERS: MqListenerMeta[] = [
    { topic: 'user.created', tag: 'add', group: 'scaffold-user-group', method: 'onUserCreated' },
    { topic: 'user.updated', tag: 'update', group: 'scaffold-user-group', method: 'onUserUpdated' },
  ];

  @MqListener({ topic: 'user.created', tag: 'add', group: 'scaffold-user-group' })
  async onUserCreated(event: UserEventDto): Promise<void> {
    console.log('[MqConsumer] user.created:', JSON.stringify(event));
  }

  @MqListener({ topic: 'user.updated', tag: 'update', group: 'scaffold-user-group' })
  async onUserUpdated(event: UserEventDto): Promise<void> {
    console.log('[MqConsumer] user.updated:', JSON.stringify(event));
  }
}
