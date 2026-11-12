# CLAUDE.md

Podium Dakar 2026 : une PWA React + Vite qui affiche les vrais résultats des JOJ Dakar 2026 (Wikipédia), le tableau des médailles et les épreuves en direct (programme officiel, via la fonction Vercel `api/live.js`). Déployée sur Vercel. Présentation et commandes : `README.md`.

## Méthodologie

- Toute fonctionnalité part du PRD (`specs/prd-podium-dakar.md`) : une tranche, une spec `specs/NNN-nom/spec.md`, des scénarios `AS1`, `AS2`…
- Une nouvelle idée va d'abord dans le PRD ; la spec ne réalise que sa tranche.
- Un test d'abord, vu en échec, puis le code minimal. Chaque scénario a un test dont le titre commence par son identifiant : `it('003-AS1: an event whose status is "Running" is live')`.
- Rien n'est fini tant que `npm run check` n'est pas vert (types, tests, build).

## Architecture

- `src/wikipedia.mjs` lit Wikipédia ; il sert au navigateur et à `scripts/import-wikipedia.mjs`. Toutes les pages en une seule requête.
- `api/` contient les seules parties serveur (fonctions Vercel) : `live.js` lit le site officiel, qui ne se lit pas depuis le navigateur ; `resume.ts` fait rédiger le résumé du jour par Claude. En développement, `vite.config.ts` les sert sur `/api/...`.
- Claude est derrière une dépendance injectée (`rediger` dans `creerGestionnaire`) : les tests passent un faux, seul l'export par défaut utilise le SDK. Modèle `claude-opus-5-5`, réponse JSON validée par Zod.
- Les règles de calcul sont des fonctions pures, testées sans navigateur : `parseSport`, `buildResultats`, `medalTable`, `parseSchedule`, `merge`, `finalesDuJour`.
- Les écrans (`src/components/`) affichent, ils ne calculent pas. Le design ne change pas sans demande explicite.

## Concepts appréciés

- Typage strict : pas de `any`, pas de `as` pour faire taire le compilateur.
- Des fonctions courtes, et des noms qui disent le métier : podium, épreuve, site, chef de site.
- Une source indisponible ne casse jamais l'application : on garde les dernières données et on réessaie.

## Bonnes pratiques

- Les tests n'appellent jamais le réseau : `fetch` est remplacé (`vi.stubGlobal`), et les pages réelles sont des extraits dans `tests/fixtures/`.
- Aucun secret dans le code : `ANTHROPIC_API_KEY` vient des variables d'environnement de Vercel. Le compte du chef de site est un compte de démonstration.
- Claude ne reçoit jamais un texte venu d'une requête : seulement des données officielles lues côté serveur. Toute entrée d'une fonction `api/` est validée, et ses refus ont un code stable en majuscules (`JOUR_INVALIDE`).
- Les en-têtes de sécurité (CSP, HSTS…) sont dans `vercel.json` : une nouvelle source externe doit y être ajoutée explicitement.
- Un message d'erreur montré à l'utilisateur est une phrase claire en français, jamais un code technique.
- On respecte les sources : une requête Wikipédia par mise à jour, au plus une lecture du site officiel par minute (cache Vercel).

## Nommage

- Textes de l'interface, specs et commentaires en français ; titres de tests en anglais, préfixés par le scénario.
- Fichiers de tests : `tests/NNN-nom.test.ts`, un par spec.
- Commits Conventional Commits qui citent la spec : `feat(live): show live events from the official schedule (003-AS1)`.
