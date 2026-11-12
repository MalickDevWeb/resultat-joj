import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { creerGestionnaire, finalesDuJour, type Finale, type Redaction } from '../api/resume.js';
import { joursAEssayer } from '../src/components/DaySummary';

/** Extrait réel du programme officiel du 11 novembre : deux finales avec médaillés, un assaut de poule sans médaille. */
const FINALES = readFileSync(new URL('./fixtures/finales-du-jour.html', import.meta.url), 'utf8');
const SANS_FINALE = readFileSync(new URL('./fixtures/programme-officiel.html', import.meta.url), 'utf8');
const EPEE = 'FENMEPEE--------------FNL-000100--';
const FUTSAL = 'FBSWTEAM5-------------FNL-000100--';

/** Le 12 novembre 2026 à 15 h, heure de Dakar. */
const MAINTENANT = () => new Date('2026-11-12T15:00:00Z');

const redaction = (epreuves: string[]): Redaction => ({
  titre: 'Le Canada et l’Ukraine en or',
  paragraphes: ['Simon Shan offre l’or au Canada à l’épée.', 'L’Ukraine remporte le futsal féminin.'],
  epreuves,
});

/** Gestionnaire avec un faux site officiel et un faux rédacteur : les tests n'appellent jamais le réseau ni Claude. */
const monter = (page = FINALES, rediger = vi.fn(async (_f: Finale[]) => redaction([EPEE, FUTSAL]))) => {
  const lireProgramme = vi.fn(async (_jour: string) => page);
  return { gerer: creerGestionnaire({ lireProgramme, rediger, maintenant: MAINTENANT }), lireProgramme, rediger };
};

/** Réponse HTTP minimale, comme celle de Node que reçoit la fonction Vercel. */
const appeler = async (gerer: ReturnType<typeof creerGestionnaire>, url: string, method = 'GET') => {
  const res = { statusCode: 0, headers: {} as Record<string, string>, body: '' };
  await gerer({ method, url }, Object.assign(res, {
    setHeader: (k: string, v: string) => { res.headers[k.toLowerCase()] = v; },
    end: (b: string) => { res.body = b; },
  }));
  return { status: res.statusCode, headers: res.headers, json: JSON.parse(res.body) };
};

