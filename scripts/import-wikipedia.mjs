#!/usr/bin/env node
/**
 * Importe les vrais résultats des JOJ Dakar 2026 depuis Wikipédia (en.wikipedia.org).
 *
 *   npm run import:wiki
 *
 * Lit la page de chaque sport (« <Sport> at the 2026 Summer Youth Olympics »), extrait les
 * tableaux de médaillés (modèle MedalistTable) et écrit src/resultats.json, lu par l'application.
 * Les épreuves dont le podium n'est pas encore renseigné deviennent « à venir ».
 *
 * Données : Wikipédia, licence CC BY-SA 4.0 (attribution affichée dans l'application).
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../src/resultats.json', import.meta.url));
const API = 'https://en.wikipedia.org/w/api.php';
const UA = 'PodiumDakarImport/1.0 (https://github.com/MalickDevWeb/resultat-joj)';
const SUFFIX = ' at the 2026 Summer Youth Olympics';

/* Les 25 sports, avec leur site et lieu réels (section « Venues » de Wikipédia). */
const SPORTS = [
  ['Athletics', 'Athlétisme', 'Dakar', 'Stade Iba Mar Diop'],
  ['Rugby sevens', 'Rugby à 7', 'Dakar', 'Stade Iba Mar Diop'],
  ['Taekwondo', 'Taekwondo', 'Dakar', 'Gymnase Iba Mar Diop'],
  ['3x3 basketball', 'Basketball 3x3', 'Dakar', "Complexe Tour de l'Œuf"],
  ['Baseball5', 'Baseball5', 'Dakar', "Complexe Tour de l'Œuf"],
  ['Breaking', 'Breaking', 'Dakar', "Complexe Tour de l'Œuf"],
  ['Skateboarding', 'Skateboard', 'Dakar', "Skatepark Tour de l'Œuf"],
  ['Swimming', 'Natation', 'Dakar', 'Piscine olympique de Dakar'],
  ['Road cycling', 'Cyclisme sur route', 'Dakar', 'Corniche Ouest'],
  ['Futsal', 'Futsal', 'Diamniadio', 'Dakar Arena'],
  ['Badminton', 'Badminton', 'Diamniadio', 'Dakar Arena'],
  ['Equestrian', 'Équitation', 'Diamniadio', 'Centre équestre de Diamniadio'],
  ['Archery', "Tir à l'arc", 'Diamniadio', 'Stade Abdoulaye-Wade'],
  ['Fencing', 'Escrime', 'Diamniadio', 'Centre des expositions, pavillon A'],
  ['Table tennis', 'Tennis de table', 'Diamniadio', 'Centre des expositions, pavillon A'],
  ['Boxing', 'Boxe', 'Diamniadio', 'Centre des expositions, pavillon C'],
  ['Wushu', 'Wushu', 'Diamniadio', 'Centre des expositions, pavillon C'],
  ['Artistic gymnastics', 'Gymnastique artistique', 'Diamniadio', 'Centre des expositions, pavillon E'],
  ['Judo', 'Judo', 'Diamniadio', 'Centre des expositions, pavillon E'],
  ['Beach handball', 'Handball de plage', 'Saly', 'Saly Beach West'],
  ['Beach volleyball', 'Beach-volley', 'Saly', 'Saly Beach West'],
  ['Beach wrestling', 'Lutte de plage', 'Saly', 'Saly Beach West'],
  ['Coastal rowing', 'Aviron de mer', 'Saly', 'Plan d\'eau de Saly'],
  ['Sailing', 'Voile', 'Saly', 'Plan d\'eau de Saly'],
  ['Triathlon', 'Triathlon', 'Saly', 'Plan d\'eau de Saly'],
];

