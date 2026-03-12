import path from 'path';
import fs from 'fs-extra';

const COPY_IGNORE = [
  'node_modules',
  '.next',
  'dist',
  '.pnpm-store',
  '*.tsbuildinfo',
  '.vite',
  '*.log',
];

/** Paths to skip when withBaseSystem is false (relative to scaffold root). */
const SKIP_WHEN_BARE = [
  'packages/shared-auth',
  'packages/api/src/controller/auth.controller.ts',
  'packages/api/src/service/auth.service.ts',
  'packages/api/src/dto/auth.dto.ts',
  'packages/api/src/entity/user.entity.ts',
  'packages/api/src/mapper/user.mapper.ts',
  'packages/mobile/src/components/LoginForm.tsx',
  'packages/mobile/src/pages/LoginPage.tsx',
  'packages/mobile/src/routes/ProtectedRoute.tsx',
  'packages/admin/src/components/LoginForm.tsx',
];

const FRAMEWORK_SCOPE = '@ai-partner-x/';
/** Registry version for @ai-partner-x/*，发布到中央仓库后从此版本安装；本地开发通过 pnpm.overrides 覆盖 */
const FRAMEWORK_REGISTRY_VERSION = '^0.1.0';

/** 脚手架中可能用到的框架包名（scope 后缀），用于生成 overrides */
const FRAMEWORK_PACKAGE_NAMES = [
  'aiko-boot',
  'aiko-boot-codegen',
  'aiko-boot-starter-orm',
  'aiko-boot-starter-validation',
  'aiko-boot-starter-web',
  'aiko-boot-starter-storage',
] as const;

export type CreateOptions = {
  templateDir: string;
  targetDir: string;
  scope: string;
  withBaseSystem: boolean;
};

export async function createScaffold(options: CreateOptions): Promise<void> {
  const { templateDir, targetDir, scope, withBaseSystem } = options;
  const frameworkRoot = path.dirname(templateDir);

  if (!(await fs.pathExists(templateDir))) {
    throw new Error(`Template directory not found: ${templateDir}. Run from ai-frist-framework root (scaffold/ must exist).`);
  }

  if (await fs.pathExists(targetDir)) {
    const files = await fs.readdir(targetDir);
    if (files.length > 0) {
      throw new Error(`Target directory already exists and is not empty: ${targetDir}`);
    }
  }

  await fs.ensureDir(targetDir);
  await copyRecursive(templateDir, templateDir, targetDir, withBaseSystem);
  await replaceScopeInFiles(targetDir, scope);

  // 依赖写 registry 版本，便于将来从中央仓库安装；本地开发通过根目录 pnpm.overrides 覆盖
  await replaceFrameworkDepsWithRegistryVersion(targetDir);
  await addFrameworkOverridesInRoot(targetDir, frameworkRoot);

  // 使生成的项目成为独立 pnpm workspace，在项目目录内执行 pnpm 时不会回溯到父仓库
  await fs.writeFile(
    path.join(targetDir, 'pnpm-workspace.yaml'),
    `packages:
  - 'packages/*'
`,
    'utf-8'
  );

  if (!withBaseSystem) {
    await writeBareTemplates(targetDir, scope);
  }

  // 再次替换，确保子包中 @ai-partner-x/* 均为 registry 版本（与根 pnpm.overrides 配合）
  await replaceFrameworkDepsWithRegistryVersion(targetDir);
}

/** 将各 package.json 中 @ai-partner-x/* 的 workspace: 协议改为 registry 版本（如 ^0.1.0），与根目录 pnpm.overrides 配合使用 */
async function replaceFrameworkDepsWithRegistryVersion(targetDir: string): Promise<void> {
  const packageJsonPaths: string[] = [];
  async function collect(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.name === 'package.json') {
        packageJsonPaths.push(full);
      } else if (e.isDirectory() && e.name !== 'node_modules' && !e.name.startsWith('.')) {
        await collect(full);
      }
    }
  }
  await collect(targetDir);

  for (const pkgPath of packageJsonPaths) {
    const pkg = await fs.readJson(pkgPath);
    let changed = false;
    for (const key of ['dependencies', 'devDependencies'] as const) {
      if (!pkg[key]) continue;
      for (const [name, value] of Object.entries(pkg[key])) {
        const isWorkspaceProtocol =
          typeof value === 'string' && (value === 'workspace:*' || value.startsWith('workspace:'));
        if (name.startsWith(FRAMEWORK_SCOPE) && isWorkspaceProtocol) {
          (pkg[key] as Record<string, string>)[name] = FRAMEWORK_REGISTRY_VERSION;
          changed = true;
        }
      }
    }
    if (changed) await fs.writeJson(pkgPath, pkg, { spaces: 2 });
  }
}

