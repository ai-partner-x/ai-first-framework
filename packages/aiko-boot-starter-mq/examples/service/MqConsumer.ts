import { MqListener, type MqListenerMeta } from '@ai-partner-x/aiko-boot-starter-mq';

/**
 * MqConsumer - 消息消费者示例
 * 通过 @MqListener 订阅多个 topic
 * MQ_LISTENERS 显式声明（tsx 下装饰器元数据可能丢失时的兜底）
 */
export class MqConsumer {
  static readonly MQ_LISTENERS: MqListenerMeta[] = [
    { topic: 'user.created', tag: 'add', group: 'user-group', method: 'onUserCreated' },
    { topic: 'order.paid', tag: 'pay', group: 'order-group', method: 'onOrderPaid' },
  ];

  @MqListener({ topic: 'user.created', tag: 'add', group: 'user-group' })
  async onUserCreated(event: { userId: string; email: string; name: string }): Promise<void> {
    console.log('✅ [MqConsumer] 收到 user.created:', JSON.stringify(event));
  }

  @MqListener({ topic: 'order.paid', tag: 'pay', group: 'order-group' })
  async onOrderPaid(event: { orderId: string; amount: number }): Promise<void> {
    console.log('✅ [MqConsumer] 收到 order.paid:', JSON.stringify(event));
  }
}
