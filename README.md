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

## 🏟️ Résultats réels (Wikipédia)

Les résultats viennent de Wikipédia (pages « <Sport> at the 2026 Summer Youth Olympics », licence CC BY-SA 4.0) :

```bash
npm run import:wiki   # met à jour src/resultats.json, puis npm run build
```

- 25 sports, 151 épreuves : podiums renseignés = « Officiel », les autres = « À venir ».
- Sites et lieux réels (Dakar, Diamniadio, Saly), noms de pays en français, ex aequo et doubles bronzes gérés.
- Un nouvel import remplace les données, mais garde les podiums publiés ou rectifiés par un chef de site.
- Wikipédia ne donne ni les heures ni les épreuves en cours : rien n'est affiché « en direct ».

## 🎮 Démo

Tout fonctionne hors ligne, les données sont stockées dans le navigateur (`localStorage`).

- **Public** : résultats par site, détail des podiums, historique des versions, tableau des médailles.
- **Chef de site** : `admin123joj@gmail.com` / `joj1234` (compte de démo, vérifié côté client).
  - Publier un podium (provisoire) → Valider (officiel) → Rectifier avec motif (nouvelle version, l'ancienne reste visible).
  - « Réinitialiser la démo » restaure les données de départ.

## 🏅 Logos officiels JOJ

Déposez les fichiers officiels ici (sinon un logo texte de secours s'affiche) :

- `public/brand/joj-logo.png` : logo JOJ Dakar 2026 (PNG à fond transparent)
- `public/brand/hero.jpg` : photo de fond de l'accueil (paysage, ~1920×1280)

> Node 18+ suffit pour le build ; Node 20+ recommandé.
