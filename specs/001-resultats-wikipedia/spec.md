# 001 — Les vrais résultats, lus sur Wikipédia

**Statut** : Implémentée
**PRD** : specs/prd-podium-dakar.md, TR1

## Contexte

Le supporter veut les podiums réels sans que personne ne les saisisse. Wikipédia publie une page par sport, avec un tableau des médaillés, et un tableau des médailles général.

## User stories

- En tant que supporter, je veux voir les podiums réels de chaque épreuve, afin de savoir qui a gagné.
- En tant que journaliste, je veux savoir d'où vient un podium, afin de le citer.

## Scénarios d'acceptation

### AS1 — Un podium complet devient une épreuve officielle

- **Étant donné** le 100 m garçons avec or (SEN, 10.50), argent (FRA) et bronze (JPN) sur Wikipédia
- **Alors** l'épreuve « 100 m garçons » est officielle, avec les trois médaillés, leur pays, leur performance et leur médaille

### AS2 — Sans médaille d'or, l'épreuve reste à venir, avec les médailles déjà attribuées

- **Étant donné** la boxe 50 kg avec seulement ses deux bronzes (MEX, COL)
- **Alors** l'épreuve est « à venir » et garde ses deux bronzes

### AS3 — Une équipe notée par un modèle de sport est reconnue

- **Étant donné** le basket 3x3 garçons, l'or écrit `{{3x3|SEN}}` suivi des quatre joueurs
- **Alors** l'or revient au Sénégal, avec ses quatre joueurs

### AS4 — Deux bronzes sur des lignes fusionnées

- **Étant donné** le judo 66 kg avec un bronze (ARG) et un second bronze sur la ligne suivante (SEN)
- **Alors** ARG et SEN reçoivent tous deux le bronze

### AS5 — Wikipédia injoignable

- **Quand** aucune page ne peut être lue
- **Alors** l'import échoue et les résultats actuels ne sont pas remplacés

### AS6 — Un sport illisible garde ses anciens résultats

- **Étant donné** le judo déjà importé, et sa page absente cette fois
- **Alors** le judo garde ses podiums précédents ; toutes les pages sont lues en une seule requête

### AS7 — Un podium inchangé garde sa date d'origine

- **Alors** un podium identique au précédent garde la date de son premier import

### AS8 — Le tableau des médailles général est lu avec les résultats

- **Étant donné** « gold_SEN = 5 | silver_SEN = 0 | bronze_SEN = 5 » sur la page principale
- **Alors** le Sénégal a 5 or, 0 argent, 5 bronze

## Hors périmètre

- Les horaires et les épreuves en cours (spec 003) ; les ex æquo hors bronze.

## Questions ouvertes

- Hypothèse : une épreuve sans or n'est pas terminée, même si ses bronzes sont attribués.
