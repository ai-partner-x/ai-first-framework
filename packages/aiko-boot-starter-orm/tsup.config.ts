import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  clean: true,
  sourcemap: true,
  noExternal: ['reflect-metadata'],
  external: [
    '@mikro-orm/core',
    '@mikro-orm/sqlite',
    '@mikro-orm/postgresql',
    '@mikro-orm/mysql',
    'mysql2',
    'pg',
    'pg-types'
  ],
});
