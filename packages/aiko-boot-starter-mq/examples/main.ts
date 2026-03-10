/**
 * MQ 注解驱动示例
 *
 * - MqProducer 发送消息
 * - MqConsumer 订阅消息（@MqListener）
 * - MQ_TYPE=memory 无需 RabbitMQ
 */

process.env.MQ_TYPE = 'memory';

import 'reflect-metadata';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { createApp } from '@ai-partner-x/aiko-boot/boot';
import { Container } from '@ai-partner-x/aiko-boot/di';
import { MqTemplate, MqAutoConfiguration } from '@ai-partner-x/aiko-boot-starter-mq';
import { MqProducer } from './service/MqProducer.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

async function main(): Promise<void> {
  console.log('=== @aiko-boot-starter-mq 示例 ===\n');

  await createApp({
    srcDir: __dirname,
    configPath: join(__dirname, '../../..'),
    scanDirs: ['service'],
    verbose: true,
  });

  const producer = Container.resolve(MqProducer);
  if (!(producer as any).mqTemplate) {
    (producer as any).mqTemplate = Container.resolve(MqTemplate);
  }
  await producer.sendAll();

  await MqAutoConfiguration.getAdapter().close();
  console.log('\n=== 示例完成（上方有 ✅ 即表示 consume 成功）===');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
