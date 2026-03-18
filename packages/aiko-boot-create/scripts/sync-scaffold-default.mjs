import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(argv) {
  return {
    dryRun: argv.includes('--dry-run') || argv.includes('-n'),
    verbose: argv.includes('--verbose') || argv.includes('-v'),
  };
}

function logCopyPlan({ src, dest, dryRun }) {
  const prefix = dryRun ? '[dry-run] ' : '';
  // eslint-disable-next-line no-console
  console.log(`${prefix}sync scaffold-default template`);
  // eslint-disable-next-line no-console
  console.log(`${prefix}  from: ${src}`);
  // eslint-disable-next-line no-console
  console.log(`${prefix}  to:   ${dest}`);
}

function normalizeLf(s) {
  return s.replace(/\r\n/g, '\n');
}

async function syncScaffoldDefault({ dryRun, verbose }) {
  const packageDir = path.resolve(__dirname, '..');
  const repoRoot = path.resolve(packageDir, '../..');

  const scaffoldDir = path.join(repoRoot, 'scaffold');
  const templateDir = path.join(packageDir, 'templates', 'scaffold-default');

  if (!(await fs.pathExists(scaffoldDir))) {
    throw new Error(`scaffold directory not found: ${scaffoldDir}`);
  }
  if (!(await fs.pathExists(templateDir))) {
    throw new Error(`template directory not found: ${templateDir}`);
  }

  logCopyPlan({ src: scaffoldDir, dest: templateDir, dryRun });

  // We intentionally do NOT copy:
  // - scaffold/node_modules, scaffold/pnpm-lock.yaml (dev artifacts)
  // - scaffold/pnpm-workspace.yaml (scaffold uses workspace back-references for monorepo dev)
  // - scaffold/docs, scaffold/examples (not needed for create template)
  //
  // What we DO sync:
  // - scaffold/packages  -> templates/scaffold-default/packages
  // - scaffold/scripts   -> templates/scaffold-default/scripts
  // - scaffold/package.json, scaffold/README.md
  const tasks = [
    {
      kind: 'dir',
      src: path.join(scaffoldDir, 'packages'),
      dest: path.join(templateDir, 'packages'),
    },
    {
      kind: 'dir',
      src: path.join(scaffoldDir, 'scripts'),
      dest: path.join(templateDir, 'scripts'),
    },
    {
      kind: 'file',
      src: path.join(scaffoldDir, 'package.json'),
      dest: path.join(templateDir, 'package.json'),
    },
    {
      kind: 'file',
      src: path.join(scaffoldDir, 'README.md'),
      dest: path.join(templateDir, 'README.md'),
    },
  ];

  for (const t of tasks) {
    if (!(await fs.pathExists(t.src))) {
      throw new Error(`source not found: ${t.src}`);
    }
  }

  if (dryRun) {
    // eslint-disable-next-line no-console
    console.log('[dry-run] will overwrite: packages/, scripts/, package.json, README.md');
    return;
  }

  // Mirror directories by removing destination first, then copying.
  for (const t of tasks) {
    if (t.kind === 'dir') {
      if (verbose) {
        // eslint-disable-next-line no-console
        console.log(`sync dir: ${path.relative(packageDir, t.dest)}`);
      }
      await fs.remove(t.dest);
      await fs.copy(t.src, t.dest, {
        filter: (src) => {
          const name = path.basename(src);
          if (name === 'node_modules') return false;
          if (name === 'dist') return false;
          if (name === '.next') return false;
          if (name === '.pnpm-store') return false;
          if (name.endsWith('.log')) return false;
          return true;
        },
      });
    } else {
      if (verbose) {
        // eslint-disable-next-line no-console
        console.log(`sync file: ${path.relative(packageDir, t.dest)}`);
      }
      await fs.copy(t.src, t.dest, { overwrite: true });
    }
  }

  // Post-process template README: scaffold repo README contains `cd scaffold`, but generated project root is arbitrary.
  const readmePath = path.join(templateDir, 'README.md');
  if (await fs.pathExists(readmePath)) {
    const raw = await fs.readFile(readmePath, 'utf-8');
    const content = normalizeLf(raw)
      .replace(/\ncd scaffold\n/g, '\ncd <your-project>\n')
      .replace(/\ncd scaffold && /g, '\ncd <your-project> && ')
      .replace(/scaffold\/\n/g, '<your-project>/\n')
      .replace(/\nscaffold\/\n/g, '\n<your-project>/\n');
    await fs.writeFile(readmePath, content, 'utf-8');
  }
}

const { dryRun, verbose } = parseArgs(process.argv.slice(2));
syncScaffoldDefault({ dryRun, verbose }).catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});