/* Codes CIO -> ISO 3166 (pour les noms de pays en français via Intl). */
const IOC_ISO = Object.fromEntries(`AFG AF ALB AL ALG DZ AND AD ANG AO ANT AG ARG AR ARM AM ARU AW ASA AS AUS AU AUT AT AZE AZ
BAH BS BAN BD BAR BB BDI BI BEL BE BEN BJ BER BM BHU BT BIH BA BIZ BZ BLR BY BOL BO BOT BW BRA BR BRN BH BRU BN BUL BG BUR BF
CAF CF CAM KH CAN CA CAY KY CGO CG CHA TD CHI CL CHN CN CIV CI CMR CM COD CD COK CK COL CO COM KM CPV CV CRC CR CRO HR CUB CU
CYP CY CZE CZ DEN DK DJI DJ DMA DM DOM DO ECU EC EGY EG ERI ER ESA SV ESP ES EST EE ETH ET FIJ FJ FIN FI FRA FR FSM FM GAB GA
GAM GM GBR GB GBS GW GEO GE GEQ GQ GER DE GHA GH GRE GR GRN GD GUA GT GUI GN GUM GU GUY GY HAI HT HKG HK HON HN HUN HU INA ID
IND IN IRI IR IRL IE IRQ IQ ISL IS ISR IL ISV VI ITA IT IVB VG JAM JM JOR JO JPN JP KAZ KZ KEN KE KGZ KG KIR KI KOR KR KOS XK
KSA SA KUW KW LAO LA LAT LV LBA LY LBN LB LBR LR LCA LC LES LS LIE LI LTU LT LUX LU MAD MG MAR MA MAS MY MAW MW MDA MD MDV MV
MEX MX MGL MN MHL MH MKD MK MLI ML MLT MT MNE ME MON MC MOZ MZ MRI MU MTN MR MYA MM NAM NA NCA NI NED NL NEP NP NGR NG NIG NE
NOR NO NRU NR NZL NZ OMA OM PAK PK PAN PA PAR PY PER PE PHI PH PLE PS PLW PW PNG PG POL PL POR PT PRK KP PUR PR QAT QA ROU RO
RSA ZA RUS RU RWA RW SAM WS SEN SN SEY SC SGP SG SKN KN SLE SL SLO SI SMR SM SOL SB SOM SO SRB RS SRI LK SSD SS STP ST SUD SD
SUI CH SUR SR SVK SK SWE SE SWZ SZ SYR SY TAN TZ TGA TO THA TH TJK TJ TKM TM TLS TL TOG TG TPE TW TTO TT TUN TN TUR TR TUV TV
UAE AE UGA UG UKR UA URU UY USA US UZB UZ VAN VU VEN VE VIE VN VIN VC YEM YE ZAM ZM ZIM ZW`
  .split(/\s+/).reduce((a, x, i, arr) => (i % 2 ? a : [...a, [x, arr[i + 1]]]), []));
const NOC_OVERRIDE = { AIN: 'Athlètes individuels neutres', EOR: 'Équipe olympique des réfugiés', TPE: 'Taipei chinois', KOS: 'Kosovo' };
const regionFr = new Intl.DisplayNames(['fr'], { type: 'region' });
const nocName = (c) => NOC_OVERRIDE[c] ?? (IOC_ISO[c] ? regionFr.of(IOC_ISO[c]) : c);

