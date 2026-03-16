import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import type { Logger } from '../core/logger.js';
import type { Prompter } from '../core/prompts.js';
import { loadProjectConfig } from '../core/project-config.js';
import {
  ensurePnpmWorkspace,
  syncRootPackageJson,
  withProjectConfig,
} from '../core/workspace.js';
import { replaceScopeInDir } from '../core/template-utils.js';

export type AddApiInput = {
  name?: string;
  db: string;
  rootDir?: string;
  templateDir?: string;
  dryRun: boolean;
};

export type AddApiDeps = {
  logger: Logger;
  prompter: Prompter;
};

export function createAddApiUseCase(deps: AddApiDeps) {
  const { logger, prompter } = deps;

  async function execute(input: AddApiInput): Promise<void> {
    let { name } = input;
    const rootDir = input.rootDir ?? process.cwd();

    const config = await loadProjectConfig(rootDir);
    if (!config) {
      throw new Error(
        '未找到 .aiko-boot.json，当前目录似乎不是脚手架根目录，请在 init 生成的根目录下执行。',
      );
    }

    if (!name) {
      name = await prompter.input('服务端名称（包名）', 'api');
    }

    // 计算模板根目录：
    // - 默认使用 CLI 包内部的 templates/api-base 作为 base-api 模板；
    // - 如果用户通过 --template-dir 显式提供：
    //   - 若该目录本身是一个 api 根（包含 app.config.ts 和 src/），则直接使用；
    //   - 若该目录下存在 packages/api（例如传入 scaffold 根目录），则使用 packages/api 作为模板。
    const defaultTemplateApiDir = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../templates/api-base',
    );

    let templateApiDir = defaultTemplateApiDir;
    if (input.templateDir) {
      const candidateRoot = path.resolve(input.templateDir);
      const candidateAsApiRoot = path.join(candidateRoot, 'app.config.ts');
      const candidateApiDir = path.join(candidateRoot, 'packages', 'api');

      if (await fs.pathExists(candidateAsApiRoot)) {
        // 传入的是 api 根目录（类似 api-base）
        templateApiDir = candidateRoot;
      } else if (await fs.pathExists(path.join(candidateApiDir, 'app.config.ts'))) {
        // 传入的是 scaffold 根目录，内部有 packages/api
        templateApiDir = candidateApiDir;
      } else {
        throw new Error(
          `无法识别的模板目录：${candidateRoot}（需要是 api 根目录，或包含 packages/api 的 scaffold 根目录）`,
        );
      }
    }

    if (input.dryRun) {
      logger.info(
        `[dry-run] 将在 ${rootDir} 中新增服务端：name=${name}, db=${input.db}`,
      );
      logger.info(`[dry-run] 使用模板目录: ${templateApiDir}`);
      return;
    }
    if (!(await fs.pathExists(templateApiDir))) {
      throw new Error(`模板不存在：${templateApiDir}`);
    }

    const packagesDir = path.join(rootDir, 'packages');
    const apiDir = path.join(packagesDir, name);

    if (await fs.pathExists(apiDir)) {
      throw new Error(`目标服务端目录已存在：${apiDir}`);
    }

    await fs.ensureDir(packagesDir);
    await fs.copy(templateApiDir, apiDir);

    const pkgPath = path.join(apiDir, 'package.json');
    if (await fs.pathExists(pkgPath)) {
      const pkg = await fs.readJson(pkgPath);
      const scope = config.scope;
      if (scope) {
        pkg.name = `@${scope}/${name}`;
        await fs.writeJson(pkgPath, pkg, { spaces: 2 });
        await replaceScopeInDir(apiDir, 'scaffold', scope);
      } else {
        pkg.name = name;
        await fs.writeJson(pkgPath, pkg, { spaces: 2 });
      }
    }

    await ensurePnpmWorkspace(rootDir);
    await withProjectConfig(rootDir, (cfg) => {
      const apis = cfg.apis ?? [];
      apis.push({
        name: name!,
        path: path.join('packages', name!),
        db: input.db,
        features: [],
      });
      cfg.apis = apis;
    });

    // 同步根 package.json（dev/build/start:api 等脚本）
    await syncRootPackageJson(rootDir);

    logger.info(
      `已在 ${apiDir} 创建服务端 "${name}"（db=${input.db}）。`,
    );
  }

  return { execute };
}

