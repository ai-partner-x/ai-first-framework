/**
 * MqTemplate - 消息发送模板
 * 实现 MqSender 接口，可通过 @Inject(MqTemplate) 注入
 */

import { Injectable } from '@ai-partner-x/aiko-boot/di';
import { MqAutoConfiguration } from '../config/MqAutoConfiguration.js';
import type { MqMessage } from '../core/MqMessage.js';

@Injectable()
export class MqTemplate {
  private getAdapter() {
    return MqAutoConfiguration.getAdapter();
  }

  async send(message: MqMessage<unknown>): Promise<void>;
  async send(topic: string, body: unknown): Promise<void>;
  async send(topic: string, tag: string, body: unknown): Promise<void>;
  async send(
    msgOrTopic: MqMessage<unknown> | string,
    bodyOrTag?: unknown,
    body?: unknown
  ): Promise<void> {
    let message: MqMessage<unknown>;
    if (typeof msgOrTopic === 'object') {
      message = msgOrTopic;
    } else if (body !== undefined) {
      message = { topic: msgOrTopic, tag: String(bodyOrTag ?? ''), body };
    } else {
      message = { topic: msgOrTopic, tag: '', body: bodyOrTag };
    }
    return this.getAdapter().send(message);
  }
}
