import { createRoot } from 'react-dom/client';
import App from './app/App';
import './i18n';
import { Capacitor } from '@capacitor/core';
import i18n from './i18n';

// Register service worker for PWA capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {
      // Service worker registration failed
    });
  });
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <App />
  );
}