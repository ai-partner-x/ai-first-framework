/**
 * TaskLogService - 记录 @Async 后台任务的执行结果（内存存储）
 */
import 'reflect-metadata';
import { Service } from '@ai-partner-x/aiko-boot';
import { JsonFormat } from '@ai-partner-x/aiko-boot-starter-web';

export class TaskLogEntry {
  type!: string;
  status!: 'done' | 'failed';
  @JsonFormat({ pattern: 'yyyy-MM-dd HH:mm:ss.SSS', timezone: 'GMT+00:00' })
  completedAt!: Date;
  durationMs!: number;
  detail?: Record<string, unknown>;
}

@Service()
export class TaskLogService {
  private readonly logs: TaskLogEntry[] = [];

  addLog(entry: TaskLogEntry): void {
    const item = Object.assign(new TaskLogEntry(), entry);
    this.logs.push(item);
    console.log(`[TaskLog] ${entry.status.toUpperCase()} | ${entry.type} | ${entry.durationMs}ms`);
  }

  getLogs(): TaskLogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs.length = 0;
  }
}
