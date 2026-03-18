import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3002,
  },
  optimizeDeps: {
    // workspace package exports can change frequently during development;
    // excluding avoids stale pre-bundled output missing new named exports.
    exclude: ['@scaffold/core'],
  },
});
