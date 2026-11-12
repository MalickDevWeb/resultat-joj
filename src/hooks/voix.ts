/**
 * La voix (spec 007) : dicter avec la reconnaissance vocale du navigateur, écouter avec sa synthèse vocale.
 * Rien ne passe par notre serveur. Ce module ne dépend pas de React : ses règles se testent sans navigateur.
 */

/** Une proposition de transcription. */
interface Transcription {
  transcript: string;
}

/** Un résultat : ses propositions, et s'il est définitif. */
type ResultatDeDictee = ArrayLike<Transcription> & { isFinal: boolean };

export interface EvenementResultat {
  resultIndex: number;
  results: ArrayLike<ResultatDeDictee>;
}

export interface EvenementErreur {
  error: string;
}

/** Ce que l'application utilise de `SpeechRecognition` (absent des types de TypeScript). */
export interface ReconnaissanceVocale {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: EvenementResultat) => void) | null;
  onerror: ((e: EvenementErreur) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export type ConstructeurReconnaissance = new () => ReconnaissanceVocale;

declare global {
  interface Window {
    SpeechRecognition?: ConstructeurReconnaissance;
    webkitSpeechRecognition?: ConstructeurReconnaissance;
  }
}

/** Là où le navigateur range ses outils de voix (la fenêtre, ou un faux dans les tests). */
interface SourcesDeVoix {
  SpeechRecognition?: ConstructeurReconnaissance;
  webkitSpeechRecognition?: ConstructeurReconnaissance;
  speechSynthesis?: SpeechSynthesis;
  SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance;
}

const fenetre = (): SourcesDeVoix => (typeof window === 'undefined' ? {} : window);

/** La reconnaissance vocale du navigateur, ou null s'il n'en a pas (aucun bouton micro). */
export function reconnaissanceDuNavigateur(sources: SourcesDeVoix = fenetre()): ConstructeurReconnaissance | null {
  return sources.SpeechRecognition ?? sources.webkitSpeechRecognition ?? null;
}

// ---------- Dicter ----------

export const AUTORISEZ = 'Autorisez le micro pour dicter.';
export const SANS_MICRO = 'Aucun micro n’a été trouvé.';
export const RIEN_ENTENDU = 'Je n’ai rien entendu. Réessayez.';
export const SANS_INTERNET = 'La dictée a besoin d’internet.';
export const ECHEC = 'La dictée n’a pas fonctionné. Réessayez.';

const PHRASE_DE_L_ERREUR: Record<string, string> = {
  'not-allowed': AUTORISEZ,
  'service-not-allowed': AUTORISEZ,
  'audio-capture': SANS_MICRO,
  'no-speech': RIEN_ENTENDU,
  network: SANS_INTERNET,
};

/** Phrase montrée pour une erreur du navigateur ; rien pour un arrêt voulu. */
export function phraseDeDictee(code: string): string | null {
  if (code === 'aborted') return null;
  return PHRASE_DE_L_ERREUR[code] ?? ECHEC;
}

/** Le texte dicté, sans les espaces autour ni le point final. */
export const nettoyerDictee = (texte: string) => texte.trim().replace(/\s*\.+$/, '').trim();

export interface RappelsDeDictee {
  surTexte: (texte: string) => void;
  surErreur: (phrase: string) => void;
  surFin: () => void;
}

export interface Dictee {
  /** Second toucher : le micro s'arrête et garde ce qu'il a entendu. */
  arreter: () => void;
  /** Écran quitté ou envoi : le micro s'arrête sans rien dire ni rien écrire. */
  annuler: () => void;
}

/**
 * Démarre une dictée d'une phrase, en français, résultats définitifs seulement.
 * À la fin : le texte, ou une phrase d'erreur (une dictée vide compte comme « rien entendu »), puis `surFin`.
 */
export function creerDictee(Reconnaissance: ConstructeurReconnaissance, rappels: RappelsDeDictee, enLigne: boolean): Dictee {
  const inerte: Dictee = { arreter: () => {}, annuler: () => {} };
  if (!enLigne) {
    rappels.surErreur(SANS_INTERNET);
    rappels.surFin();
    return inerte;
  }
  const micro = new Reconnaissance();
  micro.lang = 'fr-FR';
  micro.continuous = false;
  micro.interimResults = false;
  micro.maxAlternatives = 1;

  let texte = '';
  let erreur: string | null = null;
  let voulu = false;
  let fini = false;

  const terminer = () => {
    if (fini) return;
    fini = true;
    const phrase = erreur === null ? null : phraseDeDictee(erreur);
    if (texte.trim()) rappels.surTexte(texte.trim());
    else if (!voulu) rappels.surErreur(phrase ?? RIEN_ENTENDU);
    rappels.surFin();
  };

  micro.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i += 1) {
      const resultat = e.results[i];
      if (resultat?.isFinal) texte += resultat[0]?.transcript ?? '';
    }
  };
  micro.onerror = (e) => { erreur = e.error; };
  micro.onend = terminer;

  try {
    micro.start();
  } catch {
    erreur = 'start';
    terminer();
    return inerte;
  }
  return {
    arreter: () => {
      voulu = true;
      micro.stop();
    },
    annuler: () => {
      fini = true;
      micro.abort();
    },
  };
}

