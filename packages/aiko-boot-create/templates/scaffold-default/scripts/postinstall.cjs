#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

function shouldSkip() {
  if (process.env.SKIP_SQLITE_REBUILD === 'true') {
    console.log('[postinstall] SKIP_SQLITE_REBUILD=true, skipping better-sqlite3 rebuild.');
    return true;
  }
  if (process.env.CI === 'true') {
    console.log('[postinstall] CI environment detected, skipping better-sqlite3 rebuild.');
    return true;
  }
  return false;
}

function main() {
  if (shouldSkip()) {
    return;
  }

  const pkgManager = process.env.npm_execpath || 'pnpm';
  console.log('[postinstall] Rebuilding better-sqlite3 via', pkgManager);

  const result = spawnSync(
    pkgManager,
    ['rebuild', 'better-sqlite3'],
    { stdio: 'inherit', shell: false }
  );

  if (result.error) {
    console.warn('[postinstall] better-sqlite3 rebuild errored but is non-fatal:', result.error);
    return;
  }

  if (result.status !== 0) {
    console.warn('[postinstall] better-sqlite3 rebuild exited with code', result.status, '(treated as non-fatal).');
  }
}

main();

