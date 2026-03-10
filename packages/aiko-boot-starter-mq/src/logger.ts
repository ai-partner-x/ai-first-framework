/**
 * @ai-partner-x/aiko-boot-starter-mq 简单日志
 * 与项目其他包风格一致，使用 console + 前缀
 */

const PREFIX = '[@ai-partner-x/aiko-boot-starter-mq]';

export const logger = {
  info(message: string, ...args: unknown[]): void {
    console.log(PREFIX, message, ...args);
  },
  warn(message: string, ...args: unknown[]): void {
    console.warn(PREFIX, message, ...args);
  },
  error(message: string, ...args: unknown[]): void {
    console.error(PREFIX, message, ...args);
  },
  debug(message: string, ...args: unknown[]): void {
    if (process.env.DEBUG?.includes('mq')) {
      console.debug(PREFIX, message, ...args);
    }
  },
};
