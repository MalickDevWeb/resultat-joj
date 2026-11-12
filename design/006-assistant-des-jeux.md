# Design 006 — L'assistant des Jeux

**Spec** : `specs/006-assistant-des-jeux/spec.md` · **Réutilise** : `Scrim` (`Sheets.tsx`), `ErrBox` et la classe `badge b-next` (`ui.tsx`), `.chips button`, `.btn`, `.meta`, `.vh` (`src/index.css`).

## Parcours

1. Sur tous les onglets, le visiteur voit le bouton « Une question ? ». Il le touche : la fenêtre « Assistant des Jeux » s'ouvre, le curseur est dans le champ.
2. Il touche une suggestion ou écrit sa question, puis « Envoyer » (ou Entrée ; Maj+Entrée va à la ligne).
3. Sa question s'affiche à droite, la réponse à gauche. Il continue, ou touche « Nouvelle conversation ».
4. Il ferme (croix, Échap, toucher le fond, glisser vers le bas) : le focus revient sur « Une question ? ». La conversation reste tant que l'application est ouverte, et disparaît au rechargement (rien n'est stocké).

## Structure

- **Bouton** `button.assist-fab` (icône lucide `MessageCircle` en `aria-hidden`, texte visible « Une question ? », `aria-haspopup="dialog"`). Fond `--ocean`, texte `--ocean-ink`, rayon 999px, au moins 44 × 44 px. Téléphone : fixé en bas à droite, au-dessus des onglets (`bottom: calc(84px + env(safe-area-inset-bottom,0px))`, comme `.toast`). Dès 760px : en bas à droite de l'écran, à 24px des bords. Absent pendant l'accueil (`Onboarding`) et quand une autre fenêtre est ouverte.
- **Fenêtre** : `Scrim` avec `label="Assistant des Jeux"` et `className="sheet-assist"`. Téléphone : feuille du bas, hauteur fixe 92vh ; dès 760px : fenêtre centrée, largeur 520px, hauteur `min(90vh,640px)`. De haut en bas :
  - poignée et croix `sheet-x-btn` (`aria-label="Fermer"`), comme `LoginSheet` ;
  - en-tête `.lhead` : tête d'Ayo (`/brand/ayo-head.webp`, `alt=""`), titre `h3` « Assistant des Jeux », puis badge `badge b-next` « Rédigé par Claude » ;
  - le fil, `div.assist-fil` (`role="log"`, `aria-label="Conversation"`), seul à défiler. Le glissement vers le bas ne ferme la fenêtre que si le fil est en haut (même règle que `.inst-scroll`) ;
  - en bas, toujours visible : la zone d'erreur, le formulaire (`textarea` avec étiquette `.vh` « Votre question », espace réservé « Ex. : le Sénégal a gagné quoi en lutte ? », et bouton `.btn` « Envoyer »), puis la mention `.meta` « Réponses rédigées par Claude à partir des données officielles de l'application. Elles peuvent contenir des erreurs. »
- **Messages** : visiteur à droite, fond `--ocean-soft`, texte `--ink` ; assistant à gauche, fond `--sand`, texte `--ink`. Rayon 16px, largeur max 85 %. Chaque message commence par un préfixe `.vh` « Vous : » ou « Assistant : ». Le texte est affiché comme du texte (jamais `dangerouslySetInnerHTML`), un paragraphe par ligne.

## Scénarios

