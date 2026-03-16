#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

function main() {
  const pkgManager = process.env.npm_execpath || 'pnpm';

  const result = spawnSync(
    pkgManager,
    ['rebuild', 'better-sqlite3'],
    { stdio: 'inherit', shell: false }
  );

  if (result.error) {
    console.error('[rebuild-sqlite] Failed to start rebuild:', result.error);
    process.exit(1);
  }

  process.exit(result.status ?? 0);
}

main();