/** 在根 package.json 中增加 pnpm.overrides，指向本地框架路径；需要从中央仓库安装时删除该段即可 */
async function addFrameworkOverridesInRoot(targetDir: string, frameworkRoot: string): Promise<void> {
  const rootPkgPath = path.join(targetDir, 'package.json');
  const rootPkg = await fs.readJson(rootPkgPath);
  const relativeToFramework = path.relative(targetDir, frameworkRoot).replace(/\\/g, '/');
  const filePrefix = relativeToFramework.startsWith('.') ? relativeToFramework : `./${relativeToFramework}`;

  const overrides: Record<string, string> = {};
  for (const pkgName of FRAMEWORK_PACKAGE_NAMES) {
    overrides[`${FRAMEWORK_SCOPE}${pkgName}`] = `file:${filePrefix}/packages/${pkgName}`;
  }
  rootPkg.pnpm = { ...rootPkg.pnpm, overrides };
  await fs.writeJson(rootPkgPath, rootPkg, { spaces: 2 });
}

function shouldIgnore(name: string): boolean {
  if (COPY_IGNORE.some((x) => x.startsWith('*') && name.endsWith(x.slice(1)))) return true;
  if (COPY_IGNORE.includes(name)) return true;
  return false;
}

function shouldSkipWhenBare(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, '/');
  return SKIP_WHEN_BARE.some((skip) => normalized === skip || normalized.startsWith(skip + '/'));
}

async function copyRecursive(
  templateRoot: string,
  src: string,
  dest: string,
  withBaseSystem: boolean
): Promise<void> {
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    const relativePath = path.relative(templateRoot, srcPath).replace(/\\/g, '/');

    if (shouldIgnore(entry.name)) continue;
    if (!withBaseSystem && shouldSkipWhenBare(relativePath)) continue;

    if (entry.isDirectory()) {
      await fs.ensureDir(destPath);
      await copyRecursive(templateRoot, srcPath, destPath, withBaseSystem);
    } else {
      await fs.copy(srcPath, destPath);
    }
  }
}

