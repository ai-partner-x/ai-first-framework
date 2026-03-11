import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/server.ts'],
    format: ['esm'],
    dts: false,
    clean: false,
    external: [/^@ai-partner-x\//, 'reflect-metadata', 'express', 'cors'],
  },
  {
    // Compile app.config.ts → app.config.js into a dedicated build directory so that
    // production can load it via ConfigLoader.loadAsync() without a generated .js
    // file in the project root overriding the source app.config.ts during dev.
    entry: { 'app.config': 'app.config.ts' },
    format: ['esm'],
    dts: false,
    clean: false,
    outDir: 'dist/config',
    external: [/^@ai-partner-x\//, 'reflect-metadata'],
  },
]);
