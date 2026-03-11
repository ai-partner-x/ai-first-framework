/**
 * MQ 统一异常
 * 文档 3.1
 */

export class MqException extends Error {
  cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'MqException';
    if (cause) this.cause = cause;
    Object.setPrototypeOf(this, MqException.prototype);
  }
}
