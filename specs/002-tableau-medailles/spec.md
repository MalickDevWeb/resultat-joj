# 002 — Le tableau des médailles

**Statut** : Implémentée
**PRD** : specs/prd-podium-dakar.md, TR2

## Contexte

Le supporter veut savoir où en est son pays. Les pages de sport de Wikipédia ont souvent du retard sur son tableau général ; un podium rectifié dans l'application doit aussi compter.

## User stories

- En tant que supporter, je veux le rang de chaque pays, afin de suivre le mien.

## Scénarios d'acceptation

### AS1 — Tri par or, puis argent, puis bronze

- **Étant donné** JPN 1-2-1, SEN 1-1-1, FRA 1-0-1
- **Alors** l'ordre est JPN, SEN, FRA

### AS2 — Les médailles d'une épreuve à venir comptent

- **Étant donné** la boxe 50 kg à venir, avec deux bronzes (MEX, COL)
- **Alors** MEX et COL ont chacun un bronze

### AS3 — Le tableau officiel, corrigé d'un podium rectifié

- **Étant donné** le tableau officiel SEN 5-1-5, FRA 4-5-4, et un podium FRA-SEN-FRA rectifié en SEN-FRA-FRA
- **Alors** SEN 6-0-5 et FRA 3-6-4

### AS4 — Un podium publié dans l'application s'ajoute

- **Étant donné** le tableau officiel SEN 1-0-0 et un podium SEN-MAR-EGY publié par un chef de site
- **Alors** SEN 2-0-0, MAR 0-1-0, EGY 0-0-1

### AS5 — Un pays sans médaille après correction disparaît

- **Alors** un pays dont la seule médaille est retirée par une rectification n'apparaît plus

### AS6 — Jamais de total négatif

- **Étant donné** un tableau officiel en retard qui ne connaît pas encore une médaille retirée par rectification
- **Alors** le total reste à 0, jamais négatif

## Hors périmètre

- Le classement par nombre total de médailles, les médailles par sport.
