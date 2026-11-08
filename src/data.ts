// Données et types de Podium Dakar 2026.
import resultats from './resultats.json';

export type Status = 'prov' | 'off' | 'rect';

export interface Place {
  n: string; // nom de l'athlète ou de l'équipe
  c: string; // code pays (CNO)
  perf?: string;
  m?: number; // médaille : 1 or, 2 argent, 3 bronze (ex aequo possibles)
  team?: string[]; // membres d'une équipe
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
  time: string; // heure locale, vide si inconnue
  url?: string; // page source
}

export interface PodiumEvent extends Session {
  status: Status;
  versions: Version[];
}

export const ALL_SITES = 'Tous les sites';

/* Résultats réels importés de Wikipédia : npm run import:wiki (voir scripts/import-wikipedia.mjs). */
export const SOURCE = resultats.source;
export const SITES = [ALL_SITES, ...resultats.sites];
export const NOC: Record<string, string> = resultats.noc;
export const SPORTS: string[] = resultats.sports.map((s) => s.disc);
export const SEED_EVENTS = resultats.events as PodiumEvent[];
export const SEED_PENDING = resultats.pending as Session[];
/** Wikipédia ne donne pas les épreuves en cours : aucune épreuve « en direct ». */
export const LIVE: Session[] = [];

/** Une version issue de l'import (et non saisie par un chef de site). */
export const isImport = (v: Version) => v.by === SOURCE.name;

/** « · 10:40 » si l'heure est connue, sinon rien. */
export const at = (time: string) => (time ? ` · ${time}` : '');

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
  events.forEach((e) => cur(e).pod.forEach((x, i) => { (t[x.c] ??= [0, 0, 0])[(x.m ?? i + 1) - 1]++; }));
  return Object.entries(t).sort(
    (a, b) => b[1][0] - a[1][0] || b[1][1] - a[1][1] || b[1][2] - a[1][2] || a[0].localeCompare(b[0]),
  );
}


