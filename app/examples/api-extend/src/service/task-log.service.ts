/**
 * TaskLogService - 记录 @Async 后台任务的执行结果（内存存储）
 */
import 'reflect-metadata';
import { Service } from '@ai-partner-x/aiko-boot';

export interface TaskLogEntry {
  type: string;
  status: 'done' | 'failed';
  completedAt: string;
  durationMs: number;
  detail?: Record<string, unknown>;
}

@Service()
export class TaskLogService {
  private readonly logs: TaskLogEntry[] = [];

  addLog(entry: TaskLogEntry): void {
    this.logs.push(entry);
    console.log(`[TaskLog] ${entry.status.toUpperCase()} | ${entry.type} | ${entry.durationMs}ms`);
  }

  getLogs(): TaskLogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs.length = 0;
  }
}