/* Traduction des intitulés d'épreuves (le reste est conservé tel quel). */
const TR = [
  [/\bmetres?\b/gi, 'm'], [/\bindividual medley\b/gi, '4 nages'], [/\bmedley relay\b/gi, 'relais 4 nages'],
  [/\bfreestyle relay\b/gi, 'relais nage libre'], [/\bfreestyle\b/gi, 'nage libre'], [/\bbackstroke\b/gi, 'dos'],
  [/\bbreaststroke\b/gi, 'brasse'], [/\bbutterfly\b/gi, 'papillon'], [/\brelay\b/gi, 'relais'],
  [/\bhurdles\b/gi, 'haies'], [/\bsteeplechase\b/gi, 'steeple'], [/\brace walk\b|\bwalk\b/gi, 'marche'],
  [/\bhigh jump\b/gi, 'Saut en hauteur'], [/\bpole vault\b/gi, 'Saut à la perche'], [/\blong jump\b/gi, 'Saut en longueur'],
  [/\btriple jump\b/gi, 'Triple saut'], [/\bshot put\b/gi, 'Lancer du poids'], [/\bdiscus throw\b/gi, 'Lancer du disque'],
  [/\bhammer throw\b/gi, 'Lancer du marteau'], [/\bjavelin throw\b/gi, 'Lancer du javelot'],
  [/\bcross country\b/gi, 'Cross-country'],
  [/\bindividual jumping\b/gi, "Saut d'obstacles individuel"], [/\bteam jumping\b/gi, "Saut d'obstacles par équipes"],
  [/\bindividual all-around\b|\ball-around\b/gi, 'Concours général'], [/\bfloor\b/gi, 'Sol'],
  [/\bpommel horse\b/gi, "Cheval d'arçons"], [/\brings\b/gi, 'Anneaux'], [/\bvault\b/gi, 'Saut de cheval'],
  [/\bparallel bars\b/gi, 'Barres parallèles'], [/\bhorizontal bar\b/gi, 'Barre fixe'],
  [/\buneven bars\b/gi, 'Barres asymétriques'], [/\bbalance beam\b/gi, 'Poutre'],
  [/\broad race\b/gi, 'Course en ligne'], [/\btime trial\b/gi, 'Contre-la-montre'], [/\bcriterium\b/gi, 'Critérium'],
  [/\bsingles\b/gi, 'Simple'], [/\bdoubles\b/gi, 'Double'], [/\bfoil\b/gi, 'Fleuret'], [/\bépée\b|\bepee\b/gi, 'Épée'],
  [/\bsabre\b/gi, 'Sabre'], [/\bwindsurfing\b/gi, 'Planche à voile'], [/\bkiteboarding\b|\bformula kite\b/gi, 'Kitesurf'],
  [/\bdinghy\b/gi, 'Dériveur'], [/\bbeach sprint\b/gi, 'Beach sprint'], [/\bsolo\b/gi, 'Solo'],
  [/\btournament\b/gi, 'Tournoi'], [/\bindividual\b/gi, 'Individuel'], [/\bteam\b/gi, 'Équipes'],
  [/\bsprint\b/gi, 'Sprint'], [/\bstreet\b/gi, 'Street'], [/\bpark\b/gi, 'Park'],
];
const tr = (s) => TR.reduce((x, [re, to]) => x.replace(re, to), s);

const GENDER = [[/\b(men|boys)\b/i, 'garçons', 'm'], [/\b(women|girls)\b/i, 'filles', 'w'], [/\bmixed\b/i, 'mixte', 'x'], [/\bopen\b/i, 'open', 'o']];
const genderOf = (s) => GENDER.find(([re]) => re.test(s)) ?? null;

async function wikitext(title) {
  const q = new URLSearchParams({ action: 'parse', page: title, prop: 'wikitext', format: 'json', formatversion: '2', redirects: '1' });
  const r = await fetch(`${API}?${q}`, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`${title}: HTTP ${r.status}`);
  const d = await r.json();
  if (d.error) throw new Error(`${title}: ${d.error.info}`);
  return d.parse.wikitext;
}

/** Remplace les « | » à l'intérieur de {{ }} et [[ ]] pour pouvoir découper les cellules. */
function maskPipes(s) {
  let depth = 0, out = '';
  for (let i = 0; i < s.length; i++) {
    const two = s.slice(i, i + 2);
    if (two === '{{' || two === '[[') { depth++; out += two; i++; continue; }
    if ((two === '}}' || two === ']]') && depth) { depth--; out += two; i++; continue; }
    out += s[i] === '|' && depth ? '\u0001' : s[i];
  }
  return out;
}
const unmask = (s) => s.replaceAll('\u0001', '|');

