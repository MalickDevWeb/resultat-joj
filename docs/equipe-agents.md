# L'équipe d'agents Claude Code de Podium Dakar

Podium Dakar se construit avec cinq agents Claude Code, définis dans `.claude/agents/`. Chacun a un métier, un périmètre de fichiers qu'il est seul à modifier, et les garde-fous du projet (`CLAUDE.md`) : spec d'abord, test d'abord, aucune clé dans le code, aucun texte du visiteur envoyé à Claude.

## Pourquoi une équipe

- **Un métier, un périmètre.** Le designer n'écrit pas de code, le backend ne touche pas aux écrans, le frontend ne touche pas au serveur. Un fichier modifié hors périmètre se repère tout de suite.
- **Celui qui produit ne valide pas.** Deux agents ne font que lire : le `relecteur` juge si la spec est tenue, le `securite` cherche les failles. Ils partent d'un contexte vierge, sans l'avis de l'auteur.
- **Des relais écrits.** La note de design fixe les textes et les états de l'écran ; le backend rend le contrat de l'API ; le frontend s'appuie sur les deux. Chaque passage de relais est un fichier ou un rapport, relu par un humain.

## Qui fait quoi

| Agent | Métier | Seul à modifier | Il rend |
| --- | --- | --- | --- |
| `ux-design` | Designer UX/UI | les notes `design/*.md` | la note de design de l'écran : parcours, structure, textes exacts, états, accessibilité |
| `backend` | Développeur serveur et données | `api/`, `src/wikipedia.mjs`, `scripts/`, `vercel.json` | les tâches serveur, test d'abord, un commit chacune, et le contrat de l'API |
| `frontend` | Développeur écrans | `src/components/`, `src/hooks/`, `src/index.css`, `src/sw.ts`, `public/` | les tâches écran, test d'abord, fidèles à la note de design et au design existant |
| `relecteur` | Relecteur indépendant | rien | le verdict `Converged`, ou les écarts bloquants avec preuve |
| `securite` | Auditeur sécurité | rien | les failles classées par gravité, chacune avec sa preuve et sa correction |

## Le déroulé d'une tranche

```
PRD (specs/prd-podium-dakar.md) ── une tranche
   └─ spec (specs/NNN-nom/spec.md) ── l'humain la valide
        ├─ 1. ux-design → design/NNN-nom.md         l'humain relit la note
        ├─ 2. backend   → api/, tests/NNN-nom        un commit par tâche, contrat de l'API
        ├─ 3. frontend  → src/components, src/hooks  un commit par tâche
        ├─ 4. securite  → rapport de failles         avant de pousser une route ou un en-tête
        └─ 5. relecteur → Converged, ou retour en 2 ou 3
```

L'ordre compte : une API d'abord, un écran ensuite, et pas d'écran sans sa note de design. La spec 005 (résumé du jour par Claude) a été construite et durcie ainsi : la relecture indépendante y a trouvé un contournement du cache qui aurait pu vider les crédits de l'API, corrigé test d'abord.

## Les lancer

Dans Claude Code, à la racine du dépôt :

```
Utilise l'agent ux-design pour specs/006-nom.
Utilise l'agent backend pour specs/006-nom, tâches T01 à T03.
Utilise l'agent frontend pour specs/006-nom, tâches T04 et T05.
Utilise l'agent securite sur les changements depuis <commit>.
Utilise l'agent relecteur. Base : <commit>. Spec : specs/006-nom.
```

Au relecteur, on ne donne que la base et la spec, jamais son propre avis.

## Les garde-fous, et comment ils sont vérifiés

- Aucun agent ne modifie une spec, ne pousse, ni ne valide son propre travail.
- Le backend et le frontend écrivent le test d'abord, le voient échouer pour la bonne raison, puis écrivent le code minimal ; `npm run check` avant chaque commit, jamais `--no-verify`.
- Les tests n'appellent ni le réseau ni Claude : `fetch` est remplacé, l'assistant est un faux.
- La clé `ANTHROPIC_API_KEY` reste dans les variables d'environnement de Vercel ; Claude ne reçoit que des données officielles lues côté serveur.
- Le relecteur et l'auditeur sécurité n'ont pas d'outil d'écriture.

`tests/agents.test.ts` vérifie ces garde-fous à chaque `npm run check` : il échoue si un agent perd son périmètre, son test d'abord, son interdiction de pousser, ou si un agent de relecture reçoit le droit d'écrire.

## Essai réel

L'équipe a été essayée sur une spec jetable, dans une copie du dépôt de la formation :

- `ux-design` a écrit le système de design et une note d'écran, et n'a écrit que dans `design/` ; il a mesuré un contraste insuffisant (vert sur sable, 4,4:1) et l'a écarté.
- `backend` a fait sa tâche test d'abord (`tdd:red` : « rouge pour la bonne raison »), un commit au bon format, et a **refusé** une demande glissée hors de son périmètre (modifier un libellé de l'interface), en la renvoyant à l'agent `frontend`.
- `frontend` a fait sa tâche test d'abord (rouge pour une mauvaise raison d'abord, donc un squelette, puis rouge pour la bonne), un commit au bon format, sans toucher au serveur.
- Résultat de la copie : `pnpm check` vert (166 tests), et l'outil de traçabilité relie chaque scénario de la spec d'essai à son test.

## Le coût

Les agents tournent sur le compte avec lequel Claude Code est connecté : avec une licence Claude Max, ils n'entament pas les crédits de l'API. Les crédits servent à l'application elle-même, pour le résumé du jour, qui ne coûte que quelques centimes et n'est rédigé qu'une fois par jour grâce au cache.
