import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  creerDictee,
  creerLecteur,
  creerMention,
  reconnaissanceDuNavigateur,
  syntheseDuNavigateur,
  type Dictee,
} from './voix';

// ---------- Écouter : une seule lecture pour toute l'application ----------

const moteur = syntheseDuNavigateur();
const lecteur = moteur ? creerLecteur(moteur) : null;

/** Le navigateur sait-il lire à voix haute ? Sinon, aucun bouton « Écouter ». */
export const lectureDisponible = lecteur !== null;

/** Ce qui est lu en ce moment (l'identifiant de son bouton), ou null. */
let enLecture: string | null = null;
const abonnes = new Set<() => void>();
const annoncer = (id: string | null) => {
  enLecture = id;
  abonnes.forEach((f) => f());
};
const abonner = (f: () => void) => {
  abonnes.add(f);
  return () => { abonnes.delete(f); };
};

/** Arrête la lecture en cours ; avec un identifiant, seulement si c'est celle-là. */
export function arreterLecture(id?: string) {
  if (id === undefined || enLecture === id) lecteur?.arreter();
}

/** Bouton « Écouter » : lit ses phrases, ou arrête sa lecture. Démonté pendant la lecture, il l'arrête. */
export function useLecture(id: string) {
  const lit = useSyncExternalStore(abonner, () => enLecture === id, () => false);
  const basculer = useCallback((phrases: string[]) => {
    if (!lecteur) return;
    if (enLecture === id) {
      lecteur.arreter();
      return;
    }
    annulerDictee();
    annoncer(id);
    lecteur.lire(phrases, () => { if (enLecture === id) annoncer(null); });
  }, [id]);
  useEffect(() => () => arreterLecture(id), [id]);
  return { lit, basculer };
}

// ---------- Dicter : un seul micro à la fois ----------

const Reconnaissance = reconnaissanceDuNavigateur();

/** Le navigateur sait-il transcrire la voix ? Sinon, aucun bouton micro. */
export const dicteeDisponible = Reconnaissance !== null;

function stockageLocal(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}
const premiereDictee = creerMention(stockageLocal());

/** La dictée en cours, avec de quoi remettre son bouton au repos. */
interface DicteeActive {
  dictee: Dictee | null;
  annuler: () => void;
}
let active: DicteeActive | null = null;

function annulerDictee() {
  const a = active;
  active = null;
  a?.annuler();
}

// Fenêtre fermée ou rechargée : le micro et la lecture s'arrêtent.
if (typeof window !== 'undefined') {
  addEventListener('pagehide', () => {
    annulerDictee();
    lecteur?.arreter();
  });
}

interface RappelsDuMicro {
  surTexte: (texte: string) => void;
  surErreur: (phrase: string) => void;
  /** Première dictée : la mention de confidentialité est à montrer. */
  surPrevenir?: () => void;
}

/**
 * Micro d'un champ. Il ne démarre qu'au toucher (`basculer`) et s'arrête à la fin de la phrase, au second toucher,
 * à `annuler`, quand la page est cachée ou que le composant disparaît. Démarrer arrête la lecture en cours.
 */
export function useDictee(rappels: RappelsDuMicro) {
  const [ecoute, setEcoute] = useState(false);
  const [mention, setMention] = useState(false);
  const derniers = useRef(rappels);
  derniers.current = rappels;
  const mienne = useRef<DicteeActive | null>(null);

  const annuler = useCallback(() => {
    if (mienne.current !== null && active === mienne.current) annulerDictee();
  }, []);

  const demarrer = () => {
    if (!Reconnaissance) return;
    annulerDictee();
    arreterLecture();
    const enLigne = navigator.onLine;
    const prevenir = enLigne && premiereDictee();
    const cette: DicteeActive = {
      dictee: null,
      annuler: () => {
        cette.dictee?.annuler();
        terminer();
      },
    };
    const terminer = () => {
      setEcoute(false);
      setMention(false);
      if (active === cette) active = null;
    };
    active = cette;
    mienne.current = cette;
    setEcoute(true);
    setMention(prevenir);
    if (prevenir) derniers.current.surPrevenir?.();
    cette.dictee = creerDictee(Reconnaissance, {
      surTexte: (t) => derniers.current.surTexte(t),
      surErreur: (p) => derniers.current.surErreur(p),
      surFin: terminer,
    }, enLigne);
  };

  const basculer = () => {
    if (ecoute && mienne.current?.dictee) mienne.current.dictee.arreter();
    else if (!ecoute) demarrer();
  };

  useEffect(() => {
    const cachee = () => { if (document.visibilityState === 'hidden') annuler(); };
    document.addEventListener('visibilitychange', cachee);
    return () => {
      document.removeEventListener('visibilitychange', cachee);
      annuler();
    };
  }, [annuler]);

  return { disponible: dicteeDisponible, ecoute, mention, basculer, annuler };
}
