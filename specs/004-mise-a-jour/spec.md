# 004 — Mise à jour automatique sans perte

**Statut** : Implémentée
**PRD** : specs/prd-podium-dakar.md, TR4

## Contexte

Les résultats doivent rester réels sans redéployer l'application : chaque navigateur relit Wikipédia toutes les 6 heures. Un chef de site a peut-être publié ou rectifié un podium entre-temps : son travail ne doit pas être écrasé.

## User stories

- En tant que supporter, je veux des résultats à jour sans rien faire, afin de ne rien manquer.
- En tant que chef de site, je veux garder mes publications et rectifications après une mise à jour.

## Scénarios d'acceptation

### AS1 — Un import plus récent remplace les podiums importés

- **Étant donné** e1 importé et e2 à venir
- **Quand** un nouvel import donne le podium de e2
- **Alors** e1 et e2 sont des épreuves, plus rien n'est à venir, et la date d'import est la nouvelle

### AS2 — Un podium rectifié par un chef de site est gardé, avec son historique

- **Alors** ses deux versions restent, même si Wikipédia donne toujours l'ancien podium

### AS3 — Un podium publié dans l'application est gardé

- **Étant donné** e2 publié par un chef de site, et toujours à venir sur Wikipédia
- **Alors** e2 reste publié et n'est plus dans les épreuves à venir

## Hors périmètre

- Le partage des podiums saisis entre appareils.
