/**
 * AsyncController - 演示 @Async 装饰器（fire-and-forget 后台任务）
 *
 * 功能：
 *   - @Async  fire-and-forget：调用方立刻收到 void，任务在后台运行
 *   - @Async({ onError })：自定义后台异常处理，HTTP 调用方不受影响
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  POST   /api/async/send-email          欢迎邮件 (500ms)      │
 * │  POST   /api/async/send-password-reset 密码重置邮件 (300ms)  │
 * │  POST   /api/async/generate-report     销售报告 (1000ms)     │
 * │  POST   /api/async/trigger-error       必然失败任务 (onError) │
 * │  GET    /api/async/log                 查看任务执行日志        │
 * │  DELETE /api/async/log                 清空日志               │
 * └─────────────────────────────────────────────────────────────┘
 */
import 'reflect-metadata';
import {
  RestController,
  GetMapping,
  PostMapping,
  DeleteMapping,
  RequestBody,
} from '@ai-partner-x/aiko-boot-starter-web';
import { Autowired } from '@ai-partner-x/aiko-boot';
import { NotificationService } from '../service/notification.service.js';
import { ReportService } from '../service/report.service.js';
import { TaskLogService } from '../service/task-log.service.js';

@RestController({ path: '/async' })
export class AsyncController {
  @Autowired()
  private notificationService!: NotificationService;

  @Autowired()
  private reportService!: ReportService;

  @Autowired()
  private taskLogService!: TaskLogService;

  /**
   * POST /api/async/send-email
   * 触发 @Async sendWelcomeEmail（500ms 后台 I/O）。
   * returnedInMs 接近 0，体现 fire-and-forget。
   */
  @PostMapping('/send-email')
  async sendEmail(
    @RequestBody() body: { to: string; userId: number },
  ): Promise<object> {
    if (!body?.to) throw new Error('Missing required field: to');
    if (body.userId === undefined || body.userId === null) throw new Error('Missing required field: userId');
    const t0 = Date.now();
    this.notificationService.sendWelcomeEmail(body.to, Number(body.userId));
    return {
      message: '✅ Email task submitted',
      returnedInMs: Date.now() - t0,
      note: 'Background task started. Email completes in ~500ms.',
    };
  }

  /**
   * POST /api/async/send-password-reset
   * 触发 @Async sendPasswordResetEmail（300ms 后台 I/O）。
   */
  @PostMapping('/send-password-reset')
  async sendPasswordReset(
    @RequestBody() body: { to: string },
  ): Promise<object> {
    if (!body?.to) throw new Error('Missing required field: to');
    const t0 = Date.now();
    this.notificationService.sendPasswordResetEmail(body.to);
    return {
      message: '✅ Password reset email task submitted',
      returnedInMs: Date.now() - t0,
      note: 'Background task started. Email completes in ~300ms.',
    };
  }

  /**
   * POST /api/async/generate-report
   * 触发 @Async generateSalesReport（1000ms 重计算）。
   * HTTP 响应几乎立刻返回，演示异步解耦价值。
   */
  @PostMapping('/generate-report')
  async generateReport(
    @RequestBody() body: { month: string },
  ): Promise<object> {
    if (!body?.month) throw new Error('Missing required field: month (e.g. "2024-03")');
    const t0 = Date.now();
    this.reportService.generateSalesReport(body.month);
    return {
      message: '✅ Report generation task submitted',
      returnedInMs: Date.now() - t0,
      note: 'Heavy computation runs in background. Report ready in ~1000ms.',
    };
  }

  /**
   * POST /api/async/trigger-error
   * 触发必然失败的 @Async 任务。
   * 调用方仍然收到 200 OK，错误由 onError 处理器捕获。
   */
  @PostMapping('/trigger-error')
  async triggerError(
    @RequestBody() body: { reportType: string },
  ): Promise<object> {
    if (!body?.reportType) throw new Error('Missing required field: reportType (e.g. "quarterly")');
    const t0 = Date.now();
    this.reportService.generateFailingReport(body.reportType);
    return {
      message: '✅ Failing task submitted — caller is unaffected by background error',
      returnedInMs: Date.now() - t0,
      note: 'Check server logs for onError output. GET /api/async/log → status=failed.',
    };
  }

  /** GET /api/async/log — 查看后台任务执行日志 */
  @GetMapping('/log')
  getLog(): object {
    const logs = this.taskLogService.getLogs();
    return { count: logs.length, tasks: logs };
  }

  /** DELETE /api/async/log — 清空日志 */
  @DeleteMapping('/log')
  clearLog(): object {
    this.taskLogService.clearLogs();
    return { message: 'Log cleared' };
  }
}
