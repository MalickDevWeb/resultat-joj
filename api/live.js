/**
 * Épreuves en cours aux JOJ Dakar 2026, lues sur le site officiel des résultats
 * (webresult.apps.dakar2026.org), qui n'autorise pas la lecture directe depuis le navigateur.
 *
 *   GET /api/live  ->  { updatedAt, live: [...], next: [...], source }
 *
 * Fonction Vercel (dossier api/). En local, vite.config.ts la sert sur la même adresse.
 * Réponse mise en cache 60 s par Vercel : le site officiel est lu au plus une fois par minute.
 */
const BASE = 'https://webresult.apps.dakar2026.org';
const UA = 'PodiumDakar/1.0 (https://resultat-joj-jugu.vercel.app)';

/* Codes sport du site officiel -> noms utilisés dans l'application. */
const SPORT = {
  ARC: "Tir à l'arc", ATH: 'Athlétisme', BDM: 'Badminton', BK3: 'Basketball 3x3', BKG: 'Breaking', BOX: 'Boxe',
  BS5: 'Baseball5', CRD: 'Cyclisme sur route', EQU: 'Équitation', FBS: 'Futsal', FEN: 'Escrime',
  GAR: 'Gymnastique artistique', HBB: 'Handball de plage', JUD: 'Judo', RCB: 'Aviron de mer', ROC: 'Aviron de mer',
  RU7: 'Rugby à 7', SAL: 'Voile', SKB: 'Skateboard', SWM: 'Natation', TKW: 'Taekwondo', TRI: 'Triathlon',
  TTE: 'Tennis de table', VBV: 'Beach-volley', WUS: 'Wushu', WRB: 'Lutte de plage', BWR: 'Lutte de plage',
};

/* Statuts : tout ce qui n'est ni « à venir » ni « terminé » est considéré en cours. */
const NEXT = /^(scheduled|start list|getting ready|delayed|rescheduled|postponed)$/i;
const DONE = /^(finished|official|unofficial|cancelled|protested)$/i;

const TR = [
  [/\bMen'?s?\b/g, 'garçons'], [/\bWomen'?s?\b/g, 'filles'], [/\bMixed\b/g, 'mixte'],
  [/\bSemifinals?\b/gi, 'demi-finale'], [/\bQuarterfinals?\b/gi, 'quart de finale'],
  [/\bBronze Medal (Match|Game|Bout|Contest)\b/gi, 'pour le bronze'], [/\bGold Medal (Match|Game|Bout|Contest)\b/gi, "pour l'or"],
  [/\bRound of 16\b/gi, 'huitièmes'], [/\bPlacement Matches\b/gi, 'classement'], [/\bPlacement\b/gi, ''], [/\bContest\b/gi, 'combat'],
  [/\bFinals?\b/gi, 'finale'], [/\bPreliminary Round\b/gi, 'tour préliminaire'], [/\bRound\b/gi, 'tour'],
  [/\bPool\b/gi, 'poule'], [/\bGroup\b/gi, 'groupe'], [/\bHeats?\b/gi, 'séries'], [/\bRace\b/gi, 'course'],
  [/\bMatch\b/gi, 'match'], [/\bBout\b/gi, 'combat'], [/\bTable of (\d+)\b/gi, 'tableau de $1'], [/\bIndividual\b/gi, 'individuel'], [/\bTeam\b/gi, 'équipe'],
];
const STAGE = /\b(?:quart de finale|demi-finale|huitièmes|classement|finale|tableau de \d+|tour préliminaire|tour|poule|groupe|séries|course|match)\b/;
const tr = (s) => {
  const x = TR.reduce((y, [re, to]) => y.replace(re, to), s).replace(/\s+/g, ' ').trim();
  // « garçons Épée individuel poule 2 » -> « Épée individuel garçons, poule 2 »
  const g = x.match(/^(garçons|filles|mixte) (.+)$/);
  if (!g) return x;
  const [, gender, rest] = g;
  const m = rest.match(STAGE);
  if (!m) return `${rest} ${gender}`;
  if (m.index === 0) {
    const after = rest.slice(m[0].length).trim();
    return `${m[0]} ${gender}${after ? ', ' + after : ''}`;
  }
  return `${rest.slice(0, m.index).trim()} ${gender}, ${rest.slice(m.index)}`;
};

const decode = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
const text = (s = '') => decode(s.replace(/<[^>]*>|<[^>]*$/g, ' ')).replace(/\s+/g, ' ').trim();
/** Contenu texte du premier <div class="cls…"> (jusqu'au prochain div ouvrant ou fermant suffisant pour ces blocs). */
const block = (h, cls) => {
  const m = h.match(new RegExp(`class="${cls}"[^>]*>([\\s\\S]*?)</div>`));
  return m ? text(m[1]) : '';
};

