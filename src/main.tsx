import { createRoot } from 'react-dom/client';
import App from './app/App';
import './styles/index.css';
import './i18n/config';
import { Capacitor } from '@capacitor/core';

// Register service worker for PWA capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {
      // Service worker registration failed
    });
  });
}

// Ensure background fills the full viewport before React mounts
const isDarkMode = document.documentElement.classList.contains('dark') ||
  window.matchMedia('(prefers-color-scheme: dark)').matches;
const bg = isDarkMode ? '#111113' : '#f1f1f1';
document.documentElement.style.cssText += `min-height:100dvh;background-color:${bg};`;
document.body.style.cssText += `min-height:100dvh;background-color:${bg};`;

const rootElement = document.getElementById('root');
if (rootElement) {
  rootElement.style.cssText += `min-height:100dvh;background-color:${bg};`;
  createRoot(rootElement).render(
    <App />
  );
}