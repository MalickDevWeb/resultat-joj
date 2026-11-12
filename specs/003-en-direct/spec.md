# 003 — Les épreuves en direct

**Statut** : Implémentée
**PRD** : specs/prd-podium-dakar.md, TR3

## Contexte

Wikipédia ne dit pas ce qui se joue en ce moment. Le programme officiel (webresult.apps.dakar2026.org) le dit, mais ne se lit pas depuis le navigateur d'un autre site : une fonction serveur le lit pour l'application.

## User stories

- En tant que supporter, je veux voir les épreuves en cours, avec le score et le lieu, afin de savoir quoi suivre.

## Scénarios d'acceptation

### AS1 — « Running » est en direct

- **Étant donné** un assaut d'escrime au statut « Running »
- **Alors** il est en direct

### AS2 — « Scheduled » est à venir, « Finished » est terminée

### AS3 — Un match donne les deux camps, leur score et le vainqueur

- **Étant donné** BEL 2 contre ROU 5
- **Alors** les deux camps et leur score sont lus, ROU est vainqueur

### AS4 — Une épreuve sans heure prend celle de la précédente

- **Alors** deux assauts commencés ensemble sont tous deux à 09:00

### AS5 — Le site se déduit du lieu, l'épreuve est en français

- **Alors** « Dakar Expo Center » est à Diamniadio, « Saly Beach West » à Saly ; « Men's Épée Individual Pool 2 » devient « Épée individuel garçons, poule 2 »

### AS6 — /api/live répond les épreuves en cours, gardées une minute

- **Alors** la réponse 200 contient les épreuves en direct et le nombre de terminées, en cache 60 s

### AS7 — Programme indisponible

- **Quand** le site officiel ne répond pas
- **Alors** /api/live répond 502 avec « Programme officiel momentanément indisponible. »

### AS8 — Un lien ne quitte jamais le site officiel

- **Étant donné** une épreuve dont le lien ne commence pas par « / »
- **Alors** elle n'a pas de lien

### AS9 — Une seule adresse

- **Quand** /api/live reçoit un paramètre ou une méthode autre que GET
- **Alors** 400 `PARAMETRE_INCONNU` ou 405 `METHODE_INTERDITE`, sans lire le site officiel : le cache n'est pas contourné

## Hors périmètre

- Le direct point par point, les notifications.

## Questions ouvertes

- Hypothèse : tout statut qui n'est ni prévu ni terminé est en cours. Vérifié le 12 novembre : le site écrit « Running ».