const siteOf = (venue) =>
  /saly/i.test(venue) ? 'Saly'
  : /expo|diamniadio|dakar arena|abdoulaye|equestr/i.test(venue) ? 'Diamniadio'
  : 'Dakar';

const RANG = { gold: 1, silver: 2, bronze: 3 };

/** Médaillés officiels d'une épreuve (bloc « medal-content »), dans l'ordre or, argent, bronze. */
function medaillesDe(h) {
  const bloc = h.split('class="medal-content"')[1];
  if (!bloc) return [];
  return [...bloc.matchAll(/medals\/(gold|silver|bronze)\.png[\s\S]*?svg_flags\/([A-Z]{3})\.svg[\s\S]*?class="sortValue">([^<]*)</g)]
    .map(([, metal, c, n]) => ({ m: RANG[metal], c, n: decode(n).trim() }));
}

/** Découpe la page du programme en épreuves. */
export function parseSchedule(html) {
  let lastTime = '';
  return html.split('<div class="link-wrapper">').slice(1).map((h) => {
    // L'heure n'est écrite qu'une fois pour les épreuves qui commencent ensemble.
    const time = h.match(/data-time="([^"]+)"/)?.[1] ?? lastTime;
    lastTime = time;
    const code = h.match(/sport_icons\/([A-Z0-9]+)\.svg/)?.[1] ?? '';
    const sportEn = block(h, 'discipline-name');
    const status = block(h, 'status');
    const venue = block(h, 'venue');
    const teams = [...h.matchAll(/class="scoredev(Left|Right)([^"]*)">([\s\S]*?)(?=class="(?:separator-score-card|scoredevRight)|<\/a>)/g)]
      .map(([, , cls, t]) => ({
        c: t.match(/svg_flags\/([A-Z]{3})\.svg/)?.[1] ?? '',
        n: block(t, 'team-name'),
        score: text(t.match(/class="result-value"[^>]*>([\s\S]*?)(?:<div class="winner-indicator"|$)/)?.[1]),
        ...(/isWinner/.test(cls) ? { win: true } : {}),
      }))
      .filter((t) => t.c || t.n);
    const href = h.match(/href="([^"]+)"/)?.[1];
    return {
      id: href?.split('/').pop() ?? '',
      code,
      disc: SPORT[code] ?? sportEn,
      event: tr(block(h, 'competition-name')).replace(code === 'FEN' ? /\bcombat\b/g : /$^/, 'assaut'),
      time: time.padStart(5, '0'),
      at: Number(h.match(/data-time-ticks="(\d+)"/)?.[1]) || null,
      status,
      state: DONE.test(status) ? 'done' : NEXT.test(status) || !status ? 'next' : 'live',
      venue,
      location: block(h, 'location'),
      site: siteOf(venue),
      teams,
      medals: medaillesDe(h),
      url: href ? BASE + decode(href) : null,
    };
  });
}

/** Lit la page du programme d'un jour (JJMMAAAA) sur le site officiel. */
export async function lireProgramme(jour) {
  const url = `${BASE}/hide/en/Comp/ScheduleDatePartial?sportCode=---&day=${jour}`;
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

/** Date du jour à Dakar (UTC+0) au format du site officiel : JJMMAAAA. */
export const dakarDay = (d = new Date()) => {
  const p = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Africa/Dakar' }).formatToParts(d);
  const v = (t) => p.find((x) => x.type === t).value;
  return v('day') + v('month') + v('year');
};

export async function getLive() {
  const items = parseSchedule(await lireProgramme(dakarDay()));
  const now = Date.now();
  return {
    updatedAt: new Date().toISOString(),
    live: items.filter((x) => x.state === 'live'),
    next: items.filter((x) => x.state === 'next' && (!x.at || x.at >= now - 30 * 60 * 1000)).slice(0, 30),
    done: items.filter((x) => x.state === 'done').length,
    source: { name: 'Dakar 2026 (résultats officiels)', url: `${BASE}/hide/en/` },
  };
}

/** Gestionnaire HTTP (Vercel, et le serveur de dev de Vite). */
export default async function handler(req, res) {
  try {
    const data = await getLive();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.end(JSON.stringify(data));
  } catch (e) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=30');
    res.end(JSON.stringify({ error: 'Programme officiel momentanément indisponible.' }));
  }
}
