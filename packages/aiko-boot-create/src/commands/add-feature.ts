import type { Command } from 'commander';
import { createAddFeatureUseCase } from '../usecases/add-feature.usecase.js';
import { createCliLogger } from '../core/logger.js';
import { createPrompter } from '../core/prompts.js';

/**
 * add feature 命令：给指定服务端增加特定组件（redis / file / mq）。
 */
export function registerAddFeatureCommand(program: Command): void {
  program
    .command('add-feature')
    .requiredOption('--service <service>', '目标服务端名称，例如 api、user-api')
    .requiredOption(
      '--feature <feature>',
      '特性类型：redis | file | mq（可扩展）',
    )
    .option('--root <dir>', '脚手架根目录（默认：当前工作目录）')
    .option('--dry-run', '仅显示将要执行的操作，不实际写入文件')
    .description('为指定服务端增加特性组件（redis、文件管理、消息队列等）')
    .action(async (options: any) => {
      const logger = createCliLogger();
      const prompter = createPrompter();
      const usecase = createAddFeatureUseCase({ logger, prompter });

      try {
        await usecase.execute({
          serviceName: options.service,
          feature: options.feature,
          rootDir: options.root,
          dryRun: !!options.dryRun,
        });
      } catch (err) {
        logger.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });
}

