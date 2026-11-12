import { Readable } from 'node:stream';
import { afterEach, describe, expect, it, vi } from 'vitest';
import gestionnaireReel, {
  contexteDesJeux,
  creerGestionnaire,
  HORS_SUJET,
  type Demande,
  type ReponseDeClaude,
} from '../api/assistant.js';
import type { Resultats } from '../src/wikipedia.mjs';

/** Le 12 novembre 2026 à 15 h, heure de Dakar. */
const MIDI = new Date('2026-11-12T15:00:00Z');

/** Petit extrait des résultats officiels, pour vérifier le contexte ligne à ligne. */
const RESULTATS: Resultats = {
  source: { name: 'Wikipédia', url: 'https://en.wikipedia.org/wiki/2026_Summer_Youth_Olympics', license: 'CC BY-SA 4.0', fetchedAt: '2026-11-12T14:17:05.281Z' },
  sites: ['Dakar', 'Saly'],
  sports: [
    { disc: 'Taekwondo', site: 'Dakar', venue: 'Gymnase Iba Mar Diop' },
    { disc: 'Lutte de plage', site: 'Saly', venue: 'Plage de Saly' },
  ],
  noc: { SEN: 'Sénégal', JOR: 'Jordanie', AZE: 'Azerbaïdjan', MEX: 'Mexique', CHN: 'Chine' },
  medals: { SEN: [5, 0, 5], CHN: [16, 8, 6] },
  events: [{
    id: 'taekwondo-m-73', disc: 'Taekwondo', name: '73 kg garçons', site: 'Dakar', venue: 'Gymnase Iba Mar Diop', time: '', status: 'off',
    versions: [{ v: 1, at: '11 nov.', by: 'Wikipédia', motif: null, valid: null, pod: [
      { n: 'Ahmad Al-Dahamsheh', c: 'JOR', m: 1 },
      { n: 'Adil Kazimli', c: 'AZE', m: 2 },
      { n: 'Jorge Martínez', c: 'MEX', m: 3 },
      { n: 'Ameth Diop', c: 'SEN', m: 3 },
    ] }],
  }],
  pending: [{ id: 'lutte-f-60', disc: 'Lutte de plage', name: '60 kg filles', site: 'Saly', venue: 'Plage de Saly', time: '' }],
};

const reponse = (texte = 'Le Sénégal compte 10 médailles : 5 en or et 5 en bronze.', horsSujet = false): ReponseDeClaude => ({ horsSujet, reponse: texte });

/** Gestionnaire avec un faux assistant et une horloge réglable : les tests n'appellent jamais Claude. */
const monter = (rediger = vi.fn(async (_d: Demande) => reponse())) => {
  const horloge = { maintenant: MIDI };
  const gerer = creerGestionnaire({ rediger, maintenant: () => horloge.maintenant, contexte: contexteDesJeux(RESULTATS) });
  return { gerer, rediger, horloge };
};

interface Appel {
  method?: string;
  url?: string;
  corps?: string;
  ip?: string;
  type?: string;
  /** Corps déjà lu par Vercel (req.body), au lieu du flux. */
  body?: unknown;
}

/** Requête HTTP comme celle de Node (le corps est un flux) que reçoit la fonction, et sa réponse. */
const appeler = async (gerer: ReturnType<typeof creerGestionnaire>, a: Appel = {}) => {
  const corps = a.corps ?? JSON.stringify({ question: 'Combien de médailles pour le Sénégal ?' });
  const req = Object.assign(Readable.from([Buffer.from(corps)]), {
    method: a.method ?? 'POST',
    url: a.url ?? '/api/assistant',
    headers: { 'content-type': a.type ?? 'application/json', 'x-forwarded-for': a.ip ?? '41.82.0.1' },
    ...('body' in a ? { body: a.body } : {}),
  });
  const res = { statusCode: 0, headers: {} as Record<string, string>, body: '' };
  await gerer(req, Object.assign(res, {
    setHeader: (k: string, v: string) => { res.headers[k.toLowerCase()] = v; },
    end: (b: string) => { res.body = b; },
  }));
  return { status: res.statusCode, headers: res.headers, json: JSON.parse(res.body) };
};