/* Pictogrammes des sports (24×24, trait). Les têtes sont des disques pleins (classe h). */
const H = (x: number, y: number) => `<circle class="h" cx="${x}" cy="${y}" r="2"/>`;
const WAVE = (y: number) => `M2 ${y}c2-1.5 3-1.5 5 0s3 1.5 5 0 3-1.5 5 0 3 1.5 5 0`;
export const PICTOS: Record<string, string> = {
  'Athlétisme': `${H(15, 4)}<path d="M14 7l-3 6M14 7l3 3 3-1M14 7l-4 1-2 3M11 13l4 3-1 5M11 13l-3 4H4"/>`,
  'Rugby à 7': `<ellipse cx="12" cy="12" rx="9.5" ry="5.5" transform="rotate(-35 12 12)"/><path d="M8.5 15.5l7-7M10.5 11.5l2 2M12.5 9.5l2 2"/>`,
  'Taekwondo': `${H(6, 4)}<path d="M7 7l1 7M8 14l-2 7M8 14l7-2 6-3M7.5 9l4 1M7.5 9l-3 3"/>`,
  'Basketball 3x3': `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M5.6 5.6c3 3 3 9.8 0 12.8M18.4 5.6c-3 3-3 9.8 0 12.8"/>`,
  'Baseball5': `<circle cx="12" cy="12" r="9"/><path d="M7 4.6c2.4 4 2.4 10.8 0 14.8M17 4.6c-2.4 4-2.4 10.8 0 14.8"/>`,
  'Breaking': `${H(12, 20)}<path d="M12 17.5V11M12 11L8 4M12 11l4-7M12 14l-6 1M12 14l5-3 3 2"/>`,
  'Skateboard': `${H(12, 3)}<path d="M12 6v5M12 11l-3 3M12 11l3 3M8 8l4-1 4 2M2 14c0 1.5 1 2 2 2h16c1 0 2-.5 2-2"/><circle cx="7" cy="19" r="1.6"/><circle cx="17" cy="19" r="1.6"/>`,
  'Natation': `${H(7, 10)}<path d="M9.5 11l6-3.5 5 2.5M5 12l-3 1M${WAVE(16).slice(1)}M${WAVE(20).slice(1)}"/>`,
  'Cyclisme sur route': `${H(15, 4)}<circle cx="6" cy="17" r="3.5"/><circle cx="18" cy="17" r="3.5"/><path d="M6 17l4-7h5l3 7M10 10l3 7M14 7l1 3"/>`,
  'Futsal': `<circle cx="12" cy="12" r="9"/><path d="M12 7.5l3.3 2.4-1.3 3.9h-4l-1.3-3.9zM12 7.5V3M15.3 9.9l4.4-1.4M14 13.8l2.7 3.7M10 13.8l-2.7 3.7M8.7 9.9L4.3 8.5"/>`,
  'Badminton': `<path d="M7 3l3 12h4l3-12M10.5 3l.8 12M13.5 3l-.8 12M8 7h8"/><circle cx="12" cy="18" r="2.6"/>`,
  'Équitation': `<path d="M7 20.5V11a5 5 0 0 1 10 0v9.5M4.5 20.5H9M15 20.5h4.5"/><circle class="h" cx="9.6" cy="12.5" r="1"/><circle class="h" cx="14.4" cy="12.5" r="1"/><circle class="h" cx="9.5" cy="16.5" r="1"/><circle class="h" cx="14.5" cy="16.5" r="1"/>`,
  "Tir à l'arc": `<circle cx="11" cy="13" r="8"/><circle cx="11" cy="13" r="4.5"/><circle class="h" cx="11" cy="13" r="1.2"/><path d="M11 13l9-9M17 3.5h3.5V7"/>`,
  'Escrime': `<path d="M4 4l14 14M20 4L6 18M16.5 19.5l3-3M7.5 19.5l-3-3M3 21l2-2M21 21l-2-2"/>`,
  'Tennis de table': `<circle cx="10" cy="10" r="6.5"/><path d="M14.6 14.6l5 5"/><circle class="h" cx="19" cy="5" r="1.8"/>`,
  'Boxe': `<path d="M7 21h9v-4c2-1.3 3-3.3 3-6.5A5.5 5.5 0 0 0 13.5 5H10a5 5 0 0 0-5 5v4.5c0 1.5 1 2.5 2 2.5zM7 17h9M5.5 11.5H11"/>`,
  'Wushu': `${H(12, 4)}<path d="M12 7v6M12 9l-7-2M12 9l5 2 3-2M12 13l-5 3v5M12 13l5 3-1 5"/>`,
  'Gymnastique artistique': `${H(12, 9)}<path d="M5 2v4M19 2v4M12 11.5V17M12 11.5L6.5 7M12 11.5L17.5 7M12 17l-3 4M12 17l3 4"/><circle cx="5.5" cy="7.5" r="1.5"/><circle cx="18.5" cy="7.5" r="1.5"/>`,
  'Judo': `<path d="M8 3l4 5 4-5M6.5 3.5L3 8l3 3v10h12V11l3-3-3.5-4.5M12 8v13M6 13.5h12M10 13.5l-2 4M14 13.5l2 4"/>`,
  'Handball de plage': `${H(9, 4)}<path d="M9 7v6M9 9l5-4M9 9l-4 2M9 13l-3 8M9 13l4 8"/><circle cx="17.5" cy="4" r="2.3"/>`,
  'Beach-volley': `<circle cx="12" cy="12" r="9"/><path d="M12 3c-2.5 4-2.5 7 0 9M12 12c4 1.2 6.8.4 8.8-2M12 12c-2 3.2-5.4 5-8.6 4.6"/>`,
  'Lutte de plage': `${H(7, 4)}${H(17, 4)}<path d="M7 7l1 7-2 7M8 14l2 7M17 7l-1 7 2 7M16 14l-2 7M7.5 10l4.5 2 4.5-2"/>`,
  'Aviron de mer': `<path d="M2.5 16h19c-1 2.5-3 4-6 4h-7c-3 0-5-1.5-6-4zM5 3l13 13M19 3L6 16"/>`,
  'Voile': `<path d="M12 2.5V17M12 3.5l7 12.5h-7M11 6.5L5 16h6M3 18h18l-2.5 3.5h-13z"/>`,
  'Triathlon': `<circle cx="6.5" cy="9" r="3.5"/><circle cx="17.5" cy="9" r="3.5"/><path d="M6.5 9L10 4h4l3.5 5M10 4l2 5M${WAVE(18).slice(1)}"/>`,
};
PICTOS['Lutte'] = PICTOS['Lutte de plage'];

/** Couleur de tuile (drapeau du Sénégal) attribuée de façon stable à chaque sport. */
export const sportTone = (d: string) => (['g', 'y', 'r'] as const)[[...d].reduce((n, ch) => n + ch.charCodeAt(0), 0) % 3];

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
