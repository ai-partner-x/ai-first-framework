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

export type AddAppInput = {
  name?: string;
  type?: string;
  rootDir?: string;
  templateDir?: string;
  dryRun: boolean;
};

export type AddAppDeps = {
  logger: Logger;
  prompter: Prompter;
};

export function createAddAppUseCase(deps: AddAppDeps) {
  const { logger, prompter } = deps;

  async function execute(input: AddAppInput): Promise<void> {
    let { name, type } = input;
    const rootDir = input.rootDir ?? process.cwd();

    const config = await loadProjectConfig(rootDir);
    if (!config) {
      throw new Error(
        '未找到 .aiko-boot.json，当前目录似乎不是脚手架根目录，请在 init 生成的根目录下执行。',
      );
    }

    if (!type) {
      type = await prompter.input('应用类型（admin 或 mobile）', 'admin');
    }
    if (!name) {
      name = await prompter.input(
        '应用名称（包名）',
        type === 'mobile' ? 'mobile' : 'admin',
      );
    }

    if (input.dryRun) {
      logger.info(
        `[dry-run] 将在 ${rootDir} 中新增应用：name=${name}, type=${type}`,
      );
      return;
    }

    if (type !== 'admin' && type !== 'mobile') {
      throw new Error('应用类型目前仅支持 admin 或 mobile');
    }

    // 计算模板目录：
    // - 如果用户提供了 --template-dir，使用用户指定的（可能是 scaffold 根目录或自定义模板）
    // - 否则，使用内置的 scaffold-default 模板
    let templateRoot = input.templateDir;
    if (!templateRoot) {
      const defaultTemplateRoot = path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        '../../templates/scaffold-default',
      );
      templateRoot = defaultTemplateRoot;
    }

    const templateAppDir = path.join(templateRoot, 'packages', type);
    if (!(await fs.pathExists(templateAppDir))) {
      throw new Error(`模板不存在：${templateAppDir}`);
    }

    const packagesDir = path.join(rootDir, 'packages');
    const appDir = path.join(packagesDir, name);

    if (await fs.pathExists(appDir)) {
      throw new Error(`目标应用目录已存在：${appDir}`);
    }

    // 如果还没有 core 包，则在第一次添加 admin/mobile 时一起从模板复制 core
    const templateCoreDir = path.join(templateRoot, 'packages', 'core');
    const coreDir = path.join(packagesDir, 'core');

    await fs.ensureDir(packagesDir);

    if (!(await fs.pathExists(coreDir)) && (await fs.pathExists(templateCoreDir))) {
      await fs.copy(templateCoreDir, coreDir);

      const corePkgPath = path.join(coreDir, 'package.json');
      if (await fs.pathExists(corePkgPath)) {
        const corePkg = await fs.readJson(corePkgPath);
        const scope = config.scope;
        if (scope) {
          corePkg.name = `@${scope}/core`;
          await fs.writeJson(corePkgPath, corePkg, { spaces: 2 });
          await replaceScopeInDir(coreDir, 'scaffold', scope);
        } else {
          corePkg.name = 'core';
          await fs.writeJson(corePkgPath, corePkg, { spaces: 2 });
        }
      }
      logger.info(`已自动创建共享 core 包：${coreDir}`);
    }

    await fs.copy(templateAppDir, appDir);

    const pkgPath = path.join(appDir, 'package.json');
    if (await fs.pathExists(pkgPath)) {
      const pkg = await fs.readJson(pkgPath);
      const scope = config.scope;
      if (scope) {
        pkg.name = `@${scope}/${name}`;
        await fs.writeJson(pkgPath, pkg, { spaces: 2 });
        // 将模板中的 @scaffold/* 替换为 @<scope>/*
        await replaceScopeInDir(appDir, 'scaffold', scope);
      } else {
        pkg.name = name;
        await fs.writeJson(pkgPath, pkg, { spaces: 2 });
      }
    }

    await ensurePnpmWorkspace(rootDir);
    await withProjectConfig(rootDir, (cfg) => {
      const apps = cfg.apps ?? [];
      if (!name) return;
      apps.push({
        name,
        type: type as any,
        path: path.join('packages', name),
      });
      cfg.apps = apps;
    });

    // 同步根 package.json（dev:admin / dev:mobile 等脚本）
    await syncRootPackageJson(rootDir);

    logger.info(`已在 ${appDir} 创建 ${type} 应用 "${name}"。`);
  }

  return { execute };
}

