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
