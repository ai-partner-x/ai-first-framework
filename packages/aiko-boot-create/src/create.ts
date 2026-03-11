import { program } from 'commander';
import * as readline from 'readline';
import path from 'path';
import fs from 'fs-extra';
import { createScaffold } from './scaffold.js';

const SCAFFOLD_DIR_NAME = 'scaffold';

function getTemplateDir(cwd: string): string {
  return path.join(cwd, SCAFFOLD_DIR_NAME);
}

function prompt(question: string, defaultValue?: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    const suffix = defaultValue !== undefined ? ` (${defaultValue})` : '';
    rl.question(`${question}${suffix}: `, (answer) => {
      rl.close();
      resolve((answer.trim() || (defaultValue ?? '')).trim());
    });
  });
}

function promptConfirm(question: string, defaultValue: boolean): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const hint = defaultValue ? 'Y/n' : 'y/N';
  return new Promise((resolve) => {
    rl.question(`${question} [${hint}]: `, (answer) => {
      rl.close();
      const lower = answer.trim().toLowerCase();
      if (lower === '') resolve(defaultValue);
      else resolve(lower === 'y' || lower === 'yes');
    });
  });
}

/** Normalize project name to valid npm scope (lowercase, no spaces). */
function toScope(name: string): string {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'my-app';
}

const RESERVED_SCOPES = new Set([
  'node',
  'npm',
  'js',
  'javascript',
  'typescript',
  'react',
  'vue',
  'angular',
  'core',
  'admin',
  'root',
  'system',
]);

function assertValidScope(scope: string): void {
  if (!scope) {
    console.error('Invalid scope: empty value. Please provide a non-empty project name.');
    process.exit(1);
  }

  if (RESERVED_SCOPES.has(scope)) {
    console.error(`Invalid scope "${scope}": this name is reserved. Please choose a different project name.`);
    process.exit(1);
  }
}

/** Show destination default as relative path when under cwd (e.g. "./my-app"). */
function defaultDirDisplay(cwd: string, absoluteDir: string): string {
  const relative = path.relative(cwd, absoluteDir);
  if (relative && !relative.startsWith('..') && relative !== absoluteDir) {
    return relative.startsWith('.') ? relative : `./${relative}`;
  }
  return absoluteDir;
}

export function createCommand(): void {
  program
    .name('aiko-boot-create')
    .description('Create a new aiko-boot scaffold project (monorepo: api, admin, mobile, shared)')
    .version('0.1.0')
    .argument('[projectNameOrPath]', 'Project name or path (e.g. my-app or ./my-app; default: prompt)')
    .option('-n, --name <name>', 'Project name (folder + npm scope, e.g. my-app)')
    .option('--with-base-system', 'Include base system: login, shared-auth, user/menu management later')
    .option('--no-base-system', 'Bare project without login/auth (default when not specified)')
    .option('--template-dir <dir>', 'Path to scaffold template (default: <cwd>/scaffold)')
    .action(async (targetDirArg: string | undefined, options: { name?: string; withBaseSystem?: boolean; baseSystem?: boolean; templateDir?: string }) => {
      const cwd = process.cwd();
      let projectName = options.name;
      let withBaseSystem: boolean;
      let targetDir: string;
      const templateDir = options.templateDir
        ? path.resolve(cwd, options.templateDir)
        : getTemplateDir(cwd);

      if (!projectName || !targetDirArg) {
        console.log('\n aiko-boot-create\n');
        const defaultDir = targetDirArg
          ? path.resolve(cwd, targetDirArg)
          : path.join(cwd, projectName ? toScope(projectName) : 'my-app');
        if (!projectName) {
          const defaultName = targetDirArg ? path.basename(path.resolve(cwd, targetDirArg)) : 'my-app';
          projectName = await prompt('Project name (e.g. my-app)', defaultName);
          if (!projectName) {
            console.error('Project name is required.');
            process.exit(1);
          }
        }
        if (!targetDirArg) {
          const dirPromptDefault = defaultDirDisplay(cwd, defaultDir);
          const dirAnswer = await prompt('Destination (folder path for the project)', dirPromptDefault);
          targetDir = path.resolve(cwd, dirAnswer || defaultDir);
        } else {
          targetDir = path.resolve(cwd, targetDirArg);
        }
        if (options.withBaseSystem === true) withBaseSystem = true;
        else if (options.baseSystem === false) withBaseSystem = false;
        else {
          withBaseSystem = await promptConfirm('Include base system (login, shared-auth, user/menu management)?', false);
        }
      } else {
        projectName = projectName.trim();
        targetDir = path.resolve(cwd, targetDirArg);
        // --with-base-system -> true; --no-base-system -> baseSystem false; neither -> default bare (false)
        withBaseSystem = options.baseSystem === false ? false : options.withBaseSystem === true;
      }

      const scope = toScope(projectName);
      assertValidScope(scope);

      // If target dir exists and is not empty, create project in a subdir named after scope
      if (await fs.pathExists(targetDir)) {
        const files = await fs.readdir(targetDir);
        if (files.length > 0) {
          const subDir = path.join(targetDir, scope);
          console.log(`\nDestination is not empty; creating project in: ${subDir}`);
          targetDir = subDir;
        }
      }

      console.log('\nOptions:');
      console.log('  Destination:', targetDir);
      console.log('  Scope:', scope, `(@${scope}/*)`);
      console.log('  With base system:', withBaseSystem);
      console.log('  Template:', templateDir);

      try {
        await createScaffold({
          templateDir,
          targetDir,
          scope,
          withBaseSystem,
        });
        console.log('\nDone. Next steps:');
        console.log(`  cd ${targetDir}`);
        console.log('  pnpm install');
        if (withBaseSystem) {
          console.log('  pnpm init-db   # first time');
          console.log('  pnpm run rebuild:sqlite   # if api fails with "bindings file", build better-sqlite3 native');
        }
        console.log('  pnpm dev');
        console.log('\n  # @ai-partner-x/* use local path via pnpm.overrides; remove that block to use from registry.');
      } catch (err) {
        console.error(err);
        process.exit(1);
      }
    });

  program.parse();
}
