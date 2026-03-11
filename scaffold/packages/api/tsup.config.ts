import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  dts: false,
  clean: false,
  external: [/^@ai-partner-x\//, 'reflect-metadata', 'express', 'cors'],
});
