import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { appAuth, defaultAuthProvider } from '@scaffold/core';
import App from './App';
import './app/globals.css';

const container = document.getElementById('root')!;
const root = createRoot(container);

appAuth.setup(defaultAuthProvider).then(() => {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
