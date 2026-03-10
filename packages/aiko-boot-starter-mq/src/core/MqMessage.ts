/**
 * 统一消息体
 * 文档 3.4 - topic/tag/key/body
 */

export interface MqMessage<T = unknown> {
  topic: string;
  tag?: string;
  key?: string;
  body: T;
}
