# 007 — La voix : dicter et écouter

**Statut** : Validée
**PRD** : specs/prd-podium-dakar.md, TR7

## Contexte

Au stade, le supporter a une main prise et peu de temps : taper « Sénégal lutte de plage » sur un téléphone est lent. Le navigateur sait transcrire la voix et lire un texte en français, sans serveur ni crédit. La voix complète la recherche et l'assistant ; elle ne les remplace pas.

## User stories

- En tant que supporter, je veux dicter ma recherche ou ma question, afin d'aller plus vite qu'au clavier.
- En tant que supporter, je veux écouter une réponse ou le résumé du jour, afin de suivre sans regarder l'écran.

## Scénarios d'acceptation

### AS1 — Dicter une recherche

- **Quand** le visiteur touche le micro de la recherche et dit « Sénégal lutte »
- **Alors** la recherche contient « Sénégal lutte » et les résultats se filtrent, comme s'il l'avait tapé
- Sur téléphone, où la recherche n'est pas affichée, la voix passe par l'assistant (AS2)

### AS2 — Dicter une question à l'assistant, qui part aussitôt (décision de l'humain)

- **Quand** le visiteur dicte « combien de médailles pour le Sénégal »
- **Alors** le champ contient « Combien de médailles pour le Sénégal ? » (majuscule, point d'interrogation), et la question est envoyée aussitôt la phrase finie, comme une recherche directe, sans toucher « Envoyer » ; une dictée de plus de 500 caractères est coupée à 500 ; si rien n'a été entendu, rien n'est envoyé

### AS3 — Le micro ne s'allume que sur un geste, et s'arrête seul

- **Alors** le micro ne démarre qu'au toucher du bouton, montre « J'écoute… » tant qu'il écoute ; pendant que le visiteur parle, le bouton et des ondes bougent au rythme de sa voix et les mots entendus s'écrivent au fur et à mesure dans le champ (décision de l'humain) ; seule la phrase finale est gardée et envoyée ; il s'arrête à la fin de la phrase, au second toucher, ou en quittant l'écran

### AS4 — Une dictée impossible est expliquée

- **Quand** le micro est refusé, absent, n'entend rien, ou que le réseau manque
- **Alors** une phrase claire en français : « Autorisez le micro pour dicter. », « Aucun micro n'a été trouvé. », « Je n'ai rien entendu. Réessayez. », « La dictée a besoin d'internet. » ; toute autre erreur : « La dictée n'a pas fonctionné. Réessayez. »

### AS5 — Écouter une réponse et le résumé du jour

- **Quand** le visiteur touche « Écouter » sur une réponse de l'assistant ou sur le résumé du jour
- **Alors** le texte est lu en français ; le bouton devient « Arrêter » ; une seule lecture à la fois

### AS8 — On répond comme on a demandé (décision de l'humain)

- **Quand** le visiteur pose sa question à la voix
- **Alors** la réponse s'écrit dans le fil et est lue aussitôt à voix haute, sans toucher ▶︎ (le toucher du micro est le geste) ; elle est lue sans les marques de gras ni les emojis ; toucher ■ l'arrête
- **Quand** il l'a écrite au clavier (ou touché un raccourci)
- **Alors** la réponse est seulement écrite ; ▶︎ reste là pour l'écouter

### AS6 — Sans voix dans le navigateur, rien ne change

- **Alors** sans reconnaissance vocale, aucun bouton micro ; sans synthèse vocale, aucun bouton « Écouter » ; la recherche et l'assistant restent utilisables au clavier

### AS7 — Le micro est autorisé pour le site seulement

- **Alors** l'en-tête `Permissions-Policy` autorise le micro pour le site lui-même (`microphone=(self)`) et toujours pas la caméra ni la position ; la première dictée prévient que le navigateur peut transcrire la voix sur ses serveurs

## Tâches

- [ ] T01 [007-AS1…AS7] (ux-design) Écrire `design/007-la-voix.md`
- [ ] T02 [007-AS7] (backend) Écrire d'abord le test de l'en-tête dans `tests/007-la-voix.test.ts`, puis `microphone=(self)` dans `vercel.json`
- [ ] T03 [007-AS1…AS6] (frontend) Écrire d'abord les tests des règles pures (transcription, phrases d'erreur, disponibilité) dans `tests/007-la-voix.test.ts`, puis le micro et « Écouter », d'après la note de design

## Hors périmètre

- Les commandes vocales (« ouvre les médailles »), la lecture automatique d'une réponse à une question écrite, l'enregistrement ou l'envoi du son à notre serveur, les autres langues que le français.

## Questions ouvertes

- Hypothèse : on utilise la reconnaissance et la synthèse vocales du navigateur (Web Speech API) ; dans Chrome, la transcription passe par les serveurs de Google, ce que le visiteur est prévenu.
