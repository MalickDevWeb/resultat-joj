# CLAUDE.md

Podium Dakar 2026 : une PWA React + Vite qui affiche les vrais résultats des JOJ Dakar 2026 (Wikipédia), le tableau des médailles et les épreuves en direct (programme officiel, via la fonction Vercel `api/live.js`). Déployée sur Vercel. Présentation et commandes : `README.md`.

## Méthodologie

- Toute fonctionnalité part du PRD (`specs/prd-podium-dakar.md`) : une tranche, une spec `specs/NNN-nom/spec.md`, des scénarios `AS1`, `AS2`…
- Une nouvelle idée va d'abord dans le PRD ; la spec ne réalise que sa tranche.
- Un test d'abord, vu en échec, puis le code minimal. Chaque scénario a un test dont le titre commence par son identifiant : `it('003-AS1: an event whose status is "Running" is live')`.
- Rien n'est fini tant que `npm run check` n'est pas vert (types, tests, build).

## Architecture

- `src/wikipedia.mjs` lit Wikipédia ; il sert au navigateur et à `scripts/import-wikipedia.mjs`. Toutes les pages en une seule requête.
- `api/live.js` est la seule partie serveur : le site officiel ne se lit pas depuis le navigateur. En développement, `vite.config.ts` la sert sur `/api/live`.
- Les règles de calcul sont des fonctions pures, testées sans navigateur : `parseSport`, `buildResultats`, `medalTable`, `parseSchedule`, `merge`.
- Les écrans (`src/components/`) affichent, ils ne calculent pas. Le design ne change pas sans demande explicite.

## Concepts appréciés

- Typage strict : pas de `any`, pas de `as` pour faire taire le compilateur.
- Des fonctions courtes, et des noms qui disent le métier : podium, épreuve, site, chef de site.
- Une source indisponible ne casse jamais l'application : on garde les dernières données et on réessaie.

## Bonnes pratiques

- Les tests n'appellent jamais le réseau : `fetch` est remplacé (`vi.stubGlobal`), et les pages réelles sont des extraits dans `tests/fixtures/`.
- Aucun secret dans le code. Le compte du chef de site est un compte de démonstration.
- Un message d'erreur montré à l'utilisateur est une phrase claire en français, jamais un code technique.
- On respecte les sources : une requête Wikipédia par mise à jour, au plus une lecture du site officiel par minute (cache Vercel).

## Nommage

- Textes de l'interface, specs et commentaires en français ; titres de tests en anglais, préfixés par le scénario.
- Fichiers de tests : `tests/NNN-nom.test.ts`, un par spec.
- Commits Conventional Commits qui citent la spec : `feat(live): show live events from the official schedule (003-AS1)`.
