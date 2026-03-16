import type { Command } from 'commander';
import { createInitUseCase } from '../usecases/init-scaffold.usecase.js';
import { createCliLogger } from '../core/logger.js';
import { createPrompter } from '../core/prompts.js';

/**
 * init 命令：创建新的脚手架 monorepo。
 *
 * 仅搭建参数和调用用例层的骨架，实际业务逻辑在 usecase 中实现。
 */
export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .argument('[targetDir]', '目标目录（默认：当前目录下以项目名命名的文件夹）')
    .option('-n, --name <name>', '项目名 / scope，例如 my-app')
    .option('--empty', '仅创建空的 monorepo 结构，不包含 admin/mobile/api')
    .option('--with-admin', '在初始化时创建 admin 应用')
    .option('--with-mobile', '在初始化时创建 mobile 应用')
    .option('--with-api', '在初始化时创建 api 服务端')
    .option('--template-dir <dir>', '模板目录（默认：<cwd>/scaffold）')
    .option('--dry-run', '仅显示将要执行的操作，不实际写入文件')
    .description('初始化一个新的 aiko-boot 脚手架 monorepo')
    .action(async (targetDir: string | undefined, options: any) => {
      const logger = createCliLogger();
      const prompter = createPrompter();
      const usecase = createInitUseCase({ logger, prompter });

      try {
        await usecase.execute({
          targetDir,
          name: options.name,
          empty: !!options.empty,
          withAdmin: !!options.withAdmin,
          withMobile: !!options.withMobile,
          withApi: !!options.withApi,
          templateDir: options.templateDir,
          dryRun: !!options.dryRun,
        });
      } catch (err) {
        logger.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });
}

