# Design 007 — La voix : dicter et écouter

**Spec** : `specs/007-la-voix/spec.md` · **Réutilise** : `badge live` (pastille rouge qui pulse), `ErrBox` (`ui.tsx`), le toast de `App.tsx`, `.btn ghost`, `.meta`, `.vh`, `.search`, `.assist-form`, `.assist-msg` (`src/index.css`) ; icônes lucide `Mic`, `Volume2`, `Square`, toujours en `aria-hidden`.

## Parcours

1. Le visiteur touche le micro (recherche ou assistant). La première fois, la mention de confidentialité s'affiche ; le navigateur demande l'accès au micro.
2. Il parle ; « J'écoute… » reste visible. À la fin de sa phrase, le micro s'arrête seul et le texte arrive dans le champ.
3. Recherche : les résultats se filtrent aussitôt. Assistant : il relit, corrige au clavier s'il veut, puis touche « Envoyer ».
4. Sur une réponse de l'assistant ou sur le résumé du jour, il touche « Écouter » ; le bouton devient « Arrêter » jusqu'à la fin de la lecture.

## Structure

- **Micro de la recherche** : bouton dans `label.search`, après le champ ; le raccourci `kbd` « / » est caché pendant l'écoute. Comme la recherche, il n'existe que dès 760px (`.search` est caché sur téléphone, voir Questions).
- **Micro de l'assistant** : dans `.assist-form`, entre le champ et « Envoyer » (colonnes `minmax(0,1fr) auto auto`). Même place sur téléphone et grand écran.
- **Bouton micro** (les deux) : `button type="button"`, rond, 44 × 44 px, icône `Mic` seule. Repos : fond `--paper`, bordure 1,5px `--line`, icône `--muted` ; nom accessible « Dicter votre recherche » ou « Dicter votre question ». Écoute : fond `--rect-bg`, bordure `--rect`, icône `--rect` ; nom accessible « Arrêter la dictée ».
- **« Écouter »** : `button.btn.ghost` compact (min. 44px de haut), icône `Volume2` + texte visible « Écouter » ; pendant la lecture, icône `Square` + « Arrêter ». Noms accessibles : « Écouter la réponse » / « Arrêter la lecture » (bulles), « Écouter le résumé du jour » / « Arrêter la lecture » (résumé). Place : en bas de chaque bulle `.assist-lui` qui est une réponse du fil (pas sur le message d'accueil ni sur la bulle d'attente) ; dans le résumé, une ligne `.ev` sous le titre et la date, avant les paragraphes.

## Scénarios

- **007-AS1** — Le texte dicté, espaces autour et point final retirés, remplace le contenu de la recherche comme une saisie (mêmes effets que `onChange` : retour à l'onglet Résultats si besoin). « Sénégal lutte » dicté → le champ vaut « Sénégal lutte ».
- **007-AS2** — Le texte dicté remplace le contenu du champ de l'assistant, mis en forme : première lettre en majuscule, « ? » ajouté après une espace s'il ne finit pas déjà par « ? » ; puis coupé à 500 caractères (comptés comme `longueur`). « combien de médailles pour le Sénégal » → « Combien de médailles pour le Sénégal ? ». Rien n'est envoyé ; le focus revient dans le champ, curseur à la fin ; le compteur « 432 / 500 » de 006 s'affiche comme pour une saisie.
- **007-AS3** — Le micro ne démarre qu'au toucher (jamais à l'ouverture de l'assistant). Pendant l'écoute : recherche → espace réservé « J'écoute… » et un `.vh role="status"` « J'écoute… » ; assistant → `span.badge.live` « J'écoute… » (`role="status"`) au-dessus du formulaire, dans `.assist-bas`. Le micro s'arrête : à la fin de la phrase, au second toucher, à « Envoyer » ou Entrée (le champ part tel quel), à la fermeture de l'assistant, quand la page est cachée (`visibilitychange`), et Échap dans la recherche. Un seul micro à la fois ; démarrer une dictée arrête la lecture en cours. Micro désactivé pendant l'attente d'une réponse et au quota du jour (006-AS6).
- **007-AS4** — Phrases, d'après l'erreur du navigateur : `not-allowed` ou `service-not-allowed` → « Autorisez le micro pour dicter. » ; `audio-capture` → « Aucun micro n'a été trouvé. » ; `no-speech` → « Je n'ai rien entendu. Réessayez. » ; `network`, ou `navigator.onLine` faux au toucher (le micro ne démarre pas) → « La dictée a besoin d'internet. ». `aborted` (arrêt voulu) : rien. Autre code : « La dictée n'a pas fonctionné. Réessayez. ». Assistant : dans `ErrBox`, à la place de l'erreur en cours ; recherche : dans le toast. La phrase disparaît à la dictée ou à l'envoi suivant ; le texte déjà dans le champ ne change pas.
- **007-AS5** — Lecture en `fr-FR`. Bulle : ses paragraphes, dans l'ordre. Résumé : le titre, le jour (« jeudi 12 novembre »), les paragraphes, puis chaque épreuve « Discipline · Épreuve : » et son podium, les médailles lues « Or », « Argent », « Bronze » au lieu de 🥇🥈🥉. Toucher « Écouter » ailleurs arrête la lecture précédente, dont le bouton redevient « Écouter ». Fin de la lecture, « Arrêter », fermeture de l'assistant ou de l'accordéon du résumé → « Écouter ».
- **007-AS6** — Sans `SpeechRecognition` (ni `webkitSpeechRecognition`) : aucun bouton micro, les colonnes de `.assist-form` restent celles de 006. Sans `speechSynthesis` : aucun bouton « Écouter ». Tout le reste est identique à 006.
- **007-AS7** — Au premier toucher d'un micro (n'importe lequel), la dictée démarre et la mention s'affiche : « Votre navigateur peut envoyer votre voix à ses serveurs pour l'écrire. Podium Dakar ne l'enregistre pas. » Assistant : `p.meta` au-dessus du formulaire, jusqu'à la fin de la dictée ; recherche : dans le toast, 6 s. Elle ne revient plus ensuite (`localStorage` `podium-voix-prevenu`, lu et écrit dans un `try`, comme `Onboarding` ; s'il échoue, elle revient à chaque première dictée de la visite).

## États

- **Chargement** : aucun (le navigateur transcrit et lit lui-même). Entre le toucher et le début de l'écoute (demande d'autorisation), le bouton est déjà à l'état écoute.
- **Vide** : dictée sans texte → traitée comme `no-speech`.
- **Hors connexion** : micro visible ; au toucher, « La dictée a besoin d'internet. » sans démarrer. « Écouter » marche hors connexion.

## Accessibilité

- Boutons avec nom accessible (ci-dessus) ; le nom contient le texte visible (« Écouter… », « Arrêter… »). Pas de `aria-pressed` : le nom change.
- Tab : champ, micro, Envoyer (assistant) ; champ, micro (recherche). Entrée et Espace activent le micro comme le toucher.
- « J'écoute… » en `role="status"` ; erreurs de l'assistant en `role="alert"` (`ErrBox`) ; toast en `role="status"`.
- Contrastes clair et sombre ≥ 4,5:1 : `--rect` sur `--rect-bg` (badge et micro en écoute), `--ink` sur `--paper` (« Écouter »), `--muted` sur `--paper` et `--sand` (mention, icône au repos).
- Pulsation de la pastille seulement si `prefers-reduced-motion: no-preference` (règle existante de `.live`).
