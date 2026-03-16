import type { Command } from 'commander';
import { createCliLogger } from '../core/logger.js';
import { loadProjectConfig } from '../core/project-config.js';

/**
 * list 命令：列出当前脚手架中的 apps / apis / features。
 * 仅作为演示配置文件结构的命令，方便用户查看当前状态。
 */
export function registerListCommand(program: Command): void {
  program
    .command('list')
    .option('--root <dir>', '脚手架根目录（默认：当前工作目录）')
    .description('列出当前脚手架中的应用、服务端和特性')
    .action(async (options: any) => {
      const logger = createCliLogger();
      const rootDir = options.root ?? process.cwd();

      try {
        const config = await loadProjectConfig(rootDir);
        if (!config) {
          logger.info('当前目录似乎不是 aiko-boot 脚手架根目录（未找到 .aiko-boot.json）。');
          return;
        }

        logger.info(`scope: ${config.scope ?? '(unknown)'}`);
        logger.info('apps:');
        for (const app of config.apps ?? []) {
          logger.info(`  - ${app.name} [${app.type}] -> ${app.path}`);
        }

        logger.info('apis:');
        for (const api of config.apis ?? []) {
          logger.info(
            `  - ${api.name} [db=${api.db}] features=[${(api.features ?? []).join(
              ', ',
            )}] -> ${api.path}`,
          );
        }
      } catch (err) {
        logger.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });
}

