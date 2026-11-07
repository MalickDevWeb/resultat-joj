// Données et types de Podium Dakar 2026 (portés depuis le prototype).

export type Status = 'prov' | 'off' | 'rect';

export interface Place {
  n: string; // nom de l'athlète ou de l'équipe
  c: string; // code pays (CNO)
  perf?: string;
}

export interface Version {
  v: number;
  at: string;
  by: string;
  motif: string | null;
  valid: string | null;
  pod: Place[];
}

export interface Session {
  id: string;
  disc: string;
  name: string;
  site: string;
  venue: string;
  time: string;
}

export interface PodiumEvent extends Session {
  status: Status;
  versions: Version[];
}

export const ALL_SITES = 'Tous les sites';
export const SITES = [ALL_SITES, 'Diamniadio', 'Dakar Arena', 'Saly', 'Corniche'];

export const NOC: Record<string, string> = {
  SEN: 'Sénégal', MAR: 'Maroc', KEN: 'Kenya', BRA: 'Brésil', NGA: 'Nigeria', FRA: 'France',
  EGY: 'Égypte', JPN: 'Japon', CIV: "Côte d'Ivoire", USA: 'États-Unis', ESP: 'Espagne',
  CHN: 'Chine', TUN: 'Tunisie', KOR: 'Corée',
};

export const SPORTS = ['Athlétisme', 'Lutte', 'Beach-volley', 'Basketball 3x3', 'Taekwondo', 'Natation'];

const p = (n: string, c: string, perf = ''): Place => ({ n, c, perf });

export const SEED_EVENTS: PodiumEvent[] = [
  { id: 'e1', disc: 'Athlétisme', name: '100 m garçons — finale', site: 'Diamniadio', venue: 'Stade Abdoulaye Wade', time: '10:40', status: 'off',
    versions: [{ v: 1, at: '10:52', by: 'A. Ndiaye (chef de site)', motif: null, valid: 'M. Sow · 11:05', pod: [p('Amadou Diallo', 'SEN', '10.38'), p('Brian Kiptoo', 'KEN', '10.41'), p('Lucas Silva', 'BRA', '10.47')] }] },
  { id: 'e2', disc: 'Lutte', name: 'Lutte libre −57 kg filles', site: 'Dakar Arena', venue: 'Dakar Arena', time: '11:30', status: 'rect',
    versions: [
      { v: 1, at: '12:04', by: 'F. Gueye (chef de site)', motif: null, valid: 'I. Fall · 12:10', pod: [p('Salma Idrissi', 'MAR'), p('Aïssatou Faye', 'SEN'), p('Chioma Okafor', 'NGA')] },
      { v: 2, at: '14:25', by: 'F. Gueye (chef de site)', motif: "Réclamation acceptée : pesée non conforme pour la médaillée d'or.", valid: 'I. Fall · 14:31', pod: [p('Aïssatou Faye', 'SEN'), p('Chioma Okafor', 'NGA'), p('Nour Hassan', 'EGY')] },
    ] },
  { id: 'e3', disc: 'Taekwondo', name: 'Taekwondo −55 kg garçons', site: 'Dakar Arena', venue: 'Dakar Arena', time: '13:00', status: 'off',
    versions: [{ v: 1, at: '13:41', by: 'F. Gueye (chef de site)', motif: null, valid: 'I. Fall · 13:50', pod: [p('Min-jun Park', 'KOR'), p('Youssef Ben Ali', 'TUN'), p('Ibrahima Ba', 'SEN')] }] },
  { id: 'e4', disc: 'Beach-volley', name: 'Beach-volley filles — finale', site: 'Saly', venue: 'Plage de Saly', time: '14:00', status: 'prov',
    versions: [{ v: 1, at: '15:02', by: 'K. Diop (chef de site)', motif: null, valid: null, pod: [p('Santos / Lima', 'BRA'), p('Diatta / Mendy', 'SEN'), p('García / Ruiz', 'ESP')] }] },
  { id: 'e5', disc: 'Basketball 3x3', name: 'Basketball 3x3 garçons', site: 'Corniche', venue: 'Place du Souvenir africain', time: '14:30', status: 'prov',
    versions: [{ v: 1, at: '15:12', by: 'O. Thiam (chef de site)', motif: null, valid: null, pod: [p('États-Unis', 'USA'), p('Sénégal', 'SEN'), p("Côte d'Ivoire", 'CIV')] }] },
];

export const LIVE: Session[] = [
  { id: 'l1', disc: 'Lutte', name: 'Lutte libre −65 kg garçons', site: 'Dakar Arena', venue: 'Dakar Arena', time: '15:30' },
  { id: 'l2', disc: 'Beach-volley', name: 'Beach-volley garçons — demi-finale', site: 'Saly', venue: 'Plage de Saly', time: '15:40' },
];

export const SEED_PENDING: Session[] = [
  { id: 'u1', disc: 'Natation', name: '200 m nage libre filles', site: 'Corniche', venue: 'Piscine olympique', time: '16:00' },
  { id: 'u2', disc: 'Athlétisme', name: 'Saut en longueur filles', site: 'Diamniadio', venue: 'Stade Abdoulaye Wade', time: '16:20' },
];

/* Compte de démonstration, vérifié côté client (pas une vraie sécurité). */
export const DEMO_ACCOUNT = { email: 'admin123joj@gmail.com', pass: 'joj1234' };

export const BADGE: Record<Status, [string, string]> = {
  prov: ['b-prov', 'Provisoire'],
  off: ['b-off', 'Officiel'],
  rect: ['b-rect', 'Rectifié'],
};

