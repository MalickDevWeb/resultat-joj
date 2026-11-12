import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import handler, { parseSchedule } from '../api/live.js';

/** Extrait réel du programme officiel (webresult.apps.dakar2026.org) : deux assauts d'escrime terminés, un match de handball à venir. */
const PAGE = readFileSync(new URL('./fixtures/programme-officiel.html', import.meta.url), 'utf8');
const withStatus = (status: string) => PAGE.replace('class="textStatus">Finished', `class="textStatus">${status}`);

/** Réponse HTTP minimale, comme celle de Node que reçoit la fonction Vercel. */
const fakeResponse = () => {
  const res = { statusCode: 0, headers: {} as Record<string, string>, body: '' };
  return Object.assign(res, {
    setHeader: (k: string, v: string) => { res.headers[k.toLowerCase()] = v; },
    end: (b: string) => { res.body = b; },
  });
};

describe('003 — Épreuves en direct (programme officiel)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('003-AS1: an event whose status is "Running" is live', () => {
    expect(parseSchedule(withStatus('Running'))[0].state).toBe('live');
  });

  it('003-AS2: "Scheduled" is upcoming and "Finished" is done', () => {
    expect(parseSchedule(PAGE).map((x) => [x.status, x.state])).toEqual([
      ['Finished', 'done'], ['Finished', 'done'], ['Scheduled', 'next'],
    ]);
  });

  it('003-AS3: a match gives both sides, their score and the winner', () => {
    expect(parseSchedule(PAGE)[0].teams).toEqual([
      { c: 'BEL', n: 'van LAECKE Wout', score: '2' },
      { c: 'ROU', n: 'POPA Stefan', score: '5', win: true },
    ]);
  });

  it('003-AS4: an event without its own time takes the time of the previous one', () => {
    expect(parseSchedule(PAGE).map((x) => x.time)).toEqual(['09:00', '09:00', '09:30']);
  });

  it('003-AS5: the site is deduced from the venue, and the event name is in French', () => {
    const [fencing, , handball] = parseSchedule(PAGE);
    expect([fencing.disc, fencing.site, fencing.event]).toEqual(['Escrime', 'Diamniadio', 'Épée individuel garçons, poule 2 assaut #22']);
    expect([handball.disc, handball.site, handball.event]).toEqual(['Handball de plage', 'Saly', 'finale filles, pour le bronze #23']);
  });

  it('003-AS8: a link that would leave the official site is dropped', () => {
    const piege = PAGE.replace(/href="\/hide\/[^"]*"/, 'href="@site-pirate.example/x"');
    const [lien] = parseSchedule(piege);
    expect(lien.url).toBeNull();
    expect(parseSchedule(PAGE)[1].url).toMatch(/^https:\/\/webresult\.apps\.dakar2026\.org\/hide\//);
  });

  it('003-AS6: /api/live answers the live events, cached one minute', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(withStatus('Running'))));
    const res = fakeResponse();
    await handler({}, res);
    const body = JSON.parse(res.body);
    expect(res.statusCode).toBe(200);
    expect(res.headers['cache-control']).toContain('s-maxage=60');
    expect(body.live.map((x: { disc: string }) => x.disc)).toEqual(['Escrime']);
    expect(body.done).toBe(1);
  });

  it('003-AS7: when the official schedule is unavailable, /api/live answers 502 with a clear message', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503 })));
    const res = fakeResponse();
    await handler({}, res);
    expect(res.statusCode).toBe(502);
    expect(JSON.parse(res.body)).toEqual({ error: 'Programme officiel momentanément indisponible.' });
  });
});
