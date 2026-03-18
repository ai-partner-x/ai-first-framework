import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  dts: false,
  clean: true,
  external: [/^@ai-partner-x\//, 'reflect-metadata', 'express', 'cors'],
  // Don't bundle to keep directory structure for Aiko Boot runtime discovery
  bundle: false,
  treeshake: false,
  // Keep TypeScript source files for runtime discovery
  splitting: false,
});
