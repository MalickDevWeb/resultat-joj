// La fiche d'un pays (spec 008) : rang, médailles, médaillés et sports, calculés sans navigateur ni Claude.
import { NOC, cur, medalTable, type Place, type PodiumEvent, type Session } from './data';
import { isTestOrInvalidName } from './hooks/usePodiumStore';

/** Une médaille du pays : qui, dans quel sport, quelle épreuve, quel site. */
export interface MedailleDuPays {
  m: 1 | 2 | 3;
  nom: string;
  equipe: boolean;
  disc: string;
  epreuve: string;
  site: string;
}

export interface SportDuPays {
  disc: string;
  medailles: number[];
  total: number;
}

export interface FicheDuPays {
  code: string;
  nom: string;
  rang: number;
  exAequo: boolean;
  /** Nombre de nations médaillées au tableau. */
  nations: number;
  medailles: number[];
  total: number;
  liste: MedailleDuPays[];
  sports: SportDuPays[];
  /** Les sites où le pays a gagné ses médailles, du plus au moins médaillé. */
  sites: { site: string; total: number }[];
  /** Médailles comptées par le tableau officiel mais sans podium connu : signalées, jamais inventées. */
  nonDetaillees: number;
  resume: string[];
  question: string;
}

const METAUX = ['d’or', 'd’argent', 'de bronze'];
const parMetal = (a: number[], b: number[]) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2];

/** « 1 médaille d’or et 2 médailles de bronze ». */
function enToutesLettres(m: number[]): string {
  const parts = m.map((n, i) => (n ? `${n} médaille${n > 1 ? 's' : ''} ${METAUX[i]}` : '')).filter(Boolean);
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} et ${parts[parts.length - 1]}` : parts[0] ?? '';
}

const medailleDe = (p: Place, i: number): 1 | 2 | 3 => {
  const m = p.m ?? i + 1;
  return m === 1 || m === 2 ? m : 3;
};

/** Le rang au tableau (partagé en cas d'égalité parfaite), et s'il est partagé. */
function rangDans(rows: [string, number[]][], code: string): { rang: number; exAequo: boolean } {
  const cle = (m: number[]) => m.join('-');
  const i = rows.findIndex(([c]) => c === code);
  const k = cle(rows[i][1]);
  const premier = rows.findIndex(([, m]) => cle(m) === k);
  return { rang: premier + 1, exAequo: rows.filter(([, m]) => cle(m) === k).length > 1 };
}

/** Tout sur un pays, d'après les mêmes données que le tableau des médailles ; null s'il n'a pas de médaille. */
export function ficheDuPays(
  code: string,
  events: PodiumEvent[],
  pending: Session[] = [],
  official: Record<string, number[]> | null = null,
): FicheDuPays | null {
  const rows = medalTable(events, pending, official);
  const ligne = rows.find(([c]) => c === code);
  if (!ligne) return null;
  const medailles = ligne[1];
  const total = medailles[0] + medailles[1] + medailles[2];
  const nom = NOC[code] ?? code;
  const { rang, exAequo } = rangDans(rows, code);

  const sessions: Session[] = [...events.map((e) => ({ ...e, pod: cur(e).pod })), ...pending.filter((s) => !events.some((e) => e.id === s.id))];
  const liste = sessions
    .flatMap((s) => (s.pod ?? []).map((p, i) => ({ p, m: medailleDe(p, i), s })))
    .filter(({ p }) => p.c === code && !isTestOrInvalidName(p.n))
    .map(({ p, m, s }): MedailleDuPays => ({ m, nom: p.n, equipe: Boolean(p.team?.length), disc: s.disc, epreuve: s.name, site: s.site }))
    .sort((a, b) => a.m - b.m || a.disc.localeCompare(b.disc, 'fr') || a.epreuve.localeCompare(b.epreuve, 'fr'));

  const parSport = new Map<string, number[]>();
  for (const x of liste) {
    const m = parSport.get(x.disc) ?? [0, 0, 0];
    m[x.m - 1] += 1;
    parSport.set(x.disc, m);
  }
  const sports = [...parSport].map(([disc, m]) => ({ disc, medailles: m, total: m[0] + m[1] + m[2] }))
    .sort((a, b) => parMetal(a.medailles, b.medailles) || a.disc.localeCompare(b.disc, 'fr'));

  const parSite = new Map<string, number>();
  for (const x of liste) parSite.set(x.site, (parSite.get(x.site) ?? 0) + 1);
  const sites = [...parSite].map(([site, n]) => ({ site, total: n }))
    .sort((a, b) => b.total - a.total || a.site.localeCompare(b.site, 'fr'));

  const nonDetaillees = Math.max(0, total - liste.length);
  const resume = [
    `${nom} : ${rang === 1 ? '1re' : `${rang}e`} nation${exAequo ? ' ex aequo' : ''} au tableau des médailles, avec ${enToutesLettres(medailles)}.`,
    ...(sports[0] ? [`Meilleur sport : ${sports[0].disc}, avec ${enToutesLettres(sports[0].medailles)}.`] : []),
    ...(nonDetaillees === 1 ? ['1 médaille n’est pas encore détaillée sur Wikipédia.'] : []),
    ...(nonDetaillees > 1 ? [`${nonDetaillees} médailles ne sont pas encore détaillées sur Wikipédia.`] : []),
  ];

  return {
    code, nom, rang, exAequo, nations: rows.length, medailles, total, liste, sports, sites, nonDetaillees, resume,
    question: `Pays : ${nom}. Quelles médailles aux JOJ, et dans quels sports ?`,
  };
}
