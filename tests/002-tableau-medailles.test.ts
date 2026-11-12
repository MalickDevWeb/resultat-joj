import { describe, expect, it } from 'vitest';
import { medalTable, type Place, type PodiumEvent, type Session, type Version } from '../src/data';

const imported = (pod: Place[]): Version => ({ v: 1, at: '5 nov.', by: 'Wikipédia', motif: null, valid: 'Source Wikipédia · 5 nov.', pod });
const event = (id: string, ...versions: Version[]): PodiumEvent => ({
  id, disc: 'Judo', name: id, site: 'Diamniadio', venue: '', time: '', status: versions.length > 1 ? 'rect' : 'off', versions,
});
const podium = (gold: string, silver: string, bronze: string): Place[] => [
  { n: 'A', c: gold, m: 1 }, { n: 'B', c: silver, m: 2 }, { n: 'C', c: bronze, m: 3 },
];

describe('002 — Tableau des médailles', () => {
  it('002-AS1: countries are sorted by gold, then silver, then bronze', () => {
    const rows = medalTable([
      event('e1', imported(podium('FRA', 'SEN', 'JPN'))),
      event('e2', imported(podium('SEN', 'JPN', 'FRA'))),
      event('e3', imported(podium('JPN', 'JPN', 'SEN'))),
    ]);
    expect(rows).toEqual([
      ['JPN', [1, 2, 1]],
      ['SEN', [1, 1, 1]],
      ['FRA', [1, 0, 1]],
    ]);
  });

  it('002-AS2: medals already awarded in an upcoming event are counted', () => {
    const boxe: Session = {
      id: 'box-50', disc: 'Boxe', name: '50 kg garçons', site: 'Diamniadio', venue: '', time: '',
      pod: [{ n: 'Alan Ocampo', c: 'MEX', m: 3 }, { n: 'Izzon Galea', c: 'COL', m: 3 }],
    };
    expect(medalTable([], [boxe])).toEqual([['COL', [0, 0, 1]], ['MEX', [0, 0, 1]]]);
  });

  it('002-AS3: the official table is shown, corrected by a podium rectified in the app', () => {
    const official = { SEN: [5, 1, 5], FRA: [4, 5, 4] };
    const rectified: Version = { v: 2, at: '10:40', by: 'Vous (chef de site)', motif: 'Erreur de saisie', valid: null, pod: podium('SEN', 'FRA', 'FRA') };
    const rows = medalTable([event('e1', imported(podium('FRA', 'SEN', 'FRA')), rectified)], [], official);
    expect(rows).toEqual([
      ['SEN', [6, 0, 5]], // or gagné, argent perdu
      ['FRA', [3, 6, 4]],
    ]);
  });

  it('002-AS4: a podium published in the app for an upcoming event is added to the official table', () => {
    const published: Version = { v: 1, at: '11:00', by: 'Vous (chef de site)', motif: null, valid: null, pod: podium('SEN', 'MAR', 'EGY') };
    expect(medalTable([event('new', published)], [], { SEN: [1, 0, 0] })).toEqual([
      ['SEN', [2, 0, 0]], ['MAR', [0, 1, 0]], ['EGY', [0, 0, 1]],
    ]);
  });

  it('002-AS6: a medal count never goes below zero, even when the official table lags behind', () => {
    const rectified: Version = { v: 2, at: '10:40', by: 'Vous (chef de site)', motif: 'Erreur', valid: null, pod: podium('FRA', 'JPN', 'JPN') };
    const rows = medalTable([event('e1', imported(podium('SEN', 'JPN', 'JPN')), rectified)], [], { FRA: [0, 1, 0] });
    expect(rows).toEqual([['FRA', [1, 1, 0]]]); // SEN aurait -1 or : ramené à 0, donc retiré
  });

  it('002-AS5: a country left without any medal after a correction disappears from the table', () => {
    const rectified: Version = { v: 2, at: '10:40', by: 'Vous (chef de site)', motif: 'Disqualification', valid: null, pod: podium('SEN', 'FRA', 'JPN') };
    const rows = medalTable([event('e1', imported(podium('SEN', 'FRA', 'ARM')), rectified)], [], { SEN: [1, 0, 0], FRA: [0, 1, 0], ARM: [0, 0, 1] });
    expect(rows.map(([c]) => c)).toEqual(['SEN', 'FRA', 'JPN']);
  });
});
