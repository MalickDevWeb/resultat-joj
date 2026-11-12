import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Enregistrement du Service Worker PWA avec mise à jour automatique sans rafraîchissement manuel
if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // Nouvelle version déployée : application immédiate
      updateSW(true);
    },
    onRegistered(registration) {
      if (registration) {
        // 1. Vérifie s'il y a un nouveau déploiement toutes les 60 secondes en tâche de fond
        setInterval(() => {
          registration.update();
        }, 60 * 1000);

        // 2. Vérifie dès que l'utilisateur rouvre l'application ou revient sur l'onglet
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update();
          }
        });

        // 3. Vérifie dès que la connexion internet revient
        window.addEventListener('online', () => {
          registration.update();
        });
      }
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
