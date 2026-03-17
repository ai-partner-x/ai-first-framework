import type { Command } from 'commander';
import { createAddAppUseCase } from '../usecases/add-app.usecase.js';
import { createCliLogger } from '../core/logger.js';
import { createPrompter } from '../core/prompts.js';

/**
 * add app 命令：在现有脚手架中新增前端应用（admin / mobile）。
 */
export function registerAddAppCommand(program: Command): void {
  program
    .command('add-app')
    .argument('[name]', '应用名称，例如 admin、mobile-v2')
    .option('-t, --type <type>', '应用类型：admin | mobile')
    .option('--root <dir>', '脚手架根目录（默认：当前工作目录）')
    .option(
      '--template-dir <dir>',
      '模板根目录（开发阶段通常为 ai-first-framework/scaffold）',
    )
    .option('--dry-run', '仅显示将要执行的操作，不实际写入文件')
    .description('在现有脚手架中新增前端应用（admin / mobile）')
    .action(async (name: string | undefined, options: any) => {
      const logger = createCliLogger();
      const prompter = createPrompter();
      const usecase = createAddAppUseCase({ logger, prompter });

      try {
        await usecase.execute({
          name,
          type: options.type,
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

