import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import handler, { epreuveLisible, nomLisible, parseSchedule } from '../api/live.js';

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
      { c: 'BEL', n: 'Wout van Laecke', score: '2' },
      { c: 'ROU', n: 'Stefan Popa', score: '5', win: true },
    ]);
  });

  it('003-AS4: an event without its own time takes the time of the previous one', () => {
    expect(parseSchedule(PAGE).map((x) => x.time)).toEqual(['09:00', '09:00', '09:30']);
  });

  it('003-AS5: the site is deduced from the venue, and the event name is in French', () => {
    const [fencing, , handball] = parseSchedule(PAGE);
    expect([fencing.disc, fencing.site, fencing.event]).toEqual(['Escrime', 'Diamniadio', 'Épée individuel garçons, poule 2']);
    expect([handball.disc, handball.site, handball.event]).toEqual(['Handball de plage', 'Saly', 'match pour le bronze filles']);
  });

  it('003-AS8: a link that would leave the official site is dropped', () => {
    const piege = PAGE.replace(/href="\/hide\/[^"]*"/, 'href="@site-pirate.example/x"');
    const [lien] = parseSchedule(piege);
    expect(lien.url).toBeNull();
    expect(parseSchedule(PAGE)[1].url).toMatch(/^https:\/\/webresult\.apps\.dakar2026\.org\/hide\//);
  });

  it.each([
    ['GARCIA Grenyelis', 'Grenyelis Garcia'],
    ['TORRES SANTIAGO Jesfred Joel', 'Jesfred Joel Torres Santiago'],
    ['MEIRELLES da COSTA Rafaela', 'Rafaela Meirelles da Costa'],
    ['FEMER-PEDERSEN Sarah Natasha', 'Sarah Natasha Femer-Pedersen'],
    ['AL-ASADI Hayder', 'Hayder Al-Asadi'],
    ['van LAECKE Wout', 'Wout van Laecke'],
    ["People's Republic of China", "People's Republic of China"],
    ['Senegal', 'Senegal'],
  ])('003-AS10: an athlete is written « Prénom Nom »: %s → %s', (brut, lisible) => {
    expect(nomLisible(brut)).toBe(lisible);
  });

  it.each([
    ["51kg filles, finale pour l'or #95", '51 kg filles, finale'],
    ["finale filles, pour l'or #16", 'finale filles'],
    ['finale filles, pour le bronze #23', 'match pour le bronze filles'],
    ['Épée individuel garçons, finale pour le bronze #12', 'Épée individuel garçons, match pour le bronze'],
    ['+63kg filles, huitièmes combat #401', '+63 kg filles, huitièmes'],
    ['Windsurfing Opening Series garçons, course 10', 'Windsurfing Opening Series garçons, course 10'],
  ])('003-AS10: an event is written without its match number: %s → %s', (brut, lisible) => {
    expect(epreuveLisible(brut)).toBe(lisible);
  });

  it('003-AS6: /api/live answers the live events, cached one minute', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(withStatus('Running'))));
    const res = fakeResponse();
    await handler({ method: 'GET', url: '/api/live' }, res);
    const body = JSON.parse(res.body);
    expect(res.statusCode).toBe(200);
    expect(res.headers['cache-control']).toContain('s-maxage=60');
    expect(body.live.map((x: { disc: string }) => x.disc)).toEqual(['Escrime']);
    expect(body.done).toBe(1);
  });

  it.each([
    ['a query string', 'GET', '/api/live?1'],
    ['another method', 'POST', '/api/live'],
  ])('003-AS9: /api/live refuses %s, so the official site is read at most once a minute', async (_cas, method, url) => {
    const fetch = vi.fn(async () => new Response(PAGE));
    vi.stubGlobal('fetch', fetch);
    const res = fakeResponse();
    await handler({ method, url }, res);
    expect(res.statusCode).toBe(method === 'GET' ? 400 : 405);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('003-AS7: when the official schedule is unavailable, /api/live answers 502 with a clear message', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503 })));
    const res = fakeResponse();
    await handler({ method: 'GET', url: '/api/live' }, res);
    expect(res.statusCode).toBe(502);
    expect(JSON.parse(res.body)).toEqual({ code: 'PROGRAMME_INDISPONIBLE', message: 'Programme officiel momentanément indisponible.' });
  });
});
