import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  outDir: 'dist',
  format: ['esm'],
  target: 'node20',
  sourcemap: true,
  clean: true,
  external: ['@ai-partner-x/*', 'reflect-metadata'],
});
