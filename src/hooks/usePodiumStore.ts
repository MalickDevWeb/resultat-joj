import { useCallback, useEffect, useState } from 'react';
import { SEED_EVENTS, SEED_MEDALS, SEED_PENDING, SOURCE, cur, isImport, now, type Place, type PodiumEvent, type Session } from '../data';

const KEY = 'podium-dakar-2026:v2';
/** Les résultats sont relus sur Wikipédia toutes les 6 heures. */
const REFRESH_MS = 6 * 60 * 60 * 1000;

export interface Data {
  events: PodiumEvent[];
  pending: Session[];
  importedAt?: string; // date de l'import Wikipédia sur lequel reposent ces données
  medals?: Record<string, number[]> | null; // tableau des médailles général de Wikipédia
}

const seed = (): Data => structuredClone({ events: SEED_EVENTS, pending: SEED_PENDING, importedAt: SOURCE.fetchedAt, medals: SEED_MEDALS });

/** Dernière lecture de Wikipédia faite par l'application elle-même. */
const WIKI_KEY = KEY + ':wiki';
function loadWiki(): Data | null {
  try {
    const d = JSON.parse(localStorage.getItem(WIKI_KEY) ?? 'null') as Data | null;
    return d && Array.isArray(d.events) && Array.isArray(d.pending) ? d : null;
  } catch {
    return null;
  }
}
/** Résultats importés les plus récents : ceux livrés avec l'application ou ceux relus depuis. */
function base(): Data {
  const w = loadWiki();
  return w && (w.importedAt ?? '') > (SOURCE.fetchedAt ?? '') ? w : seed();
}

/** Un podium touché par un chef de site (publié, validé ou rectifié dans l'application). */
const isLocal = (e: PodiumEvent) => e.versions.some((v) => !isImport(v));

/**
 * Nouvel import : on repart des données importées, en gardant le travail fait dans l'application
 * (podiums publiés ou rectifiés par un chef de site).
 */
export function merge(old: Data, fresh: Data = base()): Data {
  const local = new Map(old.events.filter(isLocal).map((e) => [e.id, e]));
  const events = fresh.events.map((e) => local.get(e.id) ?? e);
  for (const [id, e] of local) if (!events.some((x) => x.id === id)) events.push(e);
  const pending = fresh.pending.filter((s) => !local.has(s.id));
  return { ...fresh, events, pending };
}

function load(): Data {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw) as Data;
      // Toujours fusionner : les corrections des données importées arrivent aussi chez ceux qui ont déjà ouvert l'application.
      if (Array.isArray(d.events) && Array.isArray(d.pending)) return merge(d);
    }
  } catch {
    /* stockage indisponible : on repart des données importées */
  }
  return base();
}

/** Relit Wikipédia si la dernière lecture date de plus de 6 heures. Renvoie null si rien à faire ou en cas d'échec. */
let running = false;
async function refresh(): Promise<Data | null> {
  const cur = base();
  const age = Date.now() - new Date(cur.importedAt ?? 0).getTime();
  if (running || age < REFRESH_MS || !navigator.onLine) return null;
  running = true;
  try {
    const { buildResultats } = await import('../wikipedia.mjs');
    const r = await buildResultats({ prev: cur });
    const fresh: Data = { events: r.events, pending: r.pending, importedAt: r.source.fetchedAt, medals: r.medals };
    try {
      localStorage.setItem(WIKI_KEY, JSON.stringify(fresh));
    } catch {
      /* ignore */
    }
    return fresh;
  } catch {
    return null; // Wikipédia injoignable : on garde les résultats actuels, nouvel essai plus tard
  } finally {
    running = false;
  }
}

/** Données des podiums, conservées hors ligne dans le navigateur. */
export function usePodiumStore() {
  const [data, setData] = useState<Data>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [data]);

  // Mise à jour automatique depuis Wikipédia : à l'ouverture, puis toutes les 6 heures.
  useEffect(() => {
    const check = () => refresh().then((fresh) => fresh && setData((d) => merge(d, fresh)));
    check();
    const t = setInterval(check, 15 * 60 * 1000); // vérifie souvent, ne relit qu'après 6 h
    const onVisible = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', check);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', check);
    };
  }, []);

  /** Publie un nouveau podium (provisoire) pour une épreuve en attente. */
  const publish = useCallback((sessionId: string, pod: Place[]): string | null => {
    const src = data.pending.find((x) => x.id === sessionId);
    if (!src) return null;
    const { pod: _partial, ...session } = src; // le podium saisi remplace les médailles partielles
    const e: PodiumEvent = {
      ...session,
      id: src.id, // même identifiant que l'épreuve : un import ultérieur la retrouve
      status: 'prov',
      versions: [{ v: 1, at: now(), by: 'Vous (chef de site)', motif: null, valid: null, pod }],
    };
    setData((d) => ({ ...d, events: [...d.events, e], pending: d.pending.filter((x) => x.id !== sessionId) }));
    return e.id;
  }, [data.pending]);

  /** Validation par un second responsable : le podium devient officiel (ou rectifié). */
  const validate = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      events: d.events.map((e) => {
        if (e.id !== id) return e;
        const versions = e.versions.map((v, i) => (i === e.versions.length - 1 ? { ...v, valid: 'M. Sow · ' + now() } : v));
        return { ...e, versions, status: e.versions.length > 1 ? 'rect' : 'off' };
      }),
    }));
  }, []);

  /** Rectification : ajoute une version, l'ancienne reste dans l'historique. */
  const rectify = useCallback((id: string, pod: Place[], motif: string): number => {
    const e = data.events.find((x) => x.id === id);
    const next = e ? cur(e).v + 1 : 1;
    setData((d) => ({
      ...d,
      events: d.events.map((x) =>
        x.id !== id ? x : {
          ...x,
          status: 'rect',
          versions: [...x.versions, { v: cur(x).v + 1, at: now(), by: 'Vous (chef de site)', motif, valid: null, pod }],
        },
      ),
    }));
    return next;
  }, [data.events]);

  const reset = useCallback(() => setData(base()), []);

  return { ...data, publish, validate, rectify, reset };
}
