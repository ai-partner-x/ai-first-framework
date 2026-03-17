import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import type { Logger } from '../core/logger.js';
import type { Prompter } from '../core/prompts.js';
import {
  AikoProjectConfig,
  saveProjectConfig,
} from '../core/project-config.js';
import { syncRootPackageJson } from '../core/workspace.js';
import { createAddApiUseCase } from './add-api.usecase.js';
import { createAddAppUseCase } from './add-app.usecase.js';

export type InitScaffoldInput = {
  targetDir?: string;
  name?: string;
  empty: boolean;
  withAdmin: boolean;
  withMobile: boolean;
  withApi: boolean;
  templateDir?: string;
  dryRun: boolean;
};

export type InitScaffoldDeps = {
  logger: Logger;
  prompter: Prompter;
};

// 在 ESM 环境中模拟 __dirname，兼容打包到 dist 后的运行时
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createInitUseCase(deps: InitScaffoldDeps) {
  const { logger, prompter } = deps;

  async function resolveInput(input: InitScaffoldInput): Promise<{
    targetDir: string;
    name: string;
    templateDir: string;
    options: Omit<InitScaffoldInput, 'targetDir' | 'name' | 'templateDir'>;
  }> {
    const cwd = process.cwd();
    let name = input.name;
    let targetDir = input.targetDir;

    // 如果没有显式指定 name，则优先根据 targetDir 推断（取目录名），再退回到交互输入
    if (!name && targetDir) {
      name = path.basename(targetDir);
    }
    if (!name) {
      name = await prompter.input('项目名称（例如 my-app）', 'my-app');
    }

    if (!targetDir) {
      const defaultDir = path.join(cwd, name);
      const answer = await prompter.input(
        '目标目录',
        path.relative(cwd, defaultDir) || defaultDir,
      );
      targetDir = path.resolve(cwd, answer || defaultDir);
    }

    const resolvedName = name!;
    const resolvedTargetDir = targetDir!;

    // 默认使用包内置模板：templates/scaffold-default
    // 这样发布到 npm 后也可以直接使用，而无需依赖仓库根目录的 ./scaffold。
    const defaultTemplateDir = path.resolve(
      __dirname,
      '../../templates/scaffold-default',
    );
    const templateDir = input.templateDir ?? defaultTemplateDir;

    return {
      targetDir: resolvedTargetDir,
      name: resolvedName,
      templateDir,
      options: {
        empty: input.empty,
        withAdmin: input.withAdmin,
        withMobile: input.withMobile,
        withApi: input.withApi,
        dryRun: input.dryRun,
      },
    };
  }

  async function execute(input: InitScaffoldInput): Promise<void> {
    const { targetDir, name, templateDir, options } = await resolveInput(input);

    if (options.dryRun) {
      logger.info('[dry-run] 将会创建脚手架：');
      logger.info(`  name: ${name}`);
      logger.info(`  targetDir: ${targetDir}`);
      logger.info(`  templateDir: ${templateDir}`);
      logger.info(
        `  empty: ${options.empty}, withAdmin: ${options.withAdmin}, withMobile: ${options.withMobile}, withApi: ${options.withApi}`,
      );
      return;
    }

    logger.info(`创建 aiko-boot 脚手架到：${targetDir}`);
    await fs.ensureDir(path.dirname(targetDir));

    // 步骤 1: 总是先创建空骨架和基础配置文件
    await fs.ensureDir(targetDir);
    await fs.ensureDir(path.join(targetDir, 'packages'));

    const rootPkgPath = path.join(targetDir, 'package.json');
    if (!(await fs.pathExists(rootPkgPath))) {
      await fs.writeJson(
        rootPkgPath,
        {
          name: `${name}-monorepo`,
          private: true,
          version: '0.1.0',
          scripts: {
            dev: 'echo "Add dev scripts in each package (api/admin/mobile) after created."',
          },
        },
        { spaces: 2 },
      );
    }

    const workspacePath = path.join(targetDir, 'pnpm-workspace.yaml');
    if (!(await fs.pathExists(workspacePath))) {
      await fs.writeFile(
        workspacePath,
        `packages:
  - 'packages/*'
`,
        'utf-8',
      );
    }

    // 步骤 2: 创建 .aiko-boot.json 配置文件
    const config: AikoProjectConfig = {
      version: 1,
      scope: name,
      packageManager: 'pnpm',
      apps: [],
      apis: [],
    };
    await saveProjectConfig(targetDir, config);

    // 步骤 3: 如果指定了 --with-api/--with-admin/--with-mobile，复用 add-api/add-app 的逻辑
    if (!options.empty) {
      const addApiUseCase = createAddApiUseCase({ logger, prompter });
      const addAppUseCase = createAddAppUseCase({ logger, prompter });

      // 默认模板目录：使用内置的 scaffold-default（如果用户没指定）
      const defaultTemplateRoot = templateDir;

      if (options.withApi) {
        logger.info('正在添加 API 服务端...');
        await addApiUseCase.execute({
          name: 'api',
          db: 'sqlite',
          rootDir: targetDir,
          templateDir: undefined, // 使用 add-api 的默认内置模板 api-base
          dryRun: false,
        });
      }

      if (options.withAdmin) {
        logger.info('正在添加 Admin 应用...');
        await addAppUseCase.execute({
          name: 'admin',
          type: 'admin',
          rootDir: targetDir,
          templateDir: defaultTemplateRoot, // 从 scaffold-default/packages/admin 复制
          dryRun: false,
        });
      }

      if (options.withMobile) {
        logger.info('正在添加 Mobile 应用...');
        await addAppUseCase.execute({
          name: 'mobile',
          type: 'mobile',
          rootDir: targetDir,
          templateDir: defaultTemplateRoot, // 从 scaffold-default/packages/mobile 复制
          dryRun: false,
        });
      }
    }

    // 最后统一同步根 package.json（scripts / pnpm.onlyBuiltDependencies 等）
    await syncRootPackageJson(targetDir);

    logger.info('脚手架创建完成。');
  }

  return { execute };
}