/** Texte lisible d'un bout de wikitexte (liens, modèles simples, balises). */
function plain(s) {
  return unmask(s)
    .replace(/<ref[^>]*\/>|<ref[^>]*>[\s\S]*?<\/ref>/g, '')
    .replace(/\{\{(?:DetailsLink|efn|refn|sfn|nowrap)[^}]*\}\}/gi, (m) => (/^\{\{nowrap\|/i.test(m) ? m.slice(9, -2) : ''))
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/'''?/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Sépare l'attribut de cellule (« rowspan=2| ») du contenu. */
function splitAttr(cell) {
  const i = cell.indexOf('|');
  if (i >= 0 && /^[\s\w-]+=/.test(cell.slice(0, i))) {
    const attr = cell.slice(0, i);
    return { v: cell.slice(i + 1), span: Number(attr.match(/rowspan\s*=\s*"?(\d+)/)?.[1] ?? 1) };
  }
  return { v: cell, span: 1 };
}

/** Un médaillé (ou une équipe) à partir d'une cellule. null si la cellule est vide. */
function medalist(cell, perf) {
  const raw = unmask(cell);
  const tpl = raw.match(/\{\{\s*(flagIOC\w*)\s*\|([^{}]*)\}\}/i);
  if (!tpl) return null;
  const name = tpl[1].toLowerCase();
  const args = maskPipes(tpl[2]).split('|').map((x) => unmask(x).trim());
  // {{flagIOCmedalist|[[Nom]]|NOC|...}} : athlète individuel
  if (/(medalist|athlete)$/.test(name)) {
    return { n: plain(args[0]).replace(/\s*\(.*\)$/, ''), c: args[1].toUpperCase(), perf };
  }
  // {{flagIOC|NOC|...}} suivi des membres : équipe ou duo
  const c = args[0].toUpperCase();
  const rest = raw.slice(raw.indexOf(tpl[0]) + tpl[0].length);
  const members = [...rest.matchAll(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g)].map((m) => m[1].replace(/\s*\(.*\)$/, ''));
  const n = members.length === 2 ? members.map((m) => m.split(' ').slice(-1)[0]).join(' / ') : nocName(c);
  return { n, c, perf, ...(members.length > 2 ? { team: members } : {}) };
}

const slug = (s) => s.replace(/\+/g, ' plus ').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Extrait les épreuves des tableaux MedalistTable d'une page. */
function parseSport(text, [en, disc, site, venue]) {
  const events = [];
  const re = /\{\|\s*\{\{\s*MedalistTable[^}]*\}\}([\s\S]*?)\n\|\}/g;
  let m;
  while ((m = re.exec(text))) {
    // Titre de section le plus proche avant le tableau (« Men's events », « Girls »...).
    const before = text.slice(0, m.index);
    const heads = [...before.matchAll(/^=+\s*(.+?)\s*=+\s*$/gm)].map((h) => h[1]);
    const sectionGender = genderOf([...heads].reverse().find((h) => genderOf(h)) ?? '');
    const rows = maskPipes(m[1]).split(/\n\|-[^\n]*/).slice(1);
    let last = null; // épreuve en cours, et ses colonnes de médailles encore « ouvertes »
    for (const row of rows) {
      const cells = [];
      for (const line of row.split('\n')) {
        if (!line.startsWith('|') || line.startsWith('|}')) continue;
        line.slice(1).split('||').forEach((c, i) => {
          if (i === 0) cells.push({ ...splitAttr(c), perf: '' });
          else cells[cells.length - 1].perf = plain(splitAttr(c).v); // « || 22.54 » : performance
        });
      }
      if (!cells.length) continue;
      const label = plain(cells[0].v);
      const isLabelRow = label !== '' && !medalist(cells[0].v, '') && !/not awarded/i.test(label);
      if (!isLabelRow) {
        // Ligne de suite (ex aequo, second bronze) : remplit les colonnes non fusionnées.
        if (!last) continue;
        cells.forEach((c, k) => {
          const rank = last.open[k];
          const p = rank && medalist(c.v, c.perf);
          if (p) last.ev.pod.push({ ...p, m: rank });
        });
        continue;
      }
      const g = genderOf(label) ?? sectionGender;
      const slots = cells.slice(1, 4);
      const pod = [];
      let complete = slots.length === 3;
      slots.forEach((c, k) => {
        const p = medalist(c.v, c.perf);
        if (p) pod.push({ ...p, m: k + 1 });
        else if (!/not awarded/i.test(plain(c.v))) complete = false;
      });
      if (!pod.some((p) => p.m === 1)) complete = false;
      const core = tr(label).replace(/\b(men|women|boys|girls|mixed|open)('s)?\b/gi, '').replace(/\b(event|tournament|tournoi)\b/gi, '').trim();
      let name = core || (pod.some((p) => p.team || p.n === nocName(p.c)) || !pod.length ? 'Tournoi' : 'Individuel');
      name = name.charAt(0).toUpperCase() + name.slice(1);
      if (g && g[1] !== 'open') name += ` ${g[1]}`;
      const ev = { id: `${slug(en)}-${g ? g[2] : 'x'}-${slug(label)}`, disc, name, site, venue, pod, complete };
      events.push(ev);
      // Colonnes sans rowspan : ce sont elles que remplit la ligne suivante.
      const open = slots.map((c, k) => (c.span > 1 ? 0 : k + 1)).filter(Boolean);
      last = cells[0].span > 1 ? { ev, open } : null;
    }
  }
  return events;
}

async function main() {
  const fetchedAt = new Date().toISOString();
  const day = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Africa/Dakar' }).format(new Date());
  const events = [];
  const pending = [];
  const used = new Set();
  const sports = [];

  for (const s of SPORTS) {
    const title = s[0] + SUFFIX;
    let text;
    try {
      text = await wikitext(title);
    } catch (e) {
      console.warn(`! ${e.message}`);
      continue;
    }
    const list = parseSport(text, s);
    let done = 0;
    for (const { pod, complete, ...ses } of list) {
      const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`;
      const session = { ...ses, time: '', url };
      if (complete) {
        pod.forEach((p) => used.add(p.c));
        events.push({
          ...session,
          status: 'off',
          versions: [{ v: 1, at: day, by: 'Wikipédia', motif: null, valid: `Source Wikipédia · ${day}`, pod }],
        });
        done++;
      } else {
        pending.push(session);
      }
    }
    sports.push({ disc: s[1], site: s[2], venue: s[3] });
    console.log(`${s[1].padEnd(24)} ${String(done).padStart(3)} podiums, ${String(list.length - done).padStart(3)} à venir`);
    await new Promise((r) => setTimeout(r, 150)); // reste poli avec l'API
  }

  // Tous les pays connus (pour les listes de rectification), noms en français.
  const noc = Object.fromEntries(
    [...new Set([...Object.keys(IOC_ISO), ...Object.keys(NOC_OVERRIDE), ...used])]
      .map((c) => [c, nocName(c)])
      .sort((a, b) => a[1].localeCompare(b[1], 'fr')),
  );

  const out = {
    source: {
      name: 'Wikipédia',
      url: `https://en.wikipedia.org/wiki/2026_Summer_Youth_Olympics`,
      license: 'CC BY-SA 4.0',
      fetchedAt,
    },
    sites: ['Dakar', 'Diamniadio', 'Saly'],
    sports,
    noc,
    events,
    pending,
  };
  await writeFile(OUT, JSON.stringify(out, null, 1) + '\n');
  console.log(`\n${events.length} podiums, ${pending.length} épreuves à venir -> ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
