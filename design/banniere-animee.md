# Bannière animée (motion design)

Demande de l'humain : animer la bannière JOJ Dakar 2026 (logo, stade, Ayo, drapeau). Composant `BanniereAnimee` (`src/components/BanniereAnimee.tsx`), utilisé par l'en-tête mobile et la fiche d'un pays.

## Mouvements (une seule image, aucun fichier en plus)

- **Zoom lent** de toute l'image (18 s, aller-retour, 3,5 %), centré à droite pour que le logo reste entier.
- **Ayo se balance** depuis ses pieds (3,2 s) : une copie de l'image, découpée autour de lui par un masque doux, légèrement agrandie pour couvrir l'original.
- **Le drapeau flotte** : des bandes de lumière glissent sur lui (2,6 s), en lumière douce.
- **Un éclat** traverse la bannière toutes les 7 s.
- **Des étincelles** vert, jaune, rouge montent du bas (5,5 s, décalées).

## Règles

- Seulement `transform`, `opacity` et `background-position` : fluide sur téléphone.
- Tout est décoratif (`aria-hidden`) ; le nom de la bannière reste « JOJ Dakar 2026 ».
- « Réduire les animations » (`prefers-reduced-motion`) : l'image reste fixe, rien ne bouge.
