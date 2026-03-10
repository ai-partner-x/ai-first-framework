import { Service, Autowired } from '@ai-partner-x/aiko-boot';
import { MqTemplate, MqAutoConfiguration } from '@ai-partner-x/aiko-boot-starter-mq';

@Service()
export class MqExampleRunner {
  @Autowired(MqTemplate)
  private mqTemplate!: MqTemplate;

  async run(): Promise<void> {
    console.log('\n--- send(topic, body) ---');
    await this.mqTemplate.send('user.created', {
      userId: 'u-1',
      email: 'a@b.com',
      name: 'Alice',
    });

    console.log('--- send(topic, tag, body) ---');
    await this.mqTemplate.send('user.created', 'add', {
      userId: 'u-2',
      email: 'b@c.com',
      name: 'Bob',
    });

    console.log('--- send(MqMessage) ---');
    await this.mqTemplate.send({
      topic: 'order.paid',
      tag: 'pay',
      body: { orderId: 'ord-1', amount: 99 },
    });

    await MqAutoConfiguration.getAdapter().close();
    console.log('\n=== 示例完成 ===');
  }
}
