/**
 * API Server - aiko-boot
 */
import { createApp } from '@ai-partner-x/aiko-boot';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = await createApp({ srcDir: __dirname });
await app.run();
const port = app.config.get<number>('server.port', 3001);
console.log(`\n📡 API: http://localhost:${port}/api\n`);
