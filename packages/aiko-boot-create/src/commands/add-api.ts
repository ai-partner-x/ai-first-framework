import type { Command } from 'commander';
import { createAddApiUseCase } from '../usecases/add-api.usecase.js';
import { createCliLogger } from '../core/logger.js';
import { createPrompter } from '../core/prompts.js';

/**
 * add api 命令：在现有脚手架中新增服务端工程（默认包含数据库）。
 */
export function registerAddApiCommand(program: Command): void {
  program
    .command('add-api')
    .argument('[name]', '服务端名称，例如 api、user-api')
    .option('--db <db>', '数据库类型（预留：sqlite | postgres | mysql 等）', 'sqlite')
    .option('--root <dir>', '脚手架根目录（默认：当前工作目录）')
    .option(
      '--template-dir <dir>',
      '模板根目录（开发阶段通常为 ai-first-framework/scaffold）',
    )
    .option('--dry-run', '仅显示将要执行的操作，不实际写入文件')
    .description('在现有脚手架中新增服务端工程（自动包含数据库初始化逻辑）')
    .action(async (name: string | undefined, options: any) => {
      const logger = createCliLogger();
      const prompter = createPrompter();
      const usecase = createAddApiUseCase({ logger, prompter });

      try {
        await usecase.execute({
          name,
          db: options.db,
          rootDir: options.root,
          templateDir: options.templateDir,
          dryRun: !!options.dryRun,
        });
      } catch (err) {
        logger.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });
}

