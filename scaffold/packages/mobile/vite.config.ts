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
    include: ['@scaffold/api/client', '@scaffold/shared'],
    exclude: ['@scaffold/shared-auth'],
  },
});
