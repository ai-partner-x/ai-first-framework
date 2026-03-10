/**
 * MQ 统一序列化
 * 文档 3.3
 */

import { MqException } from './MqException.js';

export class MqSerializer {
  static toJson(obj: unknown): string {
    try {
      return JSON.stringify(obj);
    } catch (e) {
      throw new MqException('序列化失败', e as Error);
    }
  }

  static fromJson<T>(json: string, cls?: new () => T): T {
    try {
      const obj = JSON.parse(json);
      if (!cls) return obj as T;
      const instance = new cls() as Record<string, unknown>;
      return Object.assign(instance, obj) as T;
    } catch (e) {
      throw new MqException('反序列化失败', e as Error);
    }
  }
}
