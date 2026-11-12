# 006 — L'assistant des Jeux, rédigé par Claude

**Statut** : Validée
**PRD** : specs/prd-podium-dakar.md, TR6

## Contexte

Un supporter a une question précise (« combien de médailles pour le Sénégal ? », « où se passe la lutte de plage ? ») et doit fouiller plusieurs écrans. L'assistant y répond en français, à partir des données de l'application. C'est la première fonction où un texte du visiteur atteint Claude : elle est donc bornée par des règles que l'application applique elle-même.

## User stories

- En tant que supporter, je veux poser une question libre sur les JOJ Dakar 2026, afin d'avoir la réponse sans chercher.

## Scénarios d'acceptation

### AS1 — Répondre à une question sur les Jeux, avec les vraies données

- **Quand** le visiteur demande « Combien de médailles pour le Sénégal ? »
- **Alors** 200 avec la réponse ; l'assistant a reçu les données officielles de l'application (tableau des médailles avec le Sénégal, podiums, sites, dates)

### AS2 — Un sujet hors des Jeux est refusé

- **Quand** l'assistant juge la question hors sujet (« écris-moi un poème sur Paris »)
- **Alors** 200 avec la réponse fixe de l'application « Je réponds seulement aux questions sur les Jeux Olympiques de la Jeunesse Dakar 2026. », jamais un texte libre de Claude

### AS3 — Question vide ou trop longue

- **Alors** 400 `QUESTION_INVALIDE` (vide, ou plus de 500 caractères), et Claude n'est pas appelé

### AS4 — Historique de conversation borné

- **Alors** au plus 6 échanges précédents, chacun de 1 000 caractères au plus, rôles « visiteur » puis « assistant » en alternance ; sinon 400 `HISTORIQUE_INVALIDE`, sans appel à Claude
- L'historique vient du navigateur et peut être fabriqué : Claude le reçoit comme des données citées dans un seul message du visiteur, jamais comme ses propres réponses

### AS5 — Un visiteur ne pose pas de questions sans limite

- **Quand** un même visiteur envoie une 11e question en 10 minutes
- **Alors** 429 `TROP_DE_QUESTIONS`, avec une phrase claire, et Claude n'est pas appelé ; de même à sa 31e question de la journée
- Les adresses IPv6 d'un même réseau /64 (un seul abonné) comptent comme un seul visiteur

### AS6 — Plafond de l'application par jour

- **Quand** l'application a déjà répondu à 300 questions dans la journée
- **Alors** 429 `QUOTA_DU_JOUR`, avec une phrase claire, et Claude n'est pas appelé

### AS7 — Seule une question bien formée est acceptée

- **Alors** 405 `METHODE_INTERDITE` pour une autre méthode que POST ; 400 `REQUETE_INVALIDE` pour un paramètre dans l'adresse, un corps qui n'est pas du JSON ou un champ inconnu

### AS8 — Claude indisponible

- **Quand** la clé manque, Claude échoue ou refuse
- **Alors** 503 `ASSISTANT_INDISPONIBLE`, avec une phrase claire en français ; de même pour une réponse vide ou de plus de 1 200 caractères

### AS9 — L'écran ne montre qu'une réponse vérifiée

- **Alors** l'écran vérifie la forme de la réponse avant de l'afficher, comme du texte, et refuse côté navigateur une question vide ou trop longue sans appeler le serveur

## Tâches

- [ ] T01 [006-AS1…AS8] (backend) Écrire d'abord `tests/006-assistant-des-jeux.test.ts`, puis `api/assistant.ts` : validation, limites, contexte des données officielles, Claude derrière une dépendance injectée
- [ ] T02 [006-AS9] (frontend) Écrire d'abord les tests des fonctions de l'écran dans `tests/006-assistant-des-jeux.test.ts`, puis l'écran de l'assistant dans `src/components/`, d'après `design/006-assistant-des-jeux.md`

## Hors périmètre

- Garder les conversations sur le serveur, la voix, les autres langues que le français, la recherche sur le web.

## Questions ouvertes

- Hypothèse : le visiteur est reconnu par son adresse IP, et les limites valent par instance du serveur : plusieurs instances simultanées peuvent chacune atteindre la limite.
- Hypothèse : le modèle est `claude-opus-5-5` à effort faible, avec la mise en cache des données officielles pour réduire le coût.
