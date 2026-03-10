import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  dts: false,
  clean: true,
  external: [/^@ai-partner-x\//, 'reflect-metadata', 'express', 'cors'],
});
