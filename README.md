# Starter Template PWA (Progressive Web App)

Ce projet est un socle minimaliste et prêt à l'emploi configuré avec **Vite**, **React**, et **vite-plugin-pwa**.

## 📦 Ce qui est inclus

- **Vite + React 19 + TypeScript**
- **Configuration PWA complète** :
  - `public/manifest.json` : Déclaration de l'application (standalone, icônes 192px et 512px, thème).
  - `src/sw.ts` : Service Worker avec Workbox (pré-caching automatique, cache statique et navigation).
  - `vite.config.ts` : Plugin `vite-plugin-pwa` avec stratégie `injectManifest`.
  - `src/hooks/usePWAInstall.ts` : Hook pour gérer l'installation PWA et la compatibilité iOS.
- **Sauvegarde** : Les fichiers d'origine de l'application UNFPA ont été archivés dans `backup_unfpa_original.tar.gz`.

## 🚀 Démarrage

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement
npm run dev

# 3. Compiler pour la production
npm run build
```
