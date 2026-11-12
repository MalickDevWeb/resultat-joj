# 008 — La fiche d'un pays (note de design)

Référence : la fiche du champion du résumé du jour (cartes blanches arrondies, icône à gauche, bouton vert en bas).

## Parcours

Médailles → toucher une ligne du tableau (ou le nom du pays, bouton au clavier) → la fiche monte du bas (feuille `Scrim`, comme les autres fenêtres). ✕, Échap, le fond ou un glissement la ferment ; le focus revient au nom du pays.

## Structure

- **Haut fixe** : grand drapeau rond (72 px) ; pastille du rang (« 🥇 1re nation », « 6e nation » ; or/argent/bronze pour le top 3, sinon verte) ; nom du pays en `h3` ; sous-titre « SEN · 10 médailles ».
- **Ses médailles** (🏅) : quatre compteurs côte à côte — Or, Argent, Bronze, Total (le total en pastille verte).
- **Ses médaillés** (🏆) : une ligne par médaille, de l'or au bronze : médaille, nom (« équipe » en petit pour une équipe), « Sport · épreuve », site en gris. Si des médailles ne sont pas détaillées : encadré jaune pâle « 1 médaille n'est pas encore détaillée sur Wikipédia. »
- **Ses meilleurs sports** (⚡) : puces « Lutte de plage · 3 » rangées par or, argent, bronze.
- **Résumé simple** (📖) : les phrases du résumé, puis la barre vocale ▶︎ (« Écouter le résumé de <pays> »).
- **Bas fixe** : bouton vert pleine largeur, micro + « Poser une question à l'assistant sur ce pays ».
- Le Sénégal garde sa ligne verte dans le tableau ; toutes les lignes montrent un curseur main et un survol léger.

## Accessibilité

- Le nom du pays dans le tableau est un `button` (« Voir la fiche de Sénégal ») ; la ligne entière réagit aussi au toucher.
- La fiche est un `dialog` nommé par le nom du pays ; les médailles ont un texte (« Or »), pas seulement une couleur.

## Refonte d'après la maquette (décision de l'humain)

Référence : `design/maquette-fiche-pays.png` (« Sénégal à l'honneur »). Plein écran sur téléphone, carte de 480 px au centre sur grand écran. Les autres maquettes reçues montraient des données absentes de l'application (population, capitale, photos…) : elles ne sont pas reprises.

- **En-tête** : la bannière `/brand/hero-banner-resume.webp` (logo, stade, Ayo), bouton rond blanc « ← » à gauche (« Retour au tableau des médailles »).
- **Identité** : grand drapeau qui flotte (mât à gauche, ondulation douce, arrêtée si mouvement réduit) ; à droite le nom en très gros, « JOJ Dakar 2026 » en italique vert, pilule verte claire « 🏆 6e position au classement général ».
- **Quatre cartes** : Or (dorée), Argent (gris bleuté), Bronze (cuivrée), chacune avec sa médaille dessinée ; Total en carte verte foncée.
- **Détails des médailles** : bandeau vert foncé, colonnes Or / Argent / Bronze / Total ; une ligne par sport avec son pictogramme ; total en pastille vert pâle.
- **Deux colonnes** (une seule sous 420 px) : « Nos champions » (trois premiers médaillés : pastille de médaille aux initiales, nom, sport ; « Voir tous les médaillés → » déplie la liste) et « Informations clés » (Classement actuel « 6e / 87 nations », Total, Or, Argent, Bronze).
- **À retenir !** : étoile, les phrases du résumé, le monument à droite, la barre ▶︎ pour l'écouter.
- **Trois boutons verts** : « Voir ses épreuves », « Voir le programme », « Demander à l'assistant ».
- **Pied** : vagues vert-jaune-rouge.
