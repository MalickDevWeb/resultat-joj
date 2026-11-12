import { describe, expect, it } from 'vitest';
import type { Place, PodiumEvent, Version } from '../src/data';
import type { LiveSession } from '../src/hooks/useLive';
import { alertesDesMedailles, alertesDuDirect, etatDesNotifications } from '../src/notifications';

const direct = (id: string, disc: string, name: string, site: string): LiveSession => ({
  id, disc, name, site, venue: '', time: '', status: 'Running', teams: [],
});
const version = (v: number, pod: Place[]): Version => ({ v, at: '12 nov.', by: 'Wikipédia', motif: null, valid: null, pod });
const epreuve = (id: string, ...versions: Version[]): PodiumEvent => ({
  id, disc: 'Lutte de plage', name: '80 kg garçons', site: 'Saly', venue: '', time: '', status: 'off', versions,
});

describe('009 — Les notifications', () => {
  it('009-AS1: notifications are active only when supported, allowed by the browser and wanted', () => {
    expect(etatDesNotifications(true, 'granted', true)).toBe('actives');
    expect(etatDesNotifications(true, 'granted', false)).toBe('inactives');
    expect(etatDesNotifications(true, 'default', true)).toBe('inactives');
    expect(etatDesNotifications(true, 'denied', true)).toBe('bloquees');
    expect(etatDesNotifications(false, 'default', true)).toBe('indisponibles');
  });

  it('009-AS2: an event that goes live is announced once, with its sport, event and site', () => {
    const avant = [direct('live-1', 'Judo', '60 kg', 'Diamniadio')];
    const apres = [...avant, direct('live-2', 'Lutte de plage', '80 kg garçons', 'Saly')];
    expect(alertesDuDirect(avant, apres)).toEqual([
      { cle: 'direct-live-2', titre: 'En direct : Lutte de plage', texte: '80 kg garçons · Saly' },
    ]);
    expect(alertesDuDirect(apres, apres)).toEqual([]);
  });

  it('009-AS3: a new Senegalese medal is announced once, gold, silver or bronze', () => {
    const avant = [epreuve('lutte-80', version(1, [{ n: 'Ali', c: 'JOR', m: 1 }]))];
    const apres = [epreuve('lutte-80', version(1, [{ n: 'Ali', c: 'JOR', m: 1 }]), version(2, [{ n: 'Maguette Diop', c: 'SEN', m: 1 }, { n: 'Ali', c: 'JOR', m: 2 }]))];
    expect(alertesDesMedailles(avant, apres)).toEqual([
      { cle: 'medaille-lutte-80-1-Maguette Diop', titre: '🥇 Médaille d’or pour le Sénégal !', texte: 'Maguette Diop · Lutte de plage, 80 kg garçons' },
    ]);
    expect(alertesDesMedailles(apres, apres)).toEqual([]);
    const bronze = [epreuve('judo', version(1, [{ n: 'A', c: 'JPN' }, { n: 'B', c: 'FRA' }, { n: 'Moussa Ndiaye', c: 'SEN' }]))];
    expect(alertesDesMedailles([], bronze)[0]?.titre).toBe('🥉 Médaille de bronze pour le Sénégal !');
  });

  it('009-AS4: what already existed when notifications start triggers nothing', () => {
    expect(alertesDuDirect(null, [direct('live-1', 'Judo', '60 kg', 'Diamniadio')])).toEqual([]);
    expect(alertesDesMedailles(null, [epreuve('lutte-80', version(1, [{ n: 'Maguette Diop', c: 'SEN', m: 1 }]))])).toEqual([]);
  });
});
