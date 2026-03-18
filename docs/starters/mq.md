# @ai-partner-x/aiko-boot-starter-mq

Spring Boot 风格的消息队列，支持 RabbitMQ、Kafka、RocketMQ：

| 功能 | 说明 |
|------|------|
| `@MqListener` | 消费者监听（topic/tag/group） |
| `MqTemplate` | 消息发送模板 |
| `ConsumerContainer` | 消费者容器注册 |
| `MqAutoConfiguration` | 自动配置（配合 createApp） |

**支持消息系统**: RabbitMQ、Kafka、RocketMQ、In-Memory

### Mq 消费示例

```ts
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
```

### Mq 生产示例

```ts
import { Service, Autowired } from '@ai-partner-x/aiko-boot';
import { MqTemplate } from '@ai-partner-x/aiko-boot-starter-mq';

/**
 * MqProducer - 消息生产者示例
 * 通过 @Autowired 注入 MqTemplate 发送消息
 */
@Service()
export class MqProducer {
  @Autowired(MqTemplate)
  private mqTemplate!: MqTemplate;

  async sendAll(): Promise<void> {
    console.log('\n--- Producer 发送 ---');
    console.log('send(topic, body)...');
    await this.mqTemplate.send('user.created', {
      userId: 'u-1',
      email: 'a@b.com',
      name: 'Alice',
    });

    console.log('send(topic, tag, body)...');
    await this.mqTemplate.send('user.created', 'add', {
      userId: 'u-2',
      email: 'b@c.com',
      name: 'Bob',
    });

    console.log('send(MqMessage)...');
    await this.mqTemplate.send({
      topic: 'order.paid',
      tag: 'pay',
      body: { orderId: 'ord-1', amount: 99 },
    });
  }
}
```