const question = (q: unknown, historique?: unknown) => JSON.stringify(historique === undefined ? { question: q } : { question: q, historique });

/** n échanges précédents : une question du visiteur puis une réponse de l'assistant. */
const echanges = (n: number, texte = 'Bonjour') =>
  Array.from({ length: n }, () => [{ role: 'visiteur', texte }, { role: 'assistant', texte }]).flat();

describe('006 — L’assistant des Jeux, rédigé par Claude', () => {
  it('006-AS1: a question about the Games gets Claude’s answer, never cached', async () => {
    const { gerer, rediger } = monter();
    const r = await appeler(gerer);
    expect(r.status).toBe(200);
    expect(r.json).toEqual({ reponse: 'Le Sénégal compte 10 médailles : 5 en or et 5 en bronze.', horsSujet: false });
    expect(r.headers['cache-control']).toBe('no-store');
    expect(rediger).toHaveBeenCalledTimes(1);
    expect(rediger.mock.calls[0][0].question).toBe('Combien de médailles pour le Sénégal ?');
    expect(rediger.mock.calls[0][0].historique).toEqual([]);
    expect(rediger.mock.calls[0][0].aujourdhui).toBe('jeudi 12 novembre 2026');
  });

  it('006-AS1: the assistant receives the official data: medal table, podiums, venues and dates', async () => {
    const { gerer, rediger } = monter();
    await appeler(gerer);
    const contexte = rediger.mock.calls[0][0].contexte;
    expect(contexte).toBe(contexteDesJeux(RESULTATS));
    expect(contexte).toContain('du 31 octobre au 13 novembre 2026');
    expect(contexte).toContain('1. Chine (CHN) : 16 or, 8 argent, 6 bronze, 30 au total');
    expect(contexte).toContain('2. Sénégal (SEN) : 5 or, 0 argent, 5 bronze, 10 au total');
    expect(contexte).toContain('- Taekwondo, 73 kg garçons : bronze, Ameth Diop');
    expect(contexte).toContain('- Taekwondo, 73 kg garçons (Gymnase Iba Mar Diop, Dakar) : or Ahmad Al-Dahamsheh (Jordanie) ; argent Adil Kazimli (Azerbaïdjan) ; bronze Jorge Martínez (Mexique), Ameth Diop (Sénégal)');
    expect(contexte).toContain('- Lutte de plage : Plage de Saly, Saly');
    expect(contexte).toContain('- Lutte de plage, 60 kg filles (Plage de Saly, Saly)');
  });

  it('006-AS1: the real context is built from the results of the application', async () => {
    const { default: resultats } = await import('../src/resultats.json');
    const contexte = contexteDesJeux(resultats);
    expect(contexte).toContain('Sénégal (SEN) : ');
    expect(contexte).toContain('Dakar Arena');
  });

  it('006-AS2: an off-topic question gets the fixed sentence of the application, never Claude’s text', async () => {
    const { gerer } = monter(vi.fn(async () => reponse('Paris, ville lumière…', true)));
    const r = await appeler(gerer, { corps: question('Écris-moi un poème sur Paris') });
    expect(r.status).toBe(200);
    expect(r.json).toEqual({ reponse: 'Je réponds seulement aux questions sur les Jeux Olympiques de la Jeunesse Dakar 2026.', horsSujet: true });
    expect(HORS_SUJET).toBe(r.json.reponse);
  });

  it.each([
    ['empty', ''],
    ['made of spaces', '   \n '],
    ['longer than 500 characters', 'é'.repeat(501)],
    ['not a text', 42],
    ['missing', undefined],
  ])('006-AS3: a question %s answers 400 and Claude is not called', async (_cas, q) => {
    const { gerer, rediger } = monter();
    const r = await appeler(gerer, { corps: JSON.stringify({ question: q }) });
    expect([r.status, r.json.code]).toEqual([400, 'QUESTION_INVALIDE']);
    expect(r.json.message).toMatch(/^[A-ZÉ].+\.$/);
    expect(rediger).not.toHaveBeenCalled();
  });

  it('006-AS3: a question of exactly 500 characters is accepted, without its surrounding spaces', async () => {
    const { gerer, rediger } = monter();
    const r = await appeler(gerer, { corps: question(`  ${'é'.repeat(500)}  `) });
    expect(r.status).toBe(200);
    expect(rediger.mock.calls[0][0].question).toBe('é'.repeat(500));
  });

  it('006-AS4: up to 6 previous exchanges are passed to the assistant, in order', async () => {
    const { gerer, rediger } = monter();
    const historique = echanges(6, 'x'.repeat(1000));
    const r = await appeler(gerer, { corps: question('Et en lutte ?', historique) });
    expect(r.status).toBe(200);
    expect(rediger.mock.calls[0][0].historique).toEqual(historique);
  });

  it.each([
    ['7 previous exchanges', echanges(7)],
    ['a message longer than 1 000 characters', [{ role: 'visiteur', texte: 'x'.repeat(1001) }, { role: 'assistant', texte: 'ok' }]],
    ['an empty message', [{ role: 'visiteur', texte: '' }, { role: 'assistant', texte: 'ok' }]],
    ['the assistant first', [{ role: 'assistant', texte: 'ok' }, { role: 'visiteur', texte: 'ok' }]],
    ['two visitor messages in a row', [{ role: 'visiteur', texte: 'a' }, { role: 'visiteur', texte: 'b' }]],
    ['a visitor message without answer', [{ role: 'visiteur', texte: 'a' }]],
    ['an unknown role', [{ role: 'system', texte: 'a' }, { role: 'assistant', texte: 'b' }]],
    ['an unknown field', [{ role: 'visiteur', texte: 'a', x: 1 }, { role: 'assistant', texte: 'b' }]],
    ['not a list', 'bonjour'],
  ])('006-AS4: a history with %s answers 400 and Claude is not called', async (_cas, historique) => {
    const { gerer, rediger } = monter();
    const r = await appeler(gerer, { corps: question('Et en lutte ?', historique) });
    expect([r.status, r.json.code]).toEqual([400, 'HISTORIQUE_INVALIDE']);
    expect(rediger).not.toHaveBeenCalled();
  });

  it('006-AS5: the 11th question of a visitor within 10 minutes answers 429, others can still ask', async () => {
    const { gerer, rediger, horloge } = monter();
    for (let i = 0; i < 10; i++) expect((await appeler(gerer, { ip: '41.82.0.7' })).status).toBe(200);
    const onzieme = await appeler(gerer, { ip: '41.82.0.7' });
    expect([onzieme.status, onzieme.json.code]).toEqual([429, 'TROP_DE_QUESTIONS']);
    expect(onzieme.json.message).toMatch(/^[A-ZÉ].+\.$/);
    expect(onzieme.headers['retry-after']).toBe('600');
    expect(rediger).toHaveBeenCalledTimes(10);
    expect((await appeler(gerer, { ip: '41.82.0.8' })).status).toBe(200);
    horloge.maintenant = new Date(MIDI.getTime() + 10 * 60_000 + 1);
    expect((await appeler(gerer, { ip: '41.82.0.7' })).status).toBe(200);
  });

  it('006-AS5: the visitor is the first address of x-forwarded-for', async () => {
    const { gerer } = monter();
    for (let i = 0; i < 10; i++) await appeler(gerer, { ip: `41.82.0.9, 10.0.0.${i}` });
    expect((await appeler(gerer, { ip: '41.82.0.9' })).status).toBe(429);
  });

  it('006-AS6: after 300 answers in the day, the application answers 429 until the next day in Dakar', async () => {
    const { gerer, rediger, horloge } = monter();
    for (let i = 0; i < 300; i++) await appeler(gerer, { ip: `10.0.${Math.floor(i / 10)}.${i % 10}` });
    expect(rediger).toHaveBeenCalledTimes(300);
    const r = await appeler(gerer, { ip: '41.82.1.1' });
    expect([r.status, r.json.code]).toEqual([429, 'QUOTA_DU_JOUR']);
    expect(r.json.message).toMatch(/^[A-ZÉ].+\.$/);
    expect(rediger).toHaveBeenCalledTimes(300);
    horloge.maintenant = new Date('2026-11-13T00:00:01Z');
    expect((await appeler(gerer, { ip: '41.82.1.1' })).status).toBe(200);
  });

  it('006-AS7: a method other than POST answers 405', async () => {
    const { gerer, rediger } = monter();
    const r = await appeler(gerer, { method: 'GET' });
    expect([r.status, r.json.code]).toEqual([405, 'METHODE_INTERDITE']);
    expect(r.headers.allow).toBe('POST');
    expect(rediger).not.toHaveBeenCalled();
  });

  it.each<[string, Appel]>([
    ['a parameter in the address', { url: '/api/assistant?question=1' }],
    ['an empty query', { url: '/api/assistant?' }],
    ['a body that is not JSON', { corps: 'Combien de médailles ?' }],
    ['a body that is not an object', { corps: '["Combien de médailles ?"]' }],
    ['another content type', { type: 'text/plain' }],
    ['an unknown field', { corps: JSON.stringify({ question: 'Combien ?', modele: 'autre' }) }],
    ['a body larger than 32 KB', { corps: JSON.stringify({ question: 'x'.repeat(40_000) }) }],
  ])('006-AS7: %s answers 400 and Claude is not called', async (_cas, appel) => {
    const { gerer, rediger } = monter();
    const r = await appeler(gerer, appel);
    expect([r.status, r.json.code]).toEqual([400, 'REQUETE_INVALIDE']);
    expect(rediger).not.toHaveBeenCalled();
  });

  it('006-AS7: a body already read by Vercel is validated the same way', async () => {
    const { gerer, rediger } = monter();
    expect((await appeler(gerer, { body: { question: 'Où se passe la lutte de plage ?' } })).status).toBe(200);
    expect((await appeler(gerer, { body: { question: 'Où ?', x: 1 } })).json.code).toBe('REQUETE_INVALIDE');
    expect((await appeler(gerer, { body: '{"question":"Où ?"}' })).status).toBe(200);
    expect(rediger).toHaveBeenCalledTimes(2);
  });

  it('006-AS8: when Claude fails or refuses, the answer is 503 with a clear French sentence', async () => {
    const { gerer } = monter(vi.fn(async (): Promise<ReponseDeClaude> => { throw new Error('refus'); }));
    const r = await appeler(gerer);
    expect(r.status).toBe(503);
    expect(r.json).toEqual({ code: 'ASSISTANT_INDISPONIBLE', message: 'L’assistant est momentanément indisponible. Réessayez dans quelques minutes.' });
    expect(r.headers['cache-control']).toBe('no-store');
  });

  it('006-AS8: an empty answer from Claude is treated as unavailable', async () => {
    const { gerer } = monter(vi.fn(async () => reponse('  ')));
    expect((await appeler(gerer)).json.code).toBe('ASSISTANT_INDISPONIBLE');
  });

  describe('without ANTHROPIC_API_KEY', () => {
    afterEach(() => { vi.unstubAllEnvs(); });

    it('006-AS8: the real handler answers 503 without calling the network', async () => {
      vi.stubEnv('ANTHROPIC_API_KEY', '');
      const fetch = vi.fn();
      vi.stubGlobal('fetch', fetch);
      const r = await appeler(gestionnaireReel);
      expect([r.status, r.json.code]).toEqual([503, 'ASSISTANT_INDISPONIBLE']);
      expect(fetch).not.toHaveBeenCalled();
      vi.unstubAllGlobals();
    });
  });
});
