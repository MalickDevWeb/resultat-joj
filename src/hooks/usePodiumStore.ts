import { useCallback, useEffect, useState } from 'react';
import { SEED_EVENTS, SEED_PENDING, cur, now, type Place, type PodiumEvent, type Session } from '../data';

const KEY = 'podium-dakar-2026:v1';

interface Data {
  events: PodiumEvent[];
  pending: Session[];
}

const seed = (): Data => structuredClone({ events: SEED_EVENTS, pending: SEED_PENDING });

function load(): Data {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw) as Data;
      if (Array.isArray(d.events) && Array.isArray(d.pending)) return d;
    }
  } catch {
    /* stockage indisponible : on repart des données de démo */
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
      id: 'e' + Date.now(),
      status: 'prov',
      versions: [{ v: 1, at: now(), by: 'Vous (chef de site)', motif: null, valid: null, pod }],
    };
    setData((d) => ({ events: [...d.events, e], pending: d.pending.filter((x) => x.id !== sessionId) }));
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
