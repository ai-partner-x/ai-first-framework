import path from 'path';
import fs from 'fs-extra';
import {
  loadProjectConfig,
  saveProjectConfig,
  type AikoProjectConfig,
} from './project-config.js';

const FRAMEWORK_SCOPE = '@ai-partner-x/';
const FRAMEWORK_PACKAGE_NAMES = [
  'aiko-boot',
  'aiko-boot-codegen',
  'aiko-boot-starter-cache',
  'aiko-boot-starter-orm',
  'aiko-boot-starter-validation',
  'aiko-boot-starter-web',
  'aiko-boot-starter-storage',
  'aiko-boot-starter-security',
  'aiko-boot-starter-mq',
  'aiko-boot-starter-log',
] as const;

export async function ensurePnpmWorkspace(rootDir: string): Promise<void> {
  const workspacePath = path.join(rootDir, 'pnpm-workspace.yaml');
  if (await fs.pathExists(workspacePath)) return;

  await fs.writeFile(
    workspacePath,
    `packages:
  - 'packages/*'
`,
    'utf-8',
  );
}

export async function withProjectConfig(
  rootDir: string,
  updater: (config: AikoProjectConfig) => AikoProjectConfig | void,
): Promise<AikoProjectConfig> {
  const existing = (await loadProjectConfig(rootDir)) ?? {
    version: 1,
    apps: [],
    apis: [],
  };
  const next = (updater(existing) ?? existing) as AikoProjectConfig;
  await saveProjectConfig(rootDir, next);
  return next;
}

/**
 * 根据 .aiko-boot.json 的配置，同步根目录下的 package.json：
 * - 补充 name/version/private
 * - 生成常用 scripts（dev / build / lint / dev:api 等）
 * - 便于后续在根目录直接运行 pnpm 脚本
 */
export async function syncRootPackageJson(rootDir: string): Promise<void> {
  const config = await loadProjectConfig(rootDir);
  if (!config) return;

  const rootPkgPath = path.join(rootDir, 'package.json');
  let pkg: any = {};

  if (await fs.pathExists(rootPkgPath)) {
    pkg = await fs.readJson(rootPkgPath);
  }

  const scope = config.scope ?? 'scaffold';

  if (!pkg.name) {
    pkg.name = `${scope}-monorepo`;
  }
  if (pkg.private === undefined) {
    pkg.private = true;
  }
  if (!pkg.version) {
    pkg.version = '0.1.0';
  }

  const scripts: Record<string, string> = pkg.scripts ?? {};

  // 通用脚本：对所有 @<scope>/* 包执行 dev / build / lint
  scripts.dev = `pnpm -r --parallel --filter "@${scope}/*" dev`;
  scripts.build = `pnpm -r --filter "@${scope}/*" build`;
  scripts.lint = `pnpm -r --filter "@${scope}/*" lint`;

  // API 相关脚本：只针对 name === 'api' 的服务，保持与 scaffold 模板一致
  const api = (config.apis ?? []).find((x) => x.name === 'api');
  if (api) {
    const apiPkgName = `@${scope}/${api.name}`;
    scripts['dev:api'] = `pnpm -F ${apiPkgName} dev`;
    scripts['build:api'] = `pnpm -F ${apiPkgName} build`;
    scripts['start:api'] = `pnpm -F ${apiPkgName} start`;
    scripts['init-db'] = `pnpm -F ${apiPkgName} init-db`;
  }

  // Admin / Mobile 应用脚本：按照 type 分类
  const apps = config.apps ?? [];
  const adminApp = apps.find((x) => x.type === 'admin');
  if (adminApp) {
    const adminPkgName = `@${scope}/${adminApp.name}`;
    scripts['dev:admin'] = `pnpm -F ${adminPkgName} dev`;
    scripts['build:admin'] = `pnpm -F ${adminPkgName} build`;
  }
  const mobileApp = apps.find((x) => x.type === 'mobile');
  if (mobileApp) {
    const mobilePkgName = `@${scope}/${mobileApp.name}`;
    scripts['dev:mobile'] = `pnpm -F ${mobilePkgName} dev`;
    scripts['build:mobile'] = `pnpm -F ${mobilePkgName} build`;
  }

  pkg.scripts = scripts;

  // 与 scaffold-default 对齐：只在未设置时提供默认值
  const pnpmConfig = pkg.pnpm ?? {};
  if (!pnpmConfig.onlyBuiltDependencies) {
    pnpmConfig.onlyBuiltDependencies = ['better-sqlite3'];
  }

  // 在 monorepo 模式下自动写入本地框架的 pnpm.overrides，解决 workspace:* 找不到的问题
  if (!pnpmConfig.overrides) {
    const frameworkRoot = await detectFrameworkRootFromProject(rootDir);
    if (frameworkRoot) {
      const relativeToFramework = path
        .relative(rootDir, frameworkRoot)
        .replace(/\\/g, '/');
      const filePrefix = relativeToFramework.startsWith('.')
        ? relativeToFramework
        : `./${relativeToFramework}`;

      const overrides: Record<string, string> = {};
      for (const pkgName of FRAMEWORK_PACKAGE_NAMES) {
        overrides[`${FRAMEWORK_SCOPE}${pkgName}`] = `file:${filePrefix}/packages/${pkgName}`;
      }
      pnpmConfig.overrides = overrides;
    }
  }

  pkg.pnpm = pnpmConfig;

  await fs.writeJson(rootPkgPath, pkg, { spaces: 2 });
}

/**
 * 从生成项目目录向上查找包含 packages/aiko-boot 的本地框架根目录。
 * 用于在本仓库 monorepo 内开发时自动生成 pnpm.overrides。
 */
async function detectFrameworkRootFromProject(
  projectRoot: string,
): Promise<string | null> {
  let current = path.resolve(projectRoot);

  // 最多向上查找 6 层，防止死循环
  for (let i = 0; i < 6; i += 1) {
    const parent = path.dirname(current);
    if (parent === current) break;

    const candidate = parent;
    const aikoBootPath = path.join(candidate, 'packages', 'aiko-boot');
    if (await fs.pathExists(aikoBootPath)) {
      return candidate;
    }

    current = parent;
  }

  return null;
}
