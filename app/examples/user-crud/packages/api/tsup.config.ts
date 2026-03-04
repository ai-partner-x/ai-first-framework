import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  dts: false,
  clean: false,
  external: [/^@ai-first\//, 'reflect-metadata', 'pg', 'express', 'cors'],
});
