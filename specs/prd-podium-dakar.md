# PRD — Podium Dakar 2026

**Statut** : Validé

## Problème

Les JOJ Dakar 2026 se déroulent du 31 octobre au 13 novembre sur trois sites, Dakar, Diamniadio et Saly, avec 25 sports. Un supporter veut savoir, sur son téléphone, qui a gagné aujourd'hui, où en est son pays et ce qui se joue en ce moment. Aujourd'hui, il passe d'une source à l'autre : le site officiel est en anglais et peu lisible sur mobile, Wikipédia est éclaté en une page par sport. Les journalistes recoupent les podiums à la main, et une erreur publiée se corrige mal.

## Utilisateurs

- Supporter, au stade ou chez lui : les podiums du jour, le rang de son pays, les épreuves en cours.
- Journaliste : un podium sûr, avec sa source et son historique de corrections.
- Chef de site : publier un podium, le faire valider par un second responsable, le rectifier avec un motif.

## Proposition

Une application web installable (PWA), en français, qui fonctionne aussi hors connexion. Elle rassemble seule les vrais résultats : les podiums et le tableau des médailles viennent de Wikipédia, les épreuves en cours du programme officiel des Jeux. Rien n'est saisi à la main pour suivre les Jeux. Le chef de site publie et rectifie ; une rectification ajoute une version, l'ancienne reste visible.

## Mesure du succès

Pendant la démo : le tableau des médailles affiche le Sénégal avec le même nombre de médailles que Wikipédia (10 le 11 novembre) ; une épreuve « Running » sur le site officiel apparaît « En direct » en moins d'une minute ; on rectifie un podium avec un motif, et sa fiche montre les deux versions.

## Tranches

### TR1 — Les vrais résultats, lus sur Wikipédia (spec 001)

Podium complet = épreuve officielle ; sinon « à venir », avec les médailles déjà attribuées. Si Wikipédia ne répond pas, rien n'est effacé.

### TR2 — Le tableau des médailles (spec 002)

Trié par or, argent, bronze ; celui de Wikipédia fait foi, corrigé des podiums saisis dans l'application.

### TR3 — Les épreuves en direct (spec 003)

Lues chaque minute sur le programme officiel, avec score et lieu.

### TR4 — Mise à jour automatique sans perte (spec 004)

Toutes les 6 heures, sans redéploiement ; le travail des chefs de site est gardé.

### TR5 — Résumé de la journée pour les journalistes, rédigé par Claude (spec 005)

À partir des finales du jour sur le site officiel ; une journée sans podium n'a pas de résumé, et Claude n'est pas appelé. Pourquoi l'IA : transformer une liste de médaillés en quelques phrases qu'un journaliste peut reprendre.

### TR6 — L'assistant des Jeux, rédigé par Claude (spec 006)

Le visiteur pose une question en français sur les JOJ Dakar 2026 et le Sénégal ; l'assistant répond à partir des vrais résultats de l'application. Règles : il ne parle que des Jeux, et refuse poliment tout autre sujet ; un visiteur ne peut pas envoyer de questions sans limite, et l'application a un plafond par jour. Pourquoi l'IA : comprendre une question libre (« le Sénégal a gagné quoi en lutte ? ») est ce qu'aucun filtre ne fait.

## Hors périmètre

- Les comptes réels des chefs de site (compte de démonstration), le partage des podiums saisis entre appareils, les notifications, le direct point par point.

## Hypothèses et risques

- Wikipédia est tenu par des bénévoles : une page en retard retarde l'application. Le tableau général est souvent en avance sur les pages de sport.
- Le format du site officiel et de Wikipédia peut changer : une épreuve mal lue reste « à venir », rien ne casse, mais le code doit suivre.
- Les podiums publiés par un chef de site restent dans son navigateur : sans serveur, ils ne sont pas partagés (TR futures).
