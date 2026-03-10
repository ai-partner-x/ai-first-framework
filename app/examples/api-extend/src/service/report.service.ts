/**
 * ReportService - 演示 @Async 重计算任务 + 自定义 onError 错误处理
 */
import 'reflect-metadata';
import { Service, Async, Autowired } from '@ai-partner-x/aiko-boot';
import { TaskLogService } from './task-log.service.js';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

@Service()
export class ReportService {
  @Autowired()
  private taskLogService!: TaskLogService;

  /** 生成销售报告（模拟 1s 重计算），fire-and-forget */
  @Async()
  async generateSalesReport(month: string): Promise<void> {
    const start = Date.now();
    await sleep(1000);
    this.taskLogService.addLog({
      type: 'sales-report',
      status: 'done',
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - start,
      detail: { month },
    });
    console.log(`[ReportService] Sales report for ${month} generated`);
  }

  /**
   * 必然失败的任务 —— 演示 @Async({ onError }) 错误隔离
   * 调用方收到 200 OK，错误被自定义 handler 捕获
   */
  @Async({
    onError: (err, method) => {
      console.error(`[ReportService] Custom onError in "${method}":`, (err as Error).message);
    },
  })
  async generateFailingReport(reportType: string): Promise<void> {
    await sleep(200);
    this.taskLogService.addLog({
      type: 'failing-report',
      status: 'failed',
      completedAt: new Date().toISOString(),
      durationMs: 200,
      detail: { reportType, error: 'data source unavailable' },
    });
    throw new Error(`Report generation failed for "${reportType}": data source unavailable`);
  }
}