async function replaceScopeInFiles(dir: string, scope: string): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !shouldIgnore(entry.name)) {
      await replaceScopeInFiles(full, scope);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.mjs', '.cjs', '.css', '.html'].includes(ext)) continue;
      let content = await fs.readFile(full, 'utf-8');
      const before = content;
      content = content.replace(/@scaffold\//g, `@${scope}/`);
      content = content.replace(/"@scaffold\//g, `"@${scope}/`);
      content = content.replace(/scaffold-monorepo/g, `${scope}-monorepo`);
      content = content.replace(/--filter "@scaffold\/\*"/g, `--filter "@${scope}/*"`);
      content = content.replace(/-F @scaffold\//g, `-F @${scope}/`);
      if (content !== before) await fs.writeFile(full, content, 'utf-8');
    }
  }
}

/** Write bare (no auth) template files when withBaseSystem is false. */
async function writeBareTemplates(targetDir: string, scope: string): Promise<void> {
  const packagesDir = path.join(targetDir, 'packages');

  await fs.writeFile(
    path.join(packagesDir, 'api/src/scripts/init-db.ts'),
    `/**
 * Initialize SQLite database (bare scaffold, no user table).
 */
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
// @ts-expect-error sql.js has no types
import initSqlJs from 'sql.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../data/app.db');

console.log('📁 Database path:', dbPath);

const SQL = await initSqlJs();
const db = new SQL.Database();

// Add your tables here when needed.

const data = db.export();
db.close();

const dir = dirname(dbPath);
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}
writeFileSync(dbPath, Buffer.from(data));

console.log('\\n🎉 Database initialization complete!');
`,
    'utf-8'
  );

  await fs.writeFile(
    path.join(packagesDir, 'shared/src/constants.ts'),
    `/** API base URL env key (admin: VITE_API_URL, mobile: etc.) */
export const API_BASE_URL_KEY = 'API_URL';

/** Default API base URL */
export const DEFAULT_API_BASE_URL = 'http://localhost:3001';
`,
    'utf-8'
  );

  await fs.writeFile(
    path.join(packagesDir, 'shared/src/index.ts'),
    `export {
  API_BASE_URL_KEY,
  DEFAULT_API_BASE_URL,
} from './constants';
`,
    'utf-8'
  );

  const mobileMain = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './app/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
`;
  await fs.writeFile(path.join(packagesDir, 'mobile/src/main.tsx'), mobileMain, 'utf-8');

  const mobileRoutesIndex = `import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { ROUTES } from './routes';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
`;
  await fs.writeFile(path.join(packagesDir, 'mobile/src/routes/index.tsx'), mobileRoutesIndex, 'utf-8');

  await fs.writeFile(
    path.join(packagesDir, 'mobile/src/routes/routes.ts'),
    `export const ROUTES = {
  HOME: '/',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
`,
    'utf-8'
  );

  const homePage = `/**
 * Mobile home page (bare scaffold).
 */
export function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 safe-area-top">
        <span className="text-lg font-medium text-gray-800">AIKO-BOOT</span>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">AIKO-BOOT</h1>
        <p className="text-gray-500 text-sm">Scaffold ready. Add your pages.</p>
      </main>
    </div>
  );
}
`;
  await fs.writeFile(path.join(packagesDir, 'mobile/src/pages/HomePage.tsx'), homePage, 'utf-8');

  await fs.writeFile(
    path.join(packagesDir, 'mobile/src/pages/index.ts'),
    `export { HomePage } from './HomePage';
`,
    'utf-8'
  );

  const adminMain = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
`;
  await fs.writeFile(path.join(packagesDir, 'admin/src/main.tsx'), adminMain, 'utf-8');

  const adminApp = `export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <p className="text-gray-600">Scaffold Admin — add your pages.</p>
    </div>
  );
}
`;
  await fs.writeFile(path.join(packagesDir, 'admin/src/App.tsx'), adminApp, 'utf-8');

  const sharedAuthPkg = `@${scope}/shared-auth`;
  const mobilePkgPath = path.join(packagesDir, 'mobile/package.json');
  const mobilePkg = await fs.readJson(mobilePkgPath);
  if (mobilePkg.dependencies) {
    delete mobilePkg.dependencies[sharedAuthPkg];
    mobilePkg.dependencies = Object.fromEntries(
      Object.entries(mobilePkg.dependencies).filter(([k]) => k !== sharedAuthPkg)
    );
  }
  await fs.writeJson(mobilePkgPath, mobilePkg, { spaces: 2 });

  const adminPkgPath = path.join(packagesDir, 'admin/package.json');
  const adminPkg = await fs.readJson(adminPkgPath);
  if (adminPkg.dependencies) {
    delete adminPkg.dependencies[sharedAuthPkg];
    adminPkg.dependencies = Object.fromEntries(
      Object.entries(adminPkg.dependencies).filter(([k]) => k !== sharedAuthPkg)
    );
  }
  await fs.writeJson(adminPkgPath, adminPkg, { spaces: 2 });

  const mobileVitePath = path.join(packagesDir, 'mobile/vite.config.ts');
  if (await fs.pathExists(mobileVitePath)) {
    let viteContent = await fs.readFile(mobileVitePath, 'utf-8');
    viteContent = viteContent.replace(/\s*exclude:\s*\[\s*'@[^']+\/shared-auth'\s*\],?\s*/g, '\n');
    await fs.writeFile(mobileVitePath, viteContent, 'utf-8');
  }
}
