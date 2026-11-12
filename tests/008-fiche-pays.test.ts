import { describe, expect, it } from 'vitest';
import type { Place, PodiumEvent, Session, Version } from '../src/data';
import { ficheDuPays } from '../src/pays';

const importe = (pod: Place[]): Version => ({ v: 1, at: '5 nov.', by: 'Wikipédia', motif: null, valid: 'Source Wikipédia · 5 nov.', pod });
const epreuve = (id: string, disc: string, name: string, site: string, pod: Place[]): PodiumEvent => ({
  id, disc, name, site, venue: '', time: '', status: 'off', versions: [importe(pod)],
});

const judo = epreuve('judo-60', 'Judo', '60 kg garçons', 'Diamniadio', [
  { n: 'Kenji Sato', c: 'JPN', m: 1 }, { n: 'Li Wei', c: 'CHN', m: 2 }, { n: 'Moussa Ndiaye', c: 'SEN', m: 3 },
]);
const lutte = epreuve('lutte-eq', 'Lutte de plage', 'Équipes mixtes', 'Saly', [
  { n: 'Sénégal', c: 'SEN', m: 1, team: ['Maguette Diop', 'Ndèye Anna Diatta'] }, { n: 'Chine', c: 'CHN', m: 2 }, { n: 'Japon', c: 'JPN', m: 3 },
]);
const boxe: Session = {
  id: 'boxe-50', disc: 'Boxe', name: '50 kg filles', site: 'Dakar', venue: '', time: '',
  pod: [{ n: 'Awa Sarr', c: 'SEN', m: 3 }],
};

describe('008 — La fiche d’un pays', () => {
  it('008-AS1: the rank and medals of the card are those of the table, ties shared', () => {
    const fiche = ficheDuPays('SEN', [], [], { CHN: [2, 0, 0], SEN: [1, 0, 1], JPN: [1, 0, 1] });
    expect(fiche).toMatchObject({ code: 'SEN', rang: 2, exAequo: true, nations: 3, medailles: [1, 0, 1], total: 2 });
    expect(ficheDuPays('CHN', [], [], { CHN: [2, 0, 0], SEN: [1, 0, 1] })).toMatchObject({ rang: 1, exAequo: false });
  });

  it('008-AS2: medallists are listed from gold to bronze with sport, event and site, teams marked', () => {
    const fiche = ficheDuPays('SEN', [judo, lutte], [boxe]);
    expect(fiche?.medailles).toEqual([1, 0, 2]);
    expect(fiche?.liste).toEqual([
      { m: 1, nom: 'Sénégal', equipe: true, disc: 'Lutte de plage', epreuve: 'Équipes mixtes', site: 'Saly' },
      { m: 3, nom: 'Awa Sarr', equipe: false, disc: 'Boxe', epreuve: '50 kg filles', site: 'Dakar' },
      { m: 3, nom: 'Moussa Ndiaye', equipe: false, disc: 'Judo', epreuve: '60 kg garçons', site: 'Diamniadio' },
    ]);
  });

  it('008-AS3: sports are sorted by gold, then silver, then bronze', () => {
    const fiche = ficheDuPays('SEN', [judo, lutte], [boxe]);
    expect(fiche?.sports).toEqual([
      { disc: 'Lutte de plage', medailles: [1, 0, 0], total: 1 },
      { disc: 'Boxe', medailles: [0, 0, 1], total: 1 },
      { disc: 'Judo', medailles: [0, 0, 1], total: 1 },
    ]);
  });

  it('008-AS4: a plain summary says rank, medals and best sport, to be read aloud', () => {
    const fiche = ficheDuPays('SEN', [lutte], [], { CHN: [2, 0, 0], SEN: [1, 0, 1], JPN: [1, 0, 1] });
    expect(fiche?.resume).toEqual([
      'Sénégal : 2e nation ex aequo au tableau des médailles, avec 1 médaille d’or et 1 médaille de bronze.',
      'Meilleur sport : Lutte de plage, avec 1 médaille d’or.',
      '1 médaille n’est pas encore détaillée sur Wikipédia.',
    ]);
    expect(fiche?.nonDetaillees).toBe(1);
    expect(fiche?.liste).toHaveLength(1);
  });

  it('008-AS4: several medals of one kind are plural, a first nation is « 1re »', () => {
    const fiche = ficheDuPays('JPN', [judo], [], { JPN: [3, 2, 0] });
    expect(fiche?.resume[0]).toBe('Japon : 1re nation au tableau des médailles, avec 3 médailles d’or et 2 médailles d’argent.');
    expect(fiche?.resume[2]).toBe('4 médailles ne sont pas encore détaillées sur Wikipédia.');
  });

  it('008-AS5: the question for the assistant names the country', () => {
    expect(ficheDuPays('SEN', [judo], [])?.question).toBe('Pays : Sénégal. Quelles médailles aux JOJ, et dans quels sports ?');
  });

  it('008-AS6: a country without medals has no card', () => {
    expect(ficheDuPays('XYZ', [judo], [], { SEN: [1, 0, 0] })).toBeNull();
    expect(ficheDuPays('FRA', [judo], [])).toBeNull();
  });
});
