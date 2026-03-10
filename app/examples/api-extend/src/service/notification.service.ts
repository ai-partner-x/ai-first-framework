/**
 * NotificationService - 演示 @Async fire-and-forget 邮件通知
 */
import 'reflect-metadata';
import { Service, Async, Autowired } from '@ai-partner-x/aiko-boot';
import { TaskLogService } from './task-log.service.js';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

@Service()
export class NotificationService {
  @Autowired()
  private taskLogService!: TaskLogService;

  /** 发送欢迎邮件（模拟 500ms 网络 I/O），fire-and-forget */
  @Async()
  async sendWelcomeEmail(to: string, userId: number): Promise<void> {
    const start = Date.now();
    await sleep(500);
    this.taskLogService.addLog({
      type: 'welcome-email',
      status: 'done',
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - start,
      detail: { to, userId },
    });
    console.log(`[NotificationService] Welcome email sent to ${to} (userId=${userId})`);
  }

  /** 发送密码重置邮件（模拟 300ms），fire-and-forget */
  @Async()
  async sendPasswordResetEmail(to: string): Promise<void> {
    const start = Date.now();
    await sleep(300);
    this.taskLogService.addLog({
      type: 'password-reset-email',
      status: 'done',
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - start,
      detail: { to },
    });
    console.log(`[NotificationService] Password reset email sent to ${to}`);
  }
}