- **006-AS1** — Fil vide : message d'accueil de l'assistant « Bonjour ! Posez votre question sur les JOJ Dakar 2026 : médailles, podiums, sites et dates. », puis trois suggestions en `.chips button` sous le titre `.meta` « Suggestions » : « Combien de médailles pour le Sénégal ? », « Où se passe la lutte de plage ? », « Quelles finales aujourd'hui ? ». Toucher une suggestion l'envoie aussitôt. Les suggestions disparaissent dès la première question. Une réponse s'affiche comme message de l'assistant.
- **006-AS2** — La réponse fixe « Je réponds seulement aux questions sur les Jeux Olympiques de la Jeunesse Dakar 2026. » s'affiche comme un message de l'assistant ordinaire, sans erreur ni couleur particulière.
- **006-AS3** et **006-AS9** — Avant tout envoi, le navigateur vérifie la question (espaces retirés), sans appeler le serveur ; le texte reste dans le champ et le focus y revient :
  - vide : « Écrivez votre question avant de l'envoyer. »
  - plus de 500 caractères : « Votre question dépasse 500 caractères. Raccourcissez-la. »
  - au-delà de 400 caractères, un compteur `.meta` « 432 / 500 » s'affiche sous le champ.
- **006-AS4** — Le navigateur envoie au plus les 6 derniers échanges complets, chaque texte coupé à 1 000 caractères, dans l'ordre visiteur puis assistant ; le message d'accueil n'est pas envoyé. Dès le premier message, un bouton `.btn ghost` « Nouvelle conversation » apparaît dans l'en-tête : il vide le fil et rend les suggestions.
- **006-AS5** (`TROP_DE_QUESTIONS`) : « Vous avez posé beaucoup de questions. Réessayez dans quelques minutes. » La question reste dans le champ.
- **006-AS6** (`QUOTA_DU_JOUR`) : « L'assistant a répondu à toutes les questions possibles aujourd'hui. Revenez demain. » Le champ, « Envoyer » et les suggestions sont alors désactivés jusqu'à la fermeture de la fenêtre.
- **006-AS8** (`ASSISTANT_INDISPONIBLE`) : « L'assistant n'est pas disponible pour le moment. Réessayez dans un instant. » La question reste dans le champ.
- **006-AS9** — L'écran vérifie la forme de la réponse avant de l'afficher. Réponse illisible : « La réponse de l'assistant n'a pas pu être lue. Réessayez. » Les autres refus (`QUESTION_INVALIDE`, `HISTORIQUE_INVALIDE`, `REQUETE_INVALIDE`, code inconnu) : « Cette question n'a pas pu être envoyée. Commencez une nouvelle conversation, puis réessayez. »

Chaque erreur s'affiche dans `ErrBox`, au-dessus du champ ; la phrase vient de cette note selon le code, jamais le code lui-même. Elle disparaît au prochain envoi.

## États

- **Attente** : sous la question, une bulle de l'assistant « L'assistant cherche dans les résultats officiels… » (`role="status"`) ; `aria-busy="true"` sur le fil ; « Envoyer » et les suggestions désactivés. Trois points animés seulement si `prefers-reduced-motion: no-preference`.
- **Erreur réseau** (`fetch` qui échoue) : « Impossible de joindre l'assistant. Vérifiez votre connexion, puis réessayez. »
- **Hors connexion** (`navigator.onLine` faux) : à la place des suggestions, `ErrBox` « Vous êtes hors connexion. L'assistant revient dès que le réseau revient. » ; « Envoyer » désactivé. Le reste de l'application fonctionne comme avant.

## Accessibilité

- Fenêtre `role="dialog"`, `aria-modal`, nommée « Assistant des Jeux » (fourni par `Scrim`). À l'ouverture, focus sur le champ ; Échap ferme ; à la fermeture, focus sur « Une question ? ». Tab parcourt : Nouvelle conversation, Fermer, suggestions, champ, Envoyer.
- Le fil `role="log"` annonce chaque nouvelle réponse ; les erreurs ont `role="alert"` (`ErrBox`).
- Contrastes, clair et sombre, au moins 4,5:1 : `--ink` sur `--ocean-soft` et `--sand`, `--ocean-ink` sur `--ocean`, `--muted` sur `--paper`.
- Le bouton « Envoyer » montre son texte (pas une icône seule). Cibles tactiles d'au moins 44 px.
