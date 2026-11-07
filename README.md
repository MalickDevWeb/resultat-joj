# Podium Dakar 2026 — résultats JOJ (PWA)

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

## 🎮 Démo (données simulées)

Tout fonctionne hors ligne, les données sont stockées dans le navigateur (`localStorage`).

- **Public** : résultats par site, détail des podiums, historique des versions, tableau des médailles.
- **Chef de site** : `admin123joj@gmail.com` / `joj1234` (compte de démo, vérifié côté client).
  - Publier un podium (provisoire) → Valider (officiel) → Rectifier avec motif (nouvelle version, l'ancienne reste visible).
  - « Réinitialiser la démo » restaure les données de départ.

## 🏅 Logos officiels JOJ

Déposez les fichiers officiels ici (sinon un logo texte de secours s'affiche) :

- `public/brand/joj-logo.png` : logo Dakar 2026 (format carré, fond blanc)
- `public/brand/mascotte.png` : mascotte (PNG à fond transparent)

> Node 18+ suffit pour le build ; Node 20+ recommandé.
