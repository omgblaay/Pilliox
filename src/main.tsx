import './styles/index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Import i18n config FIRST to initialize before components load
import i18n from './i18n/config';

// Import App component
import App from './app/App';

// Log platform info
console.log('Platform:', Capacitor.getPlatform());
console.log('Is native:', Capacitor.isNativePlatform());
console.log('i18n initialized:', i18n.isInitialized);

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
    <StrictMode>
      <App />
    </StrictMode>
  );
}
