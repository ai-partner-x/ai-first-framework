import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProviderWrapper } from '@scaffold/shared-auth';
import App from './App';
import './app/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProviderWrapper>
      <App />
    </AuthProviderWrapper>
  </StrictMode>
);
