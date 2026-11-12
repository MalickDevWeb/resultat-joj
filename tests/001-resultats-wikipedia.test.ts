import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PodiumEvent } from '../src/data';
import { buildResultats, parseSport } from '../src/wikipedia.mjs';

const ATHLETICS: [string, string, string, string] = ['Athletics', 'Athlétisme', 'Dakar', 'Stade Iba Mar Diop'];
const BASKET: [string, string, string, string] = ['3x3 basketball', 'Basketball 3x3', 'Dakar', "Complexe Tour de l'Œuf"];
const JUDO: [string, string, string, string] = ['Judo', 'Judo', 'Diamniadio', 'Centre des expositions, pavillon E'];
const BOXING: [string, string, string, string] = ['Boxing', 'Boxe', 'Diamniadio', 'Centre des expositions, pavillon C'];

const athlete = (name: string, noc: string) => `{{flagIOCmedalist|[[${name}]]|${noc}|2026 Summer Youth}}`;
const table = (rows: string) => `===Boys===\n{| {{MedalistTable|type=Event}}\n${rows}\n|}\n`;

const FINALE_100M = table(`|-
| 100 metres
|${athlete('Awa Ndiaye', 'SEN')} || 10.50
|${athlete('Jean Martin', 'FRA')} || 10.60
|${athlete('Taro Sato', 'JPN')} || 10.70`);

describe('001 — Résultats réels lus sur Wikipédia', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('001-AS1: a complete podium becomes an official event with gold, silver and bronze', () => {
    const [ev] = parseSport(FINALE_100M, ATHLETICS);
    expect(ev.complete).toBe(true);
    expect(ev.name).toBe('100 m garçons');
    expect(ev.pod).toEqual([
      { n: 'Awa Ndiaye', c: 'SEN', perf: '10.50', m: 1 },
      { n: 'Jean Martin', c: 'FRA', perf: '10.60', m: 2 },
      { n: 'Taro Sato', c: 'JPN', perf: '10.70', m: 3 },
    ]);
  });

  it('001-AS2: an event without a gold medallist stays upcoming, its medals already awarded are kept', () => {
    const [ev] = parseSport(table(`|-
| rowspan=2| 50 kg
| rowspan=2|
| rowspan=2|
| ${athlete('Alan Ocampo', 'MEX')}
|-
| ${athlete('Izzon Galea', 'COL')}`), BOXING);
    expect(ev.complete).toBe(false);
    expect(ev.pod.map((p) => [p.c, p.m])).toEqual([['MEX', 3], ['COL', 3]]);
  });

  it('001-AS3: a team written with a sport template such as {{3x3|SEN}} is recognised', () => {
    const [ev] = parseSport(`===Events===\n{| {{MedalistTable|type=Event}}
|-
| Men
|{{3x3|SEN}}<br>[[Frédéric Clovice Mané]]<br>[[Ibrahima Ndiaye (basketball)|Ibrahima Ndiaye]]<br>[[Papa Mamadou Cissé]]<br>[[Sacoura Diop]]
|{{3x3|LTU}}<br>[[Paulius Veliulis]]<br>[[Matas Rupšlaukis]]<br>[[Mantas Želvys]]<br>[[Emilis Alishan Adnan]]
|{{3x3|GER}}<br>[[Rodney Agyeman]]<br>[[Elias Koeppen]]<br>[[Philip Grothe]]<br>[[Béla Doleviczenyi]]
|}\n`, BASKET);
    expect(ev.complete).toBe(true);
    expect(ev.pod[0]).toMatchObject({ c: 'SEN', n: 'Sénégal', m: 1 });
    expect(ev.pod[0].team).toEqual(['Frédéric Clovice Mané', 'Ibrahima Ndiaye', 'Papa Mamadou Cissé', 'Sacoura Diop']);
  });

  it('001-AS4: two bronze medallists on merged rows both receive bronze', () => {
    const [ev] = parseSport(table(`|-
| rowspan=2| 66 kg
| rowspan=2| ${athlete('Khazar Heydarov', 'UKR')}
| rowspan=2| ${athlete('Anes Mati', 'CAN')}
| ${athlete('Thiago Carvallo', 'ARG')}
|-
| ${athlete('Matar Diop', 'SEN')}`), JUDO);
    expect(ev.complete).toBe(true);
    expect(ev.pod.filter((p) => p.m === 3).map((p) => p.c)).toEqual(['ARG', 'SEN']);
  });

  /** Fausse API Wikipédia : renvoie le wikitexte voulu pour chaque page demandée. */
  const stubWikipedia = (pages: Record<string, string>) => {
    const fetch = vi.fn(async (url: string) => {
      const titles = new URL(url).searchParams.get('titles')!.split('|');
      const found = titles.filter((t) => pages[t]).map((t) => ({ title: t, revisions: [{ slots: { main: { content: pages[t] } } }] }));
      return new Response(JSON.stringify({ query: { pages: found } }));
    });
    vi.stubGlobal('fetch', fetch);
    return fetch;
  };
  const MAIN = '2026 Summer Youth Olympics';
  const page = (sport: string) => `${sport} at the 2026 Summer Youth Olympics`;

  it('001-AS5: when Wikipedia is unreachable, the import fails and nothing is replaced', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })));
    await expect(buildResultats({ prev: null })).rejects.toThrow();
  });

  it('001-AS6: a sport whose page cannot be read keeps its previous results', async () => {
    const fetch = stubWikipedia({ [MAIN]: '', [page('Athletics')]: FINALE_100M });
    const pod = [{ n: 'Matar Diop', c: 'SEN', m: 3 }];
    const kept: PodiumEvent = {
      id: 'judo-m-66', disc: 'Judo', name: '66 kg garçons', site: 'Diamniadio', venue: '', time: '', status: 'off',
      versions: [{ v: 1, at: '5 nov.', by: 'Wikipédia', motif: null, valid: 'Source Wikipédia · 5 nov.', pod }],
    };
    const r = await buildResultats({ prev: { events: [kept], pending: [], sports: [{ disc: 'Judo', site: 'Diamniadio', venue: '' }] } });
    expect(fetch).toHaveBeenCalledTimes(1); // toutes les pages en une seule requête
    expect(r.events.map((e) => e.disc)).toEqual(['Athlétisme', 'Judo']);
    expect(r.events).toContainEqual(kept);
    expect(r.sports.map((s) => s.disc)).toEqual(['Athlétisme', 'Judo']);
  });

  it('001-AS7: an unchanged podium keeps its original import date', async () => {
    stubWikipedia({ [MAIN]: '', [page('Athletics')]: FINALE_100M });
    const first = await buildResultats({ prev: null });
    const original = { ...first.events[0].versions[0], at: '1 nov.', valid: 'Source Wikipédia · 1 nov.' };
    const prev = { ...first, events: [{ ...first.events[0], versions: [original] }] };
    const again = await buildResultats({ prev });
    expect(again.events[0].versions[0].at).toBe('1 nov.');
  });

  it('001-AS8: the general medal table of Wikipedia is read with the results', async () => {
    stubWikipedia({
      [MAIN]: '{{Medals table\n | gold_SEN = 5 | silver_SEN = 0 | bronze_SEN = 5\n | gold_FRA = 4 | silver_FRA = 5 | bronze_FRA = 4\n}}',
      [page('Athletics')]: FINALE_100M,
    });
    const r = await buildResultats({ prev: null });
    expect(r.medals).toEqual({ SEN: [5, 0, 5], FRA: [4, 5, 4] });
  });
});
