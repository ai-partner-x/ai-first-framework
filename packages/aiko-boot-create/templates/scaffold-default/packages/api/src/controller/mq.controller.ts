import 'reflect-metadata';
import { RestController, PostMapping, RequestBody } from '@ai-partner-x/aiko-boot-starter-web';
import { Autowired } from '@ai-partner-x/aiko-boot';
import { MqTemplate } from '@ai-partner-x/aiko-boot-starter-mq';
import type { SendUserEventDto, UserEventDto } from '../dto/mq.dto.js';

@RestController({ path: '/mq' })
export class MqController {
  @Autowired(MqTemplate)
  private mqTemplate!: MqTemplate;

  /**
   * 发送用户相关消息到 MQ
   * POST /api/mq/send
   */
  @PostMapping('/send')
  async send(@RequestBody() dto: SendUserEventDto): Promise<{ ok: boolean; topic: string }> {
    if (dto.tag) {
      await this.mqTemplate.send(dto.topic, dto.tag, dto.body);
    } else {
      await this.mqTemplate.send(dto.topic, dto.body);
    }
    return { ok: true, topic: dto.topic };
  }

  /**
   * 快捷发送 user.created 事件（复用 User 实体字段）
   * POST /api/mq/send-user-created
   */
  @PostMapping('/send-user-created')
  async sendUserCreated(@RequestBody() body: UserEventDto): Promise<{ ok: boolean }> {
    await this.mqTemplate.send('user.created', 'add', body);
    return { ok: true };
  }
}
