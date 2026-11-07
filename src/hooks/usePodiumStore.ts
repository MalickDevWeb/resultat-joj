import { useCallback, useEffect, useState } from 'react';
import { SEED_EVENTS, SEED_PENDING, SOURCE, cur, isImport, now, type Place, type PodiumEvent, type Session } from '../data';

const KEY = 'podium-dakar-2026:v2';

interface Data {
  events: PodiumEvent[];
  pending: Session[];
  importedAt?: string; // date de l'import Wikipédia sur lequel reposent ces données
}

const seed = (): Data => structuredClone({ events: SEED_EVENTS, pending: SEED_PENDING, importedAt: SOURCE.fetchedAt });

/** Un podium touché par un chef de site (publié, validé ou rectifié dans l'application). */
const isLocal = (e: PodiumEvent) => e.versions.some((v) => !isImport(v));

/**
 * Nouvel import : on repart des données importées, en gardant le travail fait dans l'application
 * (podiums publiés ou rectifiés par un chef de site).
 */
function merge(old: Data): Data {
  const fresh = seed();
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
      if (Array.isArray(d.events) && Array.isArray(d.pending)) return d.importedAt === SOURCE.fetchedAt ? d : merge(d);
    }
  } catch {
    /* stockage indisponible : on repart des données importées */
  }
  return seed();
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

  /** Publie un nouveau podium (provisoire) pour une épreuve en attente. */
  const publish = useCallback((sessionId: string, pod: Place[]): string | null => {
    const src = data.pending.find((x) => x.id === sessionId);
    if (!src) return null;
    const e: PodiumEvent = {
      ...src,
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

  const reset = useCallback(() => setData(seed()), []);

  return { ...data, publish, validate, rectify, reset };
}
