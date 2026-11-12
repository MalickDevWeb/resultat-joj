# 005 — Résumé de la journée pour les journalistes, rédigé par Claude

**Statut** : Implémentée
**PRD** : specs/prd-podium-dakar.md, TR5

## Contexte

Le journaliste qui écrit à 18 h doit résumer les finales du jour à partir de sources éparses. L'application lit les finales terminées et leurs médaillés sur le site officiel, et Claude en rédige un résumé en français. Les règles restent celles de l'application : Claude ne voit que des résultats officiels, et ne peut citer que des épreuves qui existent.

## User stories

- En tant que journaliste, je veux un résumé des médailles d'une journée, avec les épreuves sur lesquelles il s'appuie, afin de le vérifier avant de le reprendre.

## Scénarios d'acceptation

### AS1 — Résumé d'une journée avec des finales

- **Étant donné** le 11 novembre, avec deux finales terminées et leurs médaillés sur le site officiel
- **Quand** on demande le résumé du 11 novembre
- **Alors** la réponse 200 contient le titre et les paragraphes de Claude, et les épreuves citées, chacune avec son podium officiel

### AS2 — Journée sans podium

- **Étant donné** une journée sans finale terminée
- **Alors** 404, code `AUCUN_PODIUM`, et Claude n'est pas appelé

### AS3 — Une épreuve citée par Claude qui n'existe pas est écartée

- **Quand** Claude cite une épreuve absente des finales du jour
- **Alors** elle n'apparaît pas dans les épreuves renvoyées

### AS4 — Jour invalide

- **Quand** le jour est mal écrit, hors des Jeux (31 octobre au 13 novembre 2026), ou dans le futur
- **Alors** 400, code `JOUR_INVALIDE` ; ni le site officiel ni Claude ne sont appelés

### AS5 — Paramètre inconnu ou méthode autre que GET

- **Alors** 400 `PARAMETRE_INCONNU`, ou 405 `METHODE_INTERDITE` : on ne contourne pas le cache pour consommer des crédits
- Une seule forme d'adresse par jour : un `jour` répété, un nom ou une valeur encodés, un `&` final ou un `?` vide sont refusés

### AS6 — Claude indisponible

- **Quand** la clé manque, Claude échoue ou refuse
- **Alors** 503, code `RESUME_INDISPONIBLE`, avec une phrase claire en français

### AS7 — Le résumé est gardé en cache

- **Alors** un jour passé est gardé 24 h, le jour même 30 min ; une erreur n'est jamais gardée plus de 60 s

### AS9 — L'écran ne demande que des jours des Jeux

- **Alors** pendant les Jeux, aujourd'hui puis la veille ; le 31 octobre, ce seul jour ; après le 13 novembre, le 13 ; avant les Jeux, aucun

### AS8 — Claude ne reçoit que les résultats officiels

- **Alors** le rédacteur reçoit seulement les finales du jour (sport, épreuve, médaillés), jamais un texte venu de la requête

### AS10 — Un jour n'est rédigé qu'une fois

- **Quand** le même jour est redemandé, par n'importe quelle adresse, ou que Claude vient d'échouer
- **Alors** Claude n'est pas rappelé : le résumé est gardé 24 h (jour passé) ou 30 min (jour même), un échec 60 s

## Hors périmètre

- Choisir le ton ou la longueur du résumé, le traduire, l'envoyer par e-mail.

## Questions ouvertes

- Hypothèse : une épreuve compte si elle est terminée et que le site officiel lui donne au moins une médaille.
- Hypothèse : le modèle est `claude-opus-5-5` ; en cas de refus, le serveur réessaie sur le modèle recommandé (`fallbacks: "default"`).
