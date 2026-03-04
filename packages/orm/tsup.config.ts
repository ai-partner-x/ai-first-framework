import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: [
    '@mikro-orm/core',
    '@mikro-orm/sqlite',
    '@mikro-orm/postgresql',
    '@mikro-orm/mysql',
    'pg',
    'mysql2',
    'better-sqlite3',
  ],
});
