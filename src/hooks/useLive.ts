import { useEffect, useState } from 'react';
import { NOC, type Session } from '../data';

/** Épreuve du programme officiel, telle que renvoyée par /api/live. */
interface LiveItem {
  id: string;
  disc: string;
  event: string;
  time: string;
  status: string;
  venue: string;
  location: string;
  site: string;
  teams: { c: string; n: string; score: string; win?: boolean }[];
  url: string | null;
}

/** Épreuve en cours, au format des sessions de l'application. */
export interface LiveSession extends Session {
  status: string;
  teams: LiveItem['teams'];
}

const REFRESH_MS = 60 * 1000;

const estObjet = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;
const texte = (x: unknown): x is string => typeof x === 'string';

/** Vérifie la forme d'une épreuve reçue plutôt que de la croire sur parole. */
function estEpreuve(x: unknown): x is LiveItem {
  return estObjet(x) && ['id', 'disc', 'event', 'time', 'status', 'venue', 'location', 'site'].every((k) => texte(x[k]))
    && (x.url === null || texte(x.url))
    && Array.isArray(x.teams) && x.teams.every((t) => estObjet(t) && texte(t.c) && texte(t.n) && texte(t.score));
}
const epreuves = (x: unknown): LiveItem[] => (Array.isArray(x) ? x.filter(estEpreuve) : []);

/** « Espagne 2–1 Sénégal » pour un match, « Popa contre Diop » sans score. */
function versus(teams: LiveItem['teams']) {
  if (teams.length !== 2) return '';
  const name = (t: LiveItem['teams'][number]) => (t.n.toUpperCase() === t.n || /^[A-Z][a-z]+$/.test(t.n) ? NOC[t.c] ?? t.n : t.n);
  const [a, b] = teams;
  return a.score || b.score ? `${name(a)} ${a.score || 0}–${b.score || 0} ${name(b)}` : `${name(a)} contre ${name(b)}`;
}

const toSession = (x: LiveItem): LiveSession => {
  const vs = versus(x.teams);
  return {
    id: 'live-' + x.id,
    disc: x.disc,
    name: vs ? `${x.event} · ${vs}` : x.event,
    site: x.site,
    venue: x.location ? `${x.venue}, ${x.location}` : x.venue,
    time: x.time,
    url: x.url ?? undefined,
    status: x.status,
    teams: x.teams,
  };
};

/** Épreuves en cours selon le programme officiel, rafraîchies chaque minute. */
export function useLive() {
  const [live, setLive] = useState<LiveSession[]>([]);
  const [next, setNext] = useState<LiveSession[]>([]);

  useEffect(() => {
    let stop = false;
    const load = async () => {
      if (document.visibilityState === 'hidden' || !navigator.onLine) return;
      try {
        const r = await fetch('/api/live');
        if (!r.ok) return;
        const d: unknown = await r.json();
        if (stop || !estObjet(d) || !Array.isArray(d.live)) return;
        setLive(epreuves(d.live).map(toSession));
        setNext(epreuves(d.next).map(toSession));
      } catch {
        /* hors ligne ou programme indisponible : on garde l'affichage actuel */
      }
    };
    load();
    const t = setInterval(load, REFRESH_MS);
    const onVisible = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', load);
    return () => {
      stop = true;
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', load);
    };
  }, []);

  return { live, next };
}
