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
    // Compile app.config.ts → app.config.js in the project root so that
    // `node dist/server.js` (production) can load it via ConfigLoader.loadAsync().
    // ConfigLoader looks for config files in join(srcDir, '..'), which resolves to
    // the project root when srcDir = __dirname (= dist/). Outputting to '.' places
    // app.config.js alongside app.config.ts so both dev (SWC loads .ts) and
    // production (Node loads .js) work without any changes to server.ts.
    entry: { 'app.config': 'app.config.ts' },
    format: ['esm'],
    dts: false,
    clean: false,
    outDir: '.',
    external: [/^@ai-partner-x\//, 'reflect-metadata'],
  },
]);
