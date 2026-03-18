import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { appAuth, createBackendAuthProvider } from '@scaffold/core';
import App from './App';
import './app/globals.css';

const container = document.getElementById('root')!;
const root = createRoot(container);

// Mobile 默认不配置 env 时，约定后端 API 在 scaffold/api 的默认端口 3001
const apiBaseUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

appAuth.setup(createBackendAuthProvider(apiBaseUrl, { loginUrl: '/login' })).then(() => {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