describe('005 — Résumé de la journée rédigé par Claude', () => {
  it('005-AS1: a day with finals gets Claude’s summary and the cited events with their official podium', async () => {
    const { gerer, lireProgramme } = monter();
    const r = await appeler(gerer, '/api/resume?jour=2026-11-11');
    expect(r.status).toBe(200);
    expect(lireProgramme).toHaveBeenCalledWith('11112026');
    expect(r.json.jour).toBe('2026-11-11');
    expect(r.json.titre).toBe('Le Canada et l’Ukraine en or');
    expect(r.json.paragraphes).toHaveLength(2);
    expect(r.json.epreuves.map((e: Finale) => e.id)).toEqual([EPEE, FUTSAL]);
    expect(r.json.epreuves[0].podium).toEqual([
      { m: 1, c: 'CAN', n: 'SHAN Simon' },
      { m: 2, c: 'SRB', n: 'RADJENOVIC Vukan' },
      { m: 3, c: 'BEL', n: 'van LAECKE Wout' },
    ]);
  });

  it('005-AS2: a day without any podium answers 404 and Claude is not called', async () => {
    const { gerer, rediger } = monter(SANS_FINALE);
    const r = await appeler(gerer, '/api/resume?jour=2026-11-11');
    expect(r.status).toBe(404);
    expect(r.json.code).toBe('AUCUN_PODIUM');
    expect(rediger).not.toHaveBeenCalled();
  });

  it('005-AS3: an event cited by Claude that is not a final of the day is dropped', async () => {
    const { gerer } = monter(FINALES, vi.fn(async () => redaction([EPEE, 'INVENTEE-PAR-CLAUDE'])));
    const r = await appeler(gerer, '/api/resume?jour=2026-11-11');
    expect(r.json.epreuves.map((e: Finale) => e.id)).toEqual([EPEE]);
  });

  it.each([
    ['badly written', '11-11-2026'],
    ['before the Games', '2026-10-30'],
    ['after the Games', '2026-11-14'],
    ['in the future', '2026-11-13'],
    ['not a real date', '2026-11-31'],
  ])('005-AS4: a day %s answers 400 and neither the official site nor Claude is called', async (_cas, jour) => {
    const { gerer, lireProgramme, rediger } = monter();
    const r = await appeler(gerer, `/api/resume?jour=${jour}`);
    expect(r.status).toBe(400);
    expect(r.json.code).toBe('JOUR_INVALIDE');
    expect(lireProgramme).not.toHaveBeenCalled();
    expect(rediger).not.toHaveBeenCalled();
  });

  it('005-AS4: without a day, the summary is the one of today in Dakar', async () => {
    const { gerer, lireProgramme } = monter();
    await appeler(gerer, '/api/resume');
    expect(lireProgramme).toHaveBeenCalledWith('12112026');
  });

  it('005-AS5: an unknown parameter answers 400, a method other than GET answers 405', async () => {
    const { gerer, rediger } = monter();
    const parametre = await appeler(gerer, '/api/resume?jour=2026-11-11&x=1');
    expect([parametre.status, parametre.json.code]).toEqual([400, 'PARAMETRE_INCONNU']);
    const methode = await appeler(gerer, '/api/resume?jour=2026-11-11', 'POST');
    expect([methode.status, methode.json.code]).toEqual([405, 'METHODE_INTERDITE']);
    expect(rediger).not.toHaveBeenCalled();
  });

  it.each([
    ['a repeated day', '/api/resume?jour=2026-11-11&jour=1'],
    ['an encoded name', '/api/resume?jo%75r=2026-11-11'],
    ['an encoded value', '/api/resume?jour=2026%2D11-11'],
    ['a trailing &', '/api/resume?jour=2026-11-11&'],
    ['an empty query', '/api/resume?'],
  ])('005-AS5: an address with %s answers 400, so the cache cannot be bypassed', async (_cas, url) => {
    const { gerer, rediger } = monter();
    const r = await appeler(gerer, url);
    expect([r.status, r.json.code]).toEqual([400, 'PARAMETRE_INCONNU']);
    expect(rediger).not.toHaveBeenCalled();
  });

  it('005-AS6: when Claude fails, the answer is 503 with a clear French sentence', async () => {
    const { gerer } = monter(FINALES, vi.fn(async () => { throw new Error('clé absente'); }));
    const r = await appeler(gerer, '/api/resume?jour=2026-11-11');
    expect(r.status).toBe(503);
    expect(r.json).toEqual({ code: 'RESUME_INDISPONIBLE', message: 'Le résumé du jour est momentanément indisponible. Réessayez dans quelques minutes.' });
    expect(r.headers['cache-control']).toBe('public, s-maxage=60');
  });

  it('005-AS7: a past day is cached 24 h, today 30 min', async () => {
    const { gerer } = monter();
    const passe = await appeler(gerer, '/api/resume?jour=2026-11-11');
    const aujourdhui = await appeler(gerer, '/api/resume?jour=2026-11-12');
    expect(passe.headers['cache-control']).toBe('public, s-maxage=86400, stale-while-revalidate=3600');
    expect(aujourdhui.headers['cache-control']).toBe('public, s-maxage=1800, stale-while-revalidate=600');
  });

  it('005-AS7: an error is never cached more than 60 s', async () => {
    const sansPodium = await appeler(monter(SANS_FINALE).gerer, '/api/resume?jour=2026-11-11');
    const jourInvalide = await appeler(monter().gerer, '/api/resume?jour=2026-10-01');
    expect([sansPodium.status, sansPodium.headers['cache-control']]).toEqual([404, 'public, s-maxage=60']);
    expect([jourInvalide.status, jourInvalide.headers['cache-control']]).toEqual([400, 'public, s-maxage=60']);
  });

  it.each([
    ['before the Games', '2026-10-20', []],
    ['on the first day', '2026-10-31', ['2026-10-31']],
    ['during the Games', '2026-11-12', ['2026-11-12', '2026-11-11']],
    ['on the last day', '2026-11-13', ['2026-11-13', '2026-11-12']],
    ['after the Games', '2026-11-20', ['2026-11-13']],
  ])('005-AS9: %s, the screen only asks for days of the Games', (_cas, aujourdhui, jours) => {
    expect(joursAEssayer(aujourdhui)).toEqual(jours);
  });

  it('005-AS10: a day is written only once, whatever the address, even if the CDN cache is bypassed', async () => {
    const { gerer, rediger } = monter();
    await appeler(gerer, '/api/resume?jour=2026-11-11');
    const seconde = await appeler(gerer, '/api/resume?jour=2026-11-11');
    expect(seconde.status).toBe(200);
    expect(rediger).toHaveBeenCalledTimes(1);
  });

  it('005-AS10: after a failure of Claude, the day is not retried for 60 s', async () => {
    let maintenant = new Date('2026-11-12T15:00:00Z');
    const rediger = vi.fn(async (_f: Finale[]): Promise<Redaction> => { throw new Error('Claude indisponible'); });
    const gerer = creerGestionnaire({ lireProgramme: async () => FINALES, rediger, maintenant: () => maintenant });
    expect((await appeler(gerer, '/api/resume?jour=2026-11-11')).status).toBe(503);
    expect((await appeler(gerer, '/api/resume?jour=2026-11-11')).status).toBe(503);
    expect(rediger).toHaveBeenCalledTimes(1);
    maintenant = new Date('2026-11-12T15:01:01Z');
    await appeler(gerer, '/api/resume?jour=2026-11-11');
    expect(rediger).toHaveBeenCalledTimes(2);
  });

  it('005-AS8: the writer only receives the official finals of the day', async () => {
    const { gerer, rediger } = monter();
    await appeler(gerer, '/api/resume?jour=2026-11-11');
    expect(rediger).toHaveBeenCalledTimes(1);
    expect(rediger.mock.calls[0][0]).toEqual(finalesDuJour(FINALES));
    expect(finalesDuJour(FINALES).map((f) => [f.disc, f.podium.length])).toEqual([['Escrime', 3], ['Futsal', 3]]);
  });
});