// ---------- Mention de confidentialité ----------

export const MENTION = 'Votre navigateur peut envoyer votre voix à ses serveurs pour l’écrire. Podium Dakar ne l’enregistre pas.';
const CLE_MENTION = 'podium-voix-prevenu';

interface Stockage {
  getItem: (cle: string) => string | null;
  setItem: (cle: string, valeur: string) => void;
}

/**
 * Renvoie une fonction qui dit, à chaque dictée, s'il faut montrer la mention : à la première seulement.
 * Si le stockage échoue, la mention revient à la première dictée de chaque visite.
 */
export function creerMention(stockage: Stockage | null): () => boolean {
  let prevenuCetteVisite = false;
  return () => {
    if (prevenuCetteVisite) return false;
    prevenuCetteVisite = true;
    try {
      if (stockage?.getItem(CLE_MENTION)) return false;
      stockage?.setItem(CLE_MENTION, '1');
    } catch { /* stockage indisponible : la mention reviendra à la prochaine visite */ }
    return true;
  };
}

// ---------- Écouter ----------

export interface VoixDisponible {
  lang: string;
  name: string;
}

/** Ce qu'il faut du navigateur pour lire : dire une phrase (rappel à la fin, `ok` faux si elle a échoué), se taire, ses voix. */
export interface MoteurDeLecture {
  dire: (texte: string, voix: VoixDisponible | null, surFin: (ok: boolean) => void) => void;
  taire: () => void;
  voix: () => VoixDisponible[];
}

/** Une voix française de France si elle existe, sinon une autre voix française, sinon aucune (la langue suffit). */
export function voixFrancaise<V extends VoixDisponible>(voix: V[]): V | null {
  const fr = voix.filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith('fr'));
  return fr.find((v) => v.lang.replace('_', '-').toLowerCase() === 'fr-fr') ?? fr[0] ?? null;
}

/** La synthèse vocale du navigateur, ou null s'il n'en a pas (aucun bouton « Écouter »). */
export function syntheseDuNavigateur(sources: SourcesDeVoix = fenetre()): MoteurDeLecture | null {
  const synthese = sources.speechSynthesis;
  const Enonce = sources.SpeechSynthesisUtterance;
  if (!synthese || !Enonce) return null;
  return {
    dire: (texte, voix, surFin) => {
      const enonce = new Enonce(texte);
      enonce.lang = 'fr-FR';
      enonce.voice = synthese.getVoices().find((v) => v.name === voix?.name && v.lang === voix.lang) ?? null;
      enonce.onend = () => surFin(true);
      enonce.onerror = () => surFin(false);
      synthese.speak(enonce);
    },
    taire: () => synthese.cancel(),
    voix: () => synthese.getVoices(),
  };
}

export interface Lecteur {
  /** Lit les phrases dans l'ordre ; arrête d'abord la lecture précédente. `surFin` vient à la fin, à l'arrêt ou à l'échec. */
  lire: (phrases: string[], surFin: () => void) => void;
  arreter: () => void;
}

/** Une seule lecture à la fois. */
export function creerLecteur(moteur: MoteurDeLecture): Lecteur {
  let lecture = 0;
  let surFinEnCours: (() => void) | null = null;

  const finir = () => {
    const surFin = surFinEnCours;
    surFinEnCours = null;
    surFin?.();
  };
  const arreter = () => {
    if (surFinEnCours === null) return;
    lecture += 1;
    moteur.taire();
    finir();
  };
  const lire = (phrases: string[], surFin: () => void) => {
    arreter();
    const cette = ++lecture;
    surFinEnCours = surFin;
    const aDire = phrases.map((p) => p.trim()).filter(Boolean);
    if (aDire.length === 0) return finir();
    const voix = voixFrancaise(moteur.voix());
    aDire.forEach((phrase, i) => moteur.dire(phrase, voix, (ok) => {
      if (cette !== lecture) return;
      if (!ok) arreter();
      else if (i === aDire.length - 1) finir();
    }));
  };
  return { lire, arreter };
}
