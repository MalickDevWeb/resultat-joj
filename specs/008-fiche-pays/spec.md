# 008 — La fiche d'un pays

**Statut** : Validée (décision de l'humain)
**PRD** : specs/prd-podium-dakar.md, TR8

## Contexte

Le tableau des médailles dit combien un pays a gagné, pas qui ni où. Le supporter veut, d'un toucher, voir tout sur un pays, comme sur la fiche d'un champion du résumé du jour.

## User stories

- En tant que supporter, je veux toucher un pays du tableau, afin de voir ses médaillés, ses sports et son rang.

## Scénarios d'acceptation

### AS1 — Le rang et les médailles de la fiche sont ceux du tableau

- **Étant donné** le tableau officiel CHN 2-0-0, SEN 1-0-1, JPN 1-0-1
- **Alors** la fiche du Sénégal dit 2e (ex aequo avec le Japon) sur 3 nations, 1 or, 0 argent, 1 bronze, 2 au total

### AS2 — Les médaillés, de l'or au bronze

- **Étant donné** un bronze sénégalais en judo et un or sénégalais en lutte de plage (une équipe), et une épreuve à venir avec un bronze sénégalais en boxe
- **Alors** la liste montre l'or de lutte (équipe), puis les deux bronzes, chacun avec son sport, son épreuve et son site

### AS3 — Les meilleurs sports

- **Alors** les sports sont rangés par or, puis argent, puis bronze, avec leur nombre de médailles

### AS4 — Un résumé simple, qui se lit à voix haute

- **Alors** le résumé dit le rang et les médailles en toutes lettres (« Sénégal : 2e nation ex aequo au tableau des médailles, avec 1 médaille d'or et 1 médaille de bronze. »), puis le meilleur sport (« Meilleur sport : Lutte de plage, avec 1 médaille d'or. ») ; ▶︎ le lit
- **Étant donné** un tableau officiel qui compte plus de médailles que les podiums connus
- **Alors** la fiche le dit (« 1 médaille n'est pas encore détaillée sur Wikipédia. ») et n'invente aucun médaillé

### AS5 — Ouvrir et fermer la fiche

- **Quand** le visiteur touche un pays du tableau (la ligne ou son nom, au clavier aussi)
- **Alors** la fiche s'ouvre en plein écran sur téléphone, comme la maquette `design/maquette-fiche-pays.png` (décision de l'humain) : drapeau, nom, rang ; « ← Retour », Échap ou un glissement vers le bas (contenu en haut) la ferment, et le focus revient au pays
- **Quand** il touche « Poser une question à l'assistant sur ce pays »
- **Alors** l'assistant s'ouvre avec la question « Pays : <pays>. Quelles médailles aux JOJ, et dans quels sports ? » prête dans le champ, non envoyée

### AS7 — Aller plus loin depuis la fiche

- **Quand** le visiteur touche « Voir ses épreuves »
- **Alors** la fiche se ferme et les Résultats s'ouvrent, cherchés sur le nom du pays
- **Quand** il touche « Voir le programme »
- **Alors** la fiche se ferme et le Programme s'ouvre

### AS6 — Un pays inconnu n'a pas de fiche

- **Alors** un code sans médaille ne donne pas de fiche

## Tâches

- [ ] T01 [008-AS1…AS4, AS6] Écrire d'abord les tests de `ficheDuPays` (`src/pays.ts`) dans `tests/008-fiche-pays.test.ts`, puis la fonction pure
- [ ] T02 [008-AS4, AS5] La fiche (`src/components/FichePays.tsx`) et le tableau cliquable, d'après la note `design/008-fiche-pays.md`

## Hors périmètre

- Un appel à Claude pour la fiche, les photos des athlètes, la population, la capitale, la monnaie, la devise ou le chef de délégation (aucune source dans l'application : rien n'est inventé), l'historique des éditions précédentes, les médailles par jour.
