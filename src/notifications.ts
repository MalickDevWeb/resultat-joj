// Les notifications (spec 009) : ce qu'il faut annoncer, calculé sans navigateur.
import { cur, type PodiumEvent } from './data';
import type { LiveSession } from './hooks/useLive';

/** Une alerte à montrer : sa clé (une seule fois par chose), son titre et son texte. */
export interface Alerte {
  cle: string;
  titre: string;
  texte: string;
}

export type EtatNotifications = 'actives' | 'inactives' | 'bloquees' | 'indisponibles';

export const ACTIVEES = 'Notifications activées : épreuves en direct et médailles du Sénégal.';
export const DESACTIVEES = 'Notifications désactivées.';
export const BLOQUEES = 'Les notifications sont bloquées par votre navigateur. Autorisez-les dans ses réglages, puis réessayez.';
export const INDISPONIBLES = 'Votre navigateur ne permet pas les notifications. Sur iPhone, ajoutez d’abord l’application à l’écran d’accueil.';

/** Actives seulement si le navigateur sait notifier, l'a permis, et que le visiteur les veut. */
export function etatDesNotifications(support: boolean, permission: NotificationPermission, voulues: boolean): EtatNotifications {
  if (!support) return 'indisponibles';
  if (permission === 'denied') return 'bloquees';
  return permission === 'granted' && voulues ? 'actives' : 'inactives';
}

/** Les épreuves qui viennent de passer en direct. `avant` null : première lecture, rien à annoncer. */
export function alertesDuDirect(avant: LiveSession[] | null, apres: LiveSession[]): Alerte[] {
  if (avant === null) return [];
  const deja = new Set(avant.map((s) => s.id));
  return apres.filter((s) => !deja.has(s.id)).map((s) => ({
    cle: `direct-${s.id}`,
    titre: `En direct : ${s.disc}`,
    texte: [s.name, s.site].filter(Boolean).join(' · '),
  }));
}

const METAL = ['🥇 Médaille d’or', '🥈 Médaille d’argent', '🥉 Médaille de bronze'];

/** Les médailles d'un pays dans les podiums actuels, par clé. */
function medailles(events: PodiumEvent[], pays: string): Map<string, Alerte> {
  const m = new Map<string, Alerte>();
  for (const e of events) {
    cur(e).pod.forEach((p, i) => {
      if (p.c !== pays) return;
      const rang = Math.min(3, Math.max(1, p.m ?? i + 1));
      const cle = `medaille-${e.id}-${rang}-${p.n}`;
      m.set(cle, { cle, titre: `${METAL[rang - 1]} pour le Sénégal !`, texte: `${p.n} · ${e.disc}, ${e.name}` });
    });
  }
  return m;
}

/** Les médailles du Sénégal qui n'existaient pas avant. `avant` null : première lecture, rien à annoncer. */
export function alertesDesMedailles(avant: PodiumEvent[] | null, apres: PodiumEvent[], pays = 'SEN'): Alerte[] {
  if (avant === null) return [];
  const deja = medailles(avant, pays);
  return [...medailles(apres, pays).values()].filter((a) => !deja.has(a.cle));
}
