import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Enregistrement du Service Worker PWA
if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onRegistered(registration) {
      console.log('[PWA] Service Worker enregistré avec succès :', registration);
    },
    onRegisterError(error) {
      console.error('[PWA] Erreur lors de l\'enregistrement du Service Worker :', error);
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
