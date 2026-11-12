# 009 — Les notifications

**Statut** : Validée (décision de l'humain)
**PRD** : specs/prd-podium-dakar.md, TR9

## Contexte

Le bouton « Activer les notifications » des Actualités n'activait rien. Le supporter veut être prévenu par son téléphone des temps forts, sans garder l'écran ouvert sur la bonne page.

## User stories

- En tant que supporter, je veux activer les notifications d'un toucher, afin d'être prévenu des épreuves en direct et des médailles du Sénégal.

## Scénarios d'acceptation

### AS1 — Activer, avec la permission du navigateur

- **Quand** le visiteur touche « Activer les notifications » et que le navigateur l'accorde
- **Alors** le bouton dit « Notifications activées », le choix est gardé pour la prochaine visite, et un message confirme « Notifications activées : épreuves en direct et médailles du Sénégal. »
- **Quand** le navigateur les refuse ou les a bloquées
- **Alors** un message clair : « Les notifications sont bloquées par votre navigateur. Autorisez-les dans ses réglages, puis réessayez. »
- **Quand** le navigateur ne sait pas notifier
- **Alors** : « Votre navigateur ne permet pas les notifications. Sur iPhone, ajoutez d'abord l'application à l'écran d'accueil. »

### AS2 — Une épreuve passe en direct

- **Étant donné** les notifications activées
- **Quand** une épreuve apparaît dans le direct du programme officiel
- **Alors** une notification « En direct : Lutte de plage » / « 80 kg garçons · Saly », une seule fois par épreuve

### AS3 — Une médaille pour le Sénégal

- **Quand** un podium nouveau ou rectifié donne une médaille au Sénégal
- **Alors** une notification « 🥇 Médaille d'or pour le Sénégal ! » / « Maguette Diop · Lutte de plage, 80 kg garçons », une seule fois par médaille

### AS4 — Rien pour l'existant, rien sans permission

- **Alors** à l'activation, à l'ouverture et à chaque mise à jour, ce qui existait déjà ne déclenche rien ; sans permission accordée, ou désactivées, aucune notification

### AS5 — Désactiver

- **Quand** il touche « Notifications activées »
- **Alors** elles se désactivent (« Notifications désactivées. »), et le choix est gardé

## Tâches

- [ ] T01 [009-AS1…AS5] Écrire d'abord les tests des règles pures (`src/notifications.ts`) dans `tests/009-notifications.test.ts`, puis les règles
- [ ] T02 [009-AS1…AS5] Le hook `useNotifications`, le bouton des Actualités, la lecture du direct en arrière-plan quand elles sont activées

## Hors périmètre

- L'envoi application fermée (push serveur : clés VAPID, stockage des abonnements, tâche planifiée), les notifications pour les autres pays, le réglage par sport.
