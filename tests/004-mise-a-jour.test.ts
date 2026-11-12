import { describe, expect, it } from 'vitest';
import type { Place, PodiumEvent, Session, Version } from '../src/data';
import { merge, type Data } from '../src/hooks/usePodiumStore';

const pod = (gold: string): Place[] => [{ n: 'A', c: gold, m: 1 }, { n: 'B', c: 'FRA', m: 2 }, { n: 'C', c: 'JPN', m: 3 }];
const fromWiki = (gold: string): Version => ({ v: 1, at: '5 nov.', by: 'Wikipédia', motif: null, valid: 'Source Wikipédia · 5 nov.', pod: pod(gold) });
const byChief = (v: number, gold: string, motif: string | null = null): Version => ({ v, at: '10:40', by: 'Vous (chef de site)', motif, valid: null, pod: pod(gold) });
const ev = (id: string, ...versions: Version[]): PodiumEvent => ({
  id, disc: 'Judo', name: id, site: 'Diamniadio', venue: '', time: '', status: versions.length > 1 ? 'rect' : 'off', versions,
});
const session = (id: string): Session => ({ id, disc: 'Judo', name: id, site: 'Diamniadio', venue: '', time: '' });

describe('004 — Mise à jour automatique sans perdre le travail des chefs de site', () => {
  it('004-AS1: a newer import replaces the imported podiums and the upcoming events', () => {
    const old: Data = { events: [ev('e1', fromWiki('SEN'))], pending: [session('e2')], importedAt: '2026-11-10T00:00:00Z' };
    const fresh: Data = { events: [ev('e1', fromWiki('SEN')), ev('e2', fromWiki('MAR'))], pending: [], importedAt: '2026-11-11T00:00:00Z' };
    const d = merge(old, fresh);
    expect(d.events.map((e) => e.id)).toEqual(['e1', 'e2']);
    expect(d.pending).toEqual([]);
    expect(d.importedAt).toBe('2026-11-11T00:00:00Z');
  });

  it('004-AS2: a podium rectified by a site chief is kept, with its history', () => {
    const rectified = ev('e1', fromWiki('FRA'), byChief(2, 'SEN', 'Erreur de saisie'));
    const fresh: Data = { events: [ev('e1', fromWiki('FRA'))], pending: [] };
    const d = merge({ events: [rectified], pending: [] }, fresh);
    expect(d.events).toEqual([rectified]);
  });

  it('004-AS3: a podium published in the app for an upcoming event is kept, and the event is no longer upcoming', () => {
    const published = ev('e2', byChief(1, 'SEN'));
    const fresh: Data = { events: [], pending: [session('e2'), session('e3')] };
    const d = merge({ events: [published], pending: [session('e3')] }, fresh);
    expect(d.events).toEqual([published]);
    expect(d.pending.map((s) => s.id)).toEqual(['e3']);
  });
});
