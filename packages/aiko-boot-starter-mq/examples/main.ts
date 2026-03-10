/**
 * MQ 注解驱动示例
 *
 * - createApp + scanDirs 自动发现 @MqListener、@Service
 * - MqTemplate 通过 @Autowired 注入
 * - MqTemplate.send 三种重载
 * - MQ_TYPE=memory 无需 RabbitMQ
 */

process.env.MQ_TYPE = 'memory';

import 'reflect-metadata';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { createApp } from '@ai-partner-x/aiko-boot/boot';
import { Container } from '@ai-partner-x/aiko-boot/di';
import { MqTemplate } from '@ai-partner-x/aiko-boot-starter-mq';
import { MqExampleRunner } from './service/MqExampleRunner.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

async function main(): Promise<void> {
  console.log('=== @aiko-boot-starter-mq 注解驱动示例 ===\n');

  await createApp({
    srcDir: __dirname,
    configPath: join(__dirname, '../../..'),
    scanDirs: ['listeners', 'service'],
    verbose: true,
  });

  const runner = Container.resolve(MqExampleRunner);
  // tsx 直接运行 examples 时 @Autowired 可能未注入，兜底从容器获取
  if (!(runner as any).mqTemplate) {
    (runner as any).mqTemplate = Container.resolve(MqTemplate);
  }
  await runner.run();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