export const cur = (e: PodiumEvent) => e.versions[e.versions.length - 1];

/** Heure courante à Dakar (UTC+0), au format HH:MM. */
export const now = () =>
  new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Dakar' }).format(new Date());

export const today = () => {
  const s = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Dakar' }).format(new Date());
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** Tableau des médailles calculé depuis la version actuelle de chaque podium. */
export function medalTable(events: PodiumEvent[]): [string, number[]][] {
  const t: Record<string, number[]> = {};
  events.forEach((e) => cur(e).pod.forEach((x, i) => { (t[x.c] ??= [0, 0, 0])[i]++; }));
  return Object.entries(t).sort(
    (a, b) => b[1][0] - a[1][0] || b[1][1] - a[1][1] || b[1][2] - a[1][2] || a[0].localeCompare(b[0]),
  );
}

/* Illustrations SVG (statiques, contrôlées) des sports. */
const W = 'stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"';
export const SCENES: Record<string, string> = {
  'Athlétisme': `<rect width="160" height="120" fill="#00853f"/><rect y="92" width="160" height="28" fill="#c8553d"/><path d="M0 102h160M0 112h160" stroke="#fff" stroke-width="1.5" opacity=".7"/><path d="M136 40v54" stroke="#fff" stroke-width="3"/><path d="M136 44h18" stroke="#fdef42" stroke-width="5"/>
    <g stroke="#fff" ${W}><path d="M74 40L66 62M72 44l12 6 6-8M72 44l-12 4-4 10M66 62l14 8 2 18M66 62l-10 14-14 2"/></g><circle cx="78" cy="30" r="8" fill="#fff"/>`,
  'Lutte': `<rect width="160" height="120" fill="#fdef42"/><ellipse cx="80" cy="102" rx="72" ry="16" fill="#e31b23"/>
    <g stroke="#141414" ${W}><path d="M66 46l4 26M70 72l-12 24M70 72l6 24M67 50l15 2 8-6"/></g><circle cx="64" cy="37" r="8" fill="#141414"/>
    <g stroke="#00853f" ${W}><path d="M94 48l-4 24M90 72l-6 24M90 72l14 24M93 52l-15 4-6-6"/></g><circle cx="96" cy="39" r="8" fill="#00853f"/>`,
  'Beach-volley': `<rect width="160" height="120" fill="#7cc6ee"/><circle cx="138" cy="20" r="10" fill="#fdef42"/><rect y="94" width="160" height="26" fill="#f4d77a"/>
    <path d="M94 40v56M150 40v56" stroke="#141414" stroke-width="3"/><rect x="94" y="44" width="56" height="20" fill="none" stroke="#141414" stroke-width="2"/><path d="M104 44v20M114 44v20M124 44v20M134 44v20M144 44v20M94 54h56" stroke="#141414" stroke-width="1"/>
    <g stroke="#141414" ${W}><path d="M52 40l-2 22M52 44l8-14 6-10M52 44l-10-8M50 62l-8 16M50 62l8 12"/></g><circle cx="53" cy="31" r="8" fill="#141414"/><circle cx="72" cy="12" r="7" fill="#fff" stroke="#141414" stroke-width="2"/>`,
  'Basketball 3x3': `<rect width="160" height="120" fill="#141414"/><rect y="98" width="160" height="22" fill="#c8553d"/><rect x="128" y="20" width="5" height="34" fill="#fff"/><path d="M128 46h-16" stroke="#e31b23" stroke-width="4"/><path d="M113 46l3 10h8l3-10" stroke="#fff" stroke-width="2" fill="none"/>
    <g stroke="#fff" ${W}><path d="M86 38l-6 24M86 42l12-10 8-8M86 42l-12 6M80 62l8 12-4 12M80 62l-10 10-8-2"/></g><circle cx="88" cy="29" r="8" fill="#fff"/><circle cx="110" cy="16" r="7" fill="#e8762c"/>`,
  'Taekwondo': `<rect width="160" height="120" fill="#e31b23"/><rect y="100" width="160" height="20" fill="#b3141b"/>
    <g stroke="#fff" ${W}><path d="M46 42l4 22M50 64l-2 36M50 64l26-8 24-6M47 46l-9 10M47 46l9 4"/></g><path d="M45 58h10" stroke="#141414" stroke-width="4"/><circle cx="44" cy="33" r="8" fill="#fff"/>
    <g stroke="#fff" ${W}><path d="M116 44l-2 24M114 68l-8 32M114 68l10 32M116 48l-10 6v-8"/></g><path d="M109 62h10" stroke="#141414" stroke-width="4"/><circle cx="118" cy="35" r="8" fill="#fff"/>`,
  'Natation': `<rect width="160" height="120" fill="#1d8fd1"/>${Array.from({ length: 14 }, (_, i) => `<circle cx="${6 + i * 12}" cy="30" r="4" fill="${i % 2 ? '#fff' : '#e31b23'}"/><circle cx="${6 + i * 12}" cy="108" r="4" fill="${i % 2 ? '#fff' : '#fdef42'}"/>`).join('')}
    <path d="M76 66Q92 38 112 62M62 70L46 76" stroke="#fff" ${W}/><circle cx="70" cy="68" r="8" fill="#fdef42"/>
    <path d="M0 76q10-6 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0M0 90q10-6 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0" stroke="#fff" stroke-width="3" fill="none" opacity=".85"/>`,
};